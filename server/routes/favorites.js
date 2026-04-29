const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, u.name as owner_name,
             ROUND(AVG(r.car_rating)::numeric, 1) as avg_car_rating,
             COUNT(r.id)::int as review_count
      FROM favorites f
      JOIN cars c ON f.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON r.car_id = c.id
      WHERE f.user_id = $1
      GROUP BY c.id, u.name, f.created_at
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    const safeParseJSON = (str) => { try { return JSON.parse(str); } catch { return []; } };
    res.json({ cars: rows.map(car => ({ ...car, images: safeParseJSON(car.images) })) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/favorites/ids
router.get('/ids', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT car_id FROM favorites WHERE user_id = $1', [req.user.id]);
    res.json({ ids: rows.map(r => r.car_id) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/favorites/:carId
router.post('/:carId', authenticateToken, async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const { rows } = await pool.query('SELECT id FROM cars WHERE id = $1', [carId]);
    if (!rows[0]) return res.status(404).json({ error: 'Car not found' });

    try {
      await pool.query('INSERT INTO favorites (user_id, car_id) VALUES ($1, $2)', [req.user.id, carId]);
    } catch {
      // Already favorited (UNIQUE constraint) — fine
    }
    res.json({ favorited: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/favorites/:carId
router.delete('/:carId', authenticateToken, async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND car_id = $2', [req.user.id, carId]);
    res.json({ favorited: false });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
