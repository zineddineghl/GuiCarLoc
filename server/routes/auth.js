const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { sendOTPEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rentcar_super_secret_key_2024';

// POST /api/auth/register
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

    // BYPASS TEMPORAIRE : On force email_verified à 1 par défaut au lieu de 0
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role, email_verified) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id, name, email, phone, role, created_at, email_verified',
      [name, email, password_hash, phone || null, role || 'renter']
    );
    const user = result.rows[0];

   
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000;
    await pool.query('UPDATE users SET email_verify_code = $1, email_verify_expires = $2 WHERE id = $3', [code, expires, user.id]);
    sendVerificationEmail(user.email, code).catch(err => console.error('[VERIFY] Email failed:', err.message));
    res.status(201).json({ requires_verification: true, userId: user.id });
    

    // NOUVEAU COMPORTEMENT : On connecte l'utilisateur directement après l'inscription
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
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

    if (user.two_fa_enabled) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000;
      await pool.query('UPDATE users SET two_fa_code = $1, two_fa_expires = $2 WHERE id = $3', [code, expires, user.id]);
      await sendOTPEmail(user.email, code);
      return res.json({ requires_2fa: true, userId: user.id });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, two_fa_code, two_fa_expires, email_verify_code, email_verify_expires, reset_token, reset_token_expires, ...userWithoutSensitive } = user;
    res.json({ token, user: userWithoutSensitive });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-2fa
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'Missing fields' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid' });

    if (!user.two_fa_code || !user.two_fa_expires) return res.status(401).json({ error: 'No pending code' });
    if (Date.now() > Number(user.two_fa_expires)) return res.status(401).json({ error: 'Code expired' });
    if (user.two_fa_code !== String(code)) return res.status(401).json({ error: 'Invalid code' });

    await pool.query('UPDATE users SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutSensitive } = user;
    res.json({ token, user: userWithoutSensitive });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-email (Laissé actif au cas où, ne gêne pas)
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'Missing fields' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid' });

    if (!user.email_verify_code || !user.email_verify_expires) {
      return res.status(401).json({ error: 'No pending verification' });
    }
    if (Date.now() > Number(user.email_verify_expires)) {
      return res.status(401).json({ error: 'Code expired' });
    }
    if (user.email_verify_code !== String(code)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await pool.query('UPDATE users SET email_verified = 1, email_verify_code = NULL, email_verify_expires = NULL WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_admin: user.is_admin || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutSensitive } = user;
    res.json({ token, user: { ...userWithoutSensitive, email_verified: 1 } });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/resend-verify (Laissé actif au cas où, ne gêne pas)
router.post('/resend-verify', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const { rows } = await pool.query('SELECT id, email, email_verified FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) return res.status(400).json({ error: 'Already verified' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000;
    await pool.query('UPDATE users SET email_verify_code = $1, email_verify_expires = $2 WHERE id = $3', [code, expires, user.id]);

    sendVerificationEmail(user.email, code).catch(err => console.error('[VERIFY] Resend failed:', err.message));
    res.json({ ok: true });
  } catch (err) {
    console.error('Resend verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, is_admin, banned, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!rows[0]) return res.json({ ok: true });

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000;

    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [token, expires, user.id]);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail({ to: user.email, name: user.name, resetLink })
      .catch(err => console.error('[RESET] Email failed:', err.message));

    res.json({ ok: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const { rows } = await pool.query('SELECT id, reset_token_expires FROM users WHERE reset_token = $1', [token]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (Date.now() > Number(rows[0].reset_token_expires)) return res.status(400).json({ error: 'Reset link has expired' });

    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [password_hash, rows[0].id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;