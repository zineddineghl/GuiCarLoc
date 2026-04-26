const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOTPEmail } = require('../mailer');

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

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, email, password_hash, phone || null, role || 'renter');

    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(Number(result.lastInsertRowid));

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
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

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2FA check
    if (user.two_fa_enabled) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      db.prepare('UPDATE users SET two_fa_code = ?, two_fa_expires = ? WHERE id = ?')
        .run(code, expires, user.id);
      await sendOTPEmail(user.email, code);
      return res.json({ requires_2fa: true, userId: user.id });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, two_fa_code, two_fa_expires, ...userWithoutSensitive } = user;
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
    if (!userId || !code) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid' });
    }

    if (!user.two_fa_code || !user.two_fa_expires) {
      return res.status(401).json({ error: 'No pending code' });
    }

    if (Date.now() > user.two_fa_expires) {
      return res.status(401).json({ error: 'Code expired' });
    }

    if (user.two_fa_code !== String(code)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Clear the OTP
    db.prepare('UPDATE users SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = ?').run(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, two_fa_code, two_fa_expires, ...userWithoutSensitive } = user;
    res.json({ token, user: userWithoutSensitive });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
