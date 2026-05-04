const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { sendOTPEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rentcar_super_secret_key_2024';

// ==========================================
// 1. INSCRIPTION (REGISTER)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (!['owner', 'renter', 'both'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be owner, renter, or both' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 8);

    // email_verified est mis à 0 pour bloquer le compte par défaut
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role, email_verified) VALUES ($1, $2, $3, $4, $5, 0) RETURNING id, name, email, phone, role, created_at, email_verified',
      [name, email, password_hash, phone || null, role || 'renter']
    );
    const user = result.rows[0];

    // Génération du code de vérification à 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000; // Expire dans 10 minutes
    await pool.query('UPDATE users SET email_verify_code = $1, email_verify_expires = $2 WHERE id = $3', [code, expires, user.id]);
    
    // FIX : Envoi de l'email géré de façon isolée (non-bloquante)
    sendVerificationEmail(user.email, code).catch(err => {
      console.error('[VERIFY] Non-fatal email error:', err.message);
    });
    
    // On répond au client immédiatement
    return res.status(201).json({ requires_verification: true, userId: user.id });

  } catch (err) {
    console.error('Register error:', err);
    // FIX : On s'assure que la réponse n'a pas déjà été envoyée avant de renvoyer une erreur 500
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ==========================================
// 2. CONNEXION (LOGIN)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // BLOCAGE : Impossible de se connecter si l'email n'est pas vérifié
    if (user.email_verified === 0 || user.email_verified === false) {
      return res.status(403).json({ 
        error: 'Veuillez vérifier votre email avant de vous connecter',
        requires_verification: true, 
        userId: user.id 
      });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    // Gestion de la Double Authentification (2FA) si activée
    if (user.two_fa_enabled) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000;
      await pool.query('UPDATE users SET two_fa_code = $1, two_fa_expires = $2 WHERE id = $3', [code, expires, user.id]);
      
      // FIX : Email 2FA en mode non-bloquant
      sendOTPEmail(user.email, code).catch(err => console.error('[2FA] Non-fatal email error:', err.message));
      
      return res.json({ requires_2fa: true, userId: user.id });
    }

    // Connexion réussie : Génération du Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, two_fa_code, two_fa_expires, email_verify_code, email_verify_expires, reset_token, reset_token_expires, ...userWithoutSensitive } = user;
    return res.json({ token, user: userWithoutSensitive });
  } catch (err) {
    console.error('Login error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ==========================================
// 3. VÉRIFICATION DU CODE EMAIL
// ==========================================
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'Missing fields' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    if (!user.email_verify_code || !user.email_verify_expires) {
      return res.status(401).json({ error: 'No pending verification' });
    }
    if (Date.now() > Number(user.email_verify_expires)) {
      return res.status(401).json({ error: 'Code expired' });
    }
    if (user.email_verify_code !== String(code)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Validation du compte
    await pool.query('UPDATE users SET email_verified = 1, email_verify_code = NULL, email_verify_expires = NULL WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, email_verify_code, email_verify_expires, two_fa_code, two_fa_expires, reset_token, reset_token_expires, ...userWithoutSensitive } = user;
    return res.json({ token, user: { ...userWithoutSensitive, email_verified: 1 } });
  } catch (err) {
    console.error('Verify email error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ==========================================
// 4. AUTRES ROUTES (2FA, MDP OUBLIÉ, PROFIL)
// ==========================================

router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    
    if (!user || user.two_fa_code !== String(code) || Date.now() > Number(user.two_fa_expires)) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }
    
    await pool.query('UPDATE users SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password_hash, two_fa_code, two_fa_expires, ...userWithoutSensitive } = user;
    return res.json({ token, user: userWithoutSensitive });
  } catch (err) { 
    console.error('2FA error:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Error' }); 
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!rows[0]) return res.json({ ok: true }); // On répond toujours OK pour la sécurité
    
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000;
    
    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [token, expires, user.id]);
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    sendPasswordResetEmail({ to: user.email, name: user.name, resetLink })
      .catch(err => console.error('[RESET] Non-fatal email error:', err.message));
      
    return res.json({ ok: true });
  } catch (err) { 
    console.error('Forgot password error:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Error' }); 
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) return res.status(400).json({ error: 'Invalid request' });

    const { rows } = await pool.query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > $2', [token, Date.now()]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired token' });
    
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, rows[0].id]);
    
    return res.json({ ok: true });
  } catch (err) { 
    console.error('Reset password error:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Error' }); 
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email, role, is_admin, email_verified, banned, id_status FROM users WHERE id = $1', [decoded.id]);
    
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) { 
    return res.status(403).json({ error: 'Invalid token' }); 
  }
});

module.exports = router;