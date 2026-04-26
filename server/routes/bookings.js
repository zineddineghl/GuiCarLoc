const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings/notifications - get notification count
router.get('/notifications', authenticateToken, (req, res) => {
  try {
    // Pending bookings received as owner (need to respond)
    const pendingReceived = db.prepare(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE c.owner_id = ? AND b.status = 'pending'
    `).get(req.user.id);

    // Responses not yet seen by renter (confirmed or rejected, renter_seen = 0)
    const unseenResponses = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE renter_id = ? AND renter_seen = 0
    `).get(req.user.id);

    const total = (pendingReceived?.count || 0) + (unseenResponses?.count || 0);
    res.json({ total, pending_received: pendingReceived?.count || 0, unseen_responses: unseenResponses?.count || 0 });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bookings/seen - mark renter's responses as seen
router.put('/seen', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE bookings SET renter_seen = 1 WHERE renter_id = ? AND renter_seen = 0').run(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings - create a booking request (auth required)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { car_id, start_date, end_date, message } = req.body;

    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'car_id, start_date and end_date are required' });
    }

    // Validate dates
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

    // Check car exists and is available
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(car_id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (!car.available) {
      return res.status(400).json({ error: 'Car is not available' });
    }

    // Check that renter is not the owner
    if (car.owner_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own car' });
    }

    // Check for conflicting bookings
    const conflict = db.prepare(`
      SELECT id FROM bookings
      WHERE car_id = ?
      AND status IN ('pending', 'confirmed')
      AND NOT (end_date < ? OR start_date > ?)
    `).get(car_id, start_date, end_date);

    if (conflict) {
      return res.status(409).json({ error: 'Car is already booked for the selected dates' });
    }

    // Calculate total price
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total_price = days * car.price_per_day;

    const stmt = db.prepare(`
      INSERT INTO bookings (car_id, renter_id, start_date, end_date, total_price, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(car_id, req.user.id, start_date, end_date, total_price, message || null);

    const booking = db.prepare(`
      SELECT b.*, c.title as car_title, c.brand, c.model, c.city, c.images,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE b.id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json({ booking: parseBookingImages(booking) });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/my - get my bookings as renter (auth required)
router.get('/my', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.year, c.city, c.images, c.price_per_day,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             EXISTS(SELECT 1 FROM reviews rv WHERE rv.booking_id = b.id) as has_review
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE b.renter_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    res.json({ bookings: bookings.map(parseBookingImages) });
  } catch (err) {
    console.error('Get my bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/received - get bookings received as owner (auth required)
router.get('/received', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.year, c.city, c.images, c.price_per_day,
             u.name as renter_name, u.email as renter_email, u.phone as renter_phone
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.renter_id = u.id
      WHERE c.owner_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    res.json({ bookings: bookings.map(parseBookingImages) });
  } catch (err) {
    console.error('Get received bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/car/:car_id/booked-dates - public, returns booked date ranges
router.get('/car/:car_id/booked-dates', (req, res) => {
  try {
    const ranges = db.prepare(`
      SELECT start_date, end_date FROM bookings
      WHERE car_id = ? AND status IN ('pending', 'confirmed')
    `).all(req.params.car_id);
    res.json({ ranges });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bookings/:id/status - update booking status (auth, owner only)
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'rejected', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be confirmed, rejected, or cancelled' });
    }

    const booking = db.prepare(`
      SELECT b.*, c.owner_id
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Owner can confirm/reject; renter can cancel their own
    const isOwner = booking.owner_id === req.user.id;
    const isRenter = booking.renter_id === req.user.id;

    if (!isOwner && !isRenter) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if ((status === 'confirmed' || status === 'rejected') && !isOwner) {
      return res.status(403).json({ error: 'Only the car owner can confirm or reject bookings' });
    }

    if (status === 'cancelled' && !isRenter) {
      return res.status(403).json({ error: 'Only the renter can cancel a booking' });
    }

    if (booking.status !== 'pending' && status !== 'cancelled') {
      return res.status(400).json({ error: 'Only pending bookings can be confirmed or rejected' });
    }

    // If owner responds, mark as unseen for renter
    const resetSeen = (status === 'confirmed' || status === 'rejected') ? 0 : 1;
    db.prepare('UPDATE bookings SET status = ?, renter_seen = ? WHERE id = ?').run(status, resetSeen, req.params.id);

    const updatedBooking = db.prepare(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.city, c.images,
             u.name as renter_name, u.email as renter_email
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.renter_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    res.json({ booking: parseBookingImages(updatedBooking) });
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
