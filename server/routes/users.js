const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'guicarloc/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const kycUpload = multer({
  storage: kycStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image files only'));
  }
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'guicarloc/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image files only'));
  }
});

// POST /api/users/me/verify-identity
router.post('/me/verify-identity', authenticateToken, (req, res) => {
  kycUpload.fields([
    { name: 'id_doc_front', maxCount: 1 },
    { name: 'id_doc_back', maxCount: 1 },
    { name: 'id_selfie', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { id_doc_front, id_doc_back, id_selfie } = req.files || {};
    if (!id_doc_front || !id_doc_back || !id_selfie) {
      return res.status(400).json({ error: 'Les 3 documents sont requis (CNI recto, verso, selfie)' });
    }
    try {
      await pool.query(
        'UPDATE users SET id_doc_front = $1, id_doc_back = $2, id_selfie = $3, id_status = $4, id_rejection_reason = NULL, id_submitted_at = NOW() WHERE id = $5',
        [id_doc_front[0].path, id_doc_back[0].path, id_selfie[0].path, 'pending', req.user.id]
      );
      res.json({ ok: true, id_status: 'pending' });
    } catch (dbErr) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// POST /api/users/me/avatar
router.post('/me/avatar', authenticateToken, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [req.file.path, req.user.id]);
    res.json({ avatar: req.file.path });
  });
});

// PUT /api/users/me/push-token
router.put('/me/push-token', authenticateToken, async (req, res) => {
  const { token: pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'Token requis' });
  try {
    await pool.query('UPDATE users SET expo_push_token = $1 WHERE id = $2', [pushToken, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me/2fa
router.put('/me/2fa', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT two_fa_enabled FROM users WHERE id = $1', [req.user.id]);
    const newValue = rows[0].two_fa_enabled ? 0 : 1;
    await pool.query('UPDATE users SET two_fa_enabled = $1 WHERE id = $2', [newValue, req.user.id]);
    res.json({ two_fa_enabled: newValue });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, bio, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    await pool.query('UPDATE users SET name = $1, bio = $2, phone = $3 WHERE id = $4', [name.trim(), bio || null, phone || null, req.user.id]);
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, bio, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      'SELECT id, name, role, bio, avatar, two_fa_enabled, id_status, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userRows[0]) return res.status(404).json({ error: 'User not found' });

    const [ratingResult, listingsCountResult, listingsResult, reviewsResult] = await Promise.all([
      pool.query(`
        SELECT ROUND(AVG(owner_rating)::numeric, 1) as avg_owner_rating, COUNT(*)::int as review_count
        FROM reviews WHERE owner_id = $1
      `, [req.params.id]),
      pool.query('SELECT COUNT(*)::int as count FROM cars WHERE owner_id = $1', [req.params.id]),
      pool.query(`
        SELECT c.id, c.title, c.brand, c.model, c.year, c.type, c.price_per_day,
               c.city, c.images, c.available,
               ROUND(AVG(r.car_rating)::numeric, 1) as avg_car_rating,
               COUNT(r.id)::int as review_count
        FROM cars c
        LEFT JOIN reviews r ON r.car_id = c.id
        WHERE c.owner_id = $1 AND c.available = 1
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 6
      `, [req.params.id]),
      pool.query(`
        SELECT rv.id, rv.car_rating, rv.owner_rating, rv.comment, rv.created_at,
               u.name as reviewer_name, c.title as car_title, c.id as car_id
        FROM reviews rv
        JOIN users u ON rv.reviewer_id = u.id
        JOIN cars c ON rv.car_id = c.id
        WHERE rv.owner_id = $1
        ORDER BY rv.created_at DESC
        LIMIT 10
      `, [req.params.id])
    ]);

    res.json({
      user: {
        ...userRows[0],
        avg_owner_rating: ratingResult.rows[0]?.avg_owner_rating || null,
        review_count: ratingResult.rows[0]?.review_count || 0,
        listings_count: listingsCountResult.rows[0]?.count || 0,
      },
      listings: listingsResult.rows.map(l => ({ ...l, images: JSON.parse(l.images || '[]') })),
      reviews: reviewsResult.rows,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
