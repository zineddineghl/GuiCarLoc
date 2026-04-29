const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendNewBookingEmail, sendBookingConfirmedEmail, sendBookingRejectedEmail } = require('../mailer');

const router = express.Router();

// GET /api/bookings/notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const [pendingResult, unseenResult] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int as count FROM bookings b
        JOIN cars c ON b.car_id = c.id
        WHERE c.owner_id = $1 AND b.status = 'pending'
      `, [req.user.id]),
      pool.query(`
        SELECT COUNT(*)::int as count FROM bookings
        WHERE renter_id = $1 AND renter_seen = 0
      `, [req.user.id])
    ]);

    const pendingCount = pendingResult.rows[0].count || 0;
    const unseenCount = unseenResult.rows[0].count || 0;
    res.json({ total: pendingCount + unseenCount, pending_received: pendingCount, unseen_responses: unseenCount });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bookings/seen
router.put('/seen', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE bookings SET renter_seen = 1 WHERE renter_id = $1 AND renter_seen = 0', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { car_id, start_date, end_date, message } = req.body;

    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'car_id, start_date and end_date are required' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const { rows: carRows } = await pool.query('SELECT * FROM cars WHERE id = $1', [car_id]);
    const car = carRows[0];
    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (!car.available) return res.status(400).json({ error: 'Car is not available' });
    if (car.owner_id === req.user.id) return res.status(400).json({ error: 'You cannot book your own car' });

    const { rows: conflictRows } = await pool.query(`
      SELECT id FROM bookings
      WHERE car_id = $1 AND status IN ('pending', 'confirmed')
      AND NOT (end_date < $2 OR start_date > $3)
    `, [car_id, start_date, end_date]);

    if (conflictRows[0]) {
      return res.status(409).json({ error: 'Car is already booked for the selected dates' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total_price = days * car.price_per_day;

    const insertResult = await pool.query(`
      INSERT INTO bookings (car_id, renter_id, start_date, end_date, total_price, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [car_id, req.user.id, start_date, end_date, total_price, message || null]);

    const { rows: bookingRows } = await pool.query(`
      SELECT b.*, c.title as car_title, c.brand, c.model, c.city, c.images,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE b.id = $1
    `, [insertResult.rows[0].id]);

    const booking = bookingRows[0];

    sendNewBookingEmail({
      to: booking.owner_email,
      ownerName: booking.owner_name,
      renterName: req.user.name,
      carTitle: booking.car_title,
      startDate: booking.start_date,
      endDate: booking.end_date,
      totalPrice: booking.total_price,
    }).catch(() => {});

    res.status(201).json({ booking: parseBookingImages(booking) });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.year, c.city, c.images, c.price_per_day,
             c.owner_id,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             EXISTS(SELECT 1 FROM reviews rv WHERE rv.booking_id = b.id) as has_review
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE b.renter_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({ bookings: rows.map(parseBookingImages) });
  } catch (err) {
    console.error('Get my bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/received
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.year, c.city, c.images, c.price_per_day,
             u.name as renter_name, u.email as renter_email, u.phone as renter_phone
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.renter_id = u.id
      WHERE c.owner_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({ bookings: rows.map(parseBookingImages) });
  } catch (err) {
    console.error('Get received bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/car/:car_id/booked-dates
router.get('/car/:car_id/booked-dates', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT start_date, end_date FROM bookings
      WHERE car_id = $1 AND status IN ('pending', 'confirmed')
    `, [req.params.car_id]);
    res.json({ ranges: rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'rejected', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { rows: bookingRows } = await pool.query(`
      SELECT b.*, c.owner_id
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.id = $1
    `, [req.params.id]);

    const booking = bookingRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.owner_id === req.user.id;
    const isRenter = booking.renter_id === req.user.id;

    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Not authorized' });
    if ((status === 'confirmed' || status === 'rejected') && !isOwner) {
      return res.status(403).json({ error: 'Only the car owner can confirm or reject bookings' });
    }
    if (status === 'cancelled' && !isRenter) {
      return res.status(403).json({ error: 'Only the renter can cancel a booking' });
    }
    if (booking.status !== 'pending' && status !== 'cancelled') {
      return res.status(400).json({ error: 'Only pending bookings can be confirmed or rejected' });
    }

    const resetSeen = (status === 'confirmed' || status === 'rejected') ? 0 : 1;
    await pool.query('UPDATE bookings SET status = $1, renter_seen = $2 WHERE id = $3', [status, resetSeen, req.params.id]);

    const { rows: updatedRows } = await pool.query(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.city, c.images,
             u.name as renter_name, u.email as renter_email
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.renter_id = u.id
      WHERE b.id = $1
    `, [req.params.id]);

    const updated = updatedRows[0];

    if (status === 'confirmed') {
      sendBookingConfirmedEmail({
        to: updated.renter_email,
        renterName: updated.renter_name,
        carTitle: updated.car_title,
        startDate: updated.start_date,
        endDate: updated.end_date,
        totalPrice: updated.total_price,
      }).catch(() => {});
    } else if (status === 'rejected') {
      sendBookingRejectedEmail({
        to: updated.renter_email,
        renterName: updated.renter_name,
        carTitle: updated.car_title,
        startDate: updated.start_date,
        endDate: updated.end_date,
      }).catch(() => {});
    }

    res.json({ booking: parseBookingImages(updated) });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function parseBookingImages(booking) {
  if (!booking) return booking;
  try {
    return { ...booking, images: JSON.parse(booking.images || '[]') };
  } catch {
    return { ...booking, images: [] };
  }
}

module.exports = router;
