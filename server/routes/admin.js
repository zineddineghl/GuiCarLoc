const express = require('express');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

router.use(authenticateAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      usersResult, newUsersResult, carsResult, activeCarsResult,
      bookingsResult, pendingResult, revenueResult, monthRevenueResult,
      bannedResult, signupsResult, revenueStatResult, recentBookingsResult, recentUsersResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM users'),
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"),
      pool.query('SELECT COUNT(*)::int as count FROM cars'),
      pool.query('SELECT COUNT(*)::int as count FROM cars WHERE available = 1'),
      pool.query('SELECT COUNT(*)::int as count FROM bookings'),
      pool.query("SELECT COUNT(*)::int as count FROM bookings WHERE status = 'pending'"),
      pool.query("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'confirmed'"),
      pool.query("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'confirmed' AND start_date::date >= (NOW() - INTERVAL '30 days')::date"),
      pool.query('SELECT COUNT(*)::int as count FROM users WHERE banned = 1'),
      pool.query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `),
      pool.query(`
        SELECT TO_CHAR(start_date::date, 'YYYY-MM') as month, ROUND(SUM(total_price)::numeric, 0) as revenue
        FROM bookings
        WHERE status = 'confirmed' AND start_date::date >= (NOW() - INTERVAL '6 months')::date
        GROUP BY TO_CHAR(start_date::date, 'YYYY-MM')
        ORDER BY month ASC
      `),
      pool.query(`
        SELECT b.id, b.status, b.total_price, b.created_at,
               c.title as car_title, u.name as renter_name, o.name as owner_name
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u ON b.renter_id = u.id
        JOIN users o ON c.owner_id = o.id
        ORDER BY b.created_at DESC
        LIMIT 8
      `),
      pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5')
    ]);

    res.json({
      summary: {
        total_users: usersResult.rows[0].count,
        new_users_month: newUsersResult.rows[0].count,
        banned_users: bannedResult.rows[0].count,
        total_cars: carsResult.rows[0].count,
        active_cars: activeCarsResult.rows[0].count,
        total_bookings: bookingsResult.rows[0].count,
        pending_bookings: pendingResult.rows[0].count,
        total_revenue: Math.round(parseFloat(revenueResult.rows[0].total)),
        month_revenue: Math.round(parseFloat(monthRevenueResult.rows[0].total)),
      },
      monthly_signups: signupsResult.rows,
      monthly_revenue: revenueStatResult.rows,
      recent_bookings: recentBookingsResult.rows,
      recent_users: recentUsersResult.rows,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, role, banned, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      where += ` AND (u.name ILIKE $${idx++} OR u.email ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ` AND u.role = $${idx++}`;
      params.push(role);
    }
    if (banned !== undefined && banned !== '') {
      where += ` AND u.banned = $${idx++}`;
      params.push(parseInt(banned));
    }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM users u ${where}`, params);

    const usersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_admin, u.banned, u.created_at,
             (SELECT COUNT(*)::int FROM cars WHERE owner_id = u.id) as car_count,
             (SELECT COUNT(*)::int FROM bookings WHERE renter_id = u.id) as booking_count
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), offset]);

    res.json({ users: usersResult.rows, total: countResult.rows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { banned, is_admin, role } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot modify your own admin account' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const updates = [];
    const params = [];
    let idx = 1;

    if (banned !== undefined) { updates.push(`banned = $${idx++}`); params.push(banned ? 1 : 0); }
    if (is_admin !== undefined) { updates.push(`is_admin = $${idx++}`); params.push(is_admin ? 1 : 0); }
    if (role !== undefined) { updates.push(`role = $${idx++}`); params.push(role); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    const { rows: updated } = await pool.query(
      'SELECT id, name, email, phone, role, is_admin, banned, created_at FROM users WHERE id = $1',
      [userId]
    );
    res.json({ user: updated[0] });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/cars
router.get('/cars', async (req, res) => {
  try {
    const { search, type, available, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      where += ` AND (c.title ILIKE $${idx++} OR c.brand ILIKE $${idx++} OR c.city ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) { where += ` AND c.type = $${idx++}`; params.push(type); }
    if (available !== undefined && available !== '') { where += ` AND c.available = $${idx++}`; params.push(parseInt(available)); }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM cars c ${where}`, params);

    const carsResult = await pool.query(`
      SELECT c.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*)::int FROM bookings WHERE car_id = c.id) as booking_count
      FROM cars c
      JOIN users u ON c.owner_id = u.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), offset]);

    const parsed = carsResult.rows.map(car => ({
      ...car,
      images: (() => { try { return JSON.parse(car.images || '[]'); } catch { return []; } })(),
    }));

    res.json({ cars: parsed, total: countResult.rows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Admin get cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/cars/:id
router.put('/cars/:id', async (req, res) => {
  try {
    const { available } = req.body;
    const { rows } = await pool.query('SELECT id FROM cars WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Car not found' });

    const { rows: updated } = await pool.query(
      'UPDATE cars SET available = $1 WHERE id = $2 RETURNING *',
      [available ? 1 : 0, req.params.id]
    );
    res.json({ car: { ...updated[0], images: (() => { try { return JSON.parse(updated[0].images || '[]'); } catch { return []; } })() } });
  } catch (err) {
    console.error('Admin update car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/cars/:id
router.delete('/cars/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    const car = rows[0];
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const images = (() => { try { return JSON.parse(car.images || '[]'); } catch { return []; } })();
    images.forEach(filename => {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await pool.query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status) { where += ` AND b.status = $${idx++}`; params.push(status); }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM bookings b ${where}`, params);

    const bookingsResult = await pool.query(`
      SELECT b.*,
             c.title as car_title, c.brand, c.model, c.images,
             renter.name as renter_name, renter.email as renter_email,
             owner.name as owner_name, owner.email as owner_email
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users renter ON b.renter_id = renter.id
      JOIN users owner ON c.owner_id = owner.id
      ${where}
      ORDER BY b.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), offset]);

    const parsed = bookingsResult.rows.map(b => ({
      ...b,
      images: (() => { try { return JSON.parse(b.images || '[]'); } catch { return []; } })(),
    }));

    res.json({ bookings: parsed, total: countResult.rows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Admin get bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/bookings/:id
router.put('/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'rejected', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { rows } = await pool.query('SELECT id FROM bookings WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });

    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin update booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/verifications?status=pending|verified|rejected
router.get('/verifications', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows } = await pool.query(`
      SELECT id, name, email, phone, id_doc_front, id_doc_back, id_selfie, id_status, id_rejection_reason, id_submitted_at
      FROM users
      WHERE id_status = $1
      ORDER BY id_submitted_at DESC
      LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), offset]);
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*)::int as total FROM users WHERE id_status = $1', [status]
    );
    res.json({ users: rows, total: countRows[0].total });
  } catch (err) {
    console.error('Admin verifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/verifications/:id
router.put('/verifications/:id', async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }
    const id_status = action === 'approve' ? 'verified' : 'rejected';

    // Récupérer les URLs des photos avant de les effacer
    const { rows } = await pool.query(
      'SELECT id_doc_front, id_doc_back, id_selfie FROM users WHERE id = $1',
      [req.params.id]
    );
    const user = rows[0];

    // Supprimer les photos Cloudinary
    if (user) {
      const urls = [user.id_doc_front, user.id_doc_back, user.id_selfie].filter(Boolean);
      await Promise.allSettled(urls.map(url => {
        const parts = url.split('/');
        const idx = parts.indexOf('guicarloc');
        if (idx === -1) return Promise.resolve();
        const publicId = parts.slice(idx).join('/').replace(/\.[^/.]+$/, '');
        return cloudinary.uploader.destroy(publicId);
      }));
    }

    // Mettre à jour le statut et effacer les colonnes photos
    await pool.query(
      'UPDATE users SET id_status = $1, id_rejection_reason = $2, id_doc_front = NULL, id_doc_back = NULL, id_selfie = NULL WHERE id = $3',
      [id_status, reason || null, req.params.id]
    );
    res.json({ ok: true, id_status });
  } catch (err) {
    console.error('Admin verify user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
