const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, car_rating, owner_rating, comment } = req.body;

    if (!booking_id || !car_rating || !owner_rating) {
      return res.status(400).json({ error: 'booking_id, car_rating and owner_rating are required' });
    }

    const carR = parseInt(car_rating);
    const ownerR = parseInt(owner_rating);

    if (carR < 1 || carR > 5 || ownerR < 1 || ownerR > 5) {
      return res.status(400).json({ error: 'Ratings must be between 1 and 5' });
    }

    const { rows: bookingRows } = await pool.query(`
      SELECT b.*, c.owner_id as car_owner_id
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.id = $1
    `, [booking_id]);

    const booking = bookingRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renter_id !== req.user.id) return res.status(403).json({ error: 'Only the renter can leave a review' });
    if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Can only review confirmed bookings' });
    if (new Date(booking.end_date) >= new Date()) return res.status(400).json({ error: 'Booking must be completed before reviewing' });

    const { rows: existing } = await pool.query('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
    if (existing[0]) return res.status(409).json({ error: 'You have already reviewed this booking' });

    const { rows } = await pool.query(`
      INSERT INTO reviews (booking_id, reviewer_id, car_id, owner_id, car_rating, owner_rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [booking_id, req.user.id, booking.car_id, booking.car_owner_id, carR, ownerR, comment || null]);

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reviews/car/:car_id
router.get('/car/:car_id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.car_rating, r.owner_rating, r.comment, r.created_at,
             u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.car_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.car_id]);

    res.json({ reviews: rows });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
