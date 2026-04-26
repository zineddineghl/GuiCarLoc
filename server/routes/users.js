const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image files only'));
  }
});

// POST /api/users/me/avatar - upload profile photo
router.post('/me/avatar', authenticateToken, (req, res) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(req.file.filename, req.user.id);
    res.json({ avatar: req.file.filename });
  });
});

// PUT /api/users/me/2fa - toggle 2FA on/off (must be before /:id)
router.put('/me/2fa', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT two_fa_enabled FROM users WHERE id = ?').get(req.user.id);
  const newValue = user.two_fa_enabled ? 0 : 1;
  db.prepare('UPDATE users SET two_fa_enabled = ? WHERE id = ?').run(newValue, req.user.id);
  res.json({ two_fa_enabled: newValue });
});

// PUT /api/users/me - update own profile (must be before /:id)
router.put('/me', authenticateToken, (req, res) => {
  const { name, bio, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  db.prepare('UPDATE users SET name = ?, bio = ?, phone = ? WHERE id = ?')
    .run(name.trim(), bio || null, phone || null, req.user.id);
  const user = db.prepare(
    'SELECT id, name, email, phone, role, bio, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json({ user });
});

// GET /api/users/:id - public profile
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, name, role, bio, avatar, two_fa_enabled, created_at FROM users WHERE id = ?'
  ).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const ratingRow = db.prepare(`
    SELECT ROUND(AVG(owner_rating), 1) as avg_owner_rating, COUNT(*) as review_count
    FROM reviews WHERE owner_id = ?
  `).get(req.params.id);

  const listingsCount = db.prepare(
    'SELECT COUNT(*) as count FROM cars WHERE owner_id = ?'
  ).get(req.params.id);

  const listings = db.prepare(`
    SELECT c.id, c.title, c.brand, c.model, c.year, c.type, c.price_per_day,
           c.city, c.images, c.available,
           ROUND(AVG(r.car_rating), 1) as avg_car_rating,
           COUNT(r.id) as review_count
    FROM cars c
    LEFT JOIN reviews r ON r.car_id = c.id
    WHERE c.owner_id = ? AND c.available = 1
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 6
  `).all(req.params.id);

  const reviews = db.prepare(`
    SELECT rv.id, rv.car_rating, rv.owner_rating, rv.comment, rv.created_at,
           u.name as reviewer_name, c.title as car_title, c.id as car_id
    FROM reviews rv
    JOIN users u ON rv.reviewer_id = u.id
    JOIN cars c ON rv.car_id = c.id
    WHERE rv.owner_id = ?
    ORDER BY rv.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({
    user: {
      ...user,
      avg_owner_rating: ratingRow?.avg_owner_rating || null,
      review_count: ratingRow?.review_count || 0,
      listings_count: listingsCount?.count || 0,
    },
    listings: listings.map(l => ({ ...l, images: JSON.parse(l.images || '[]') })),
    reviews,
  });
});

module.exports = router;
