const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'car-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

function withUpload(req, res, next) {
  upload.array('images', 8)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload error' });
    next();
  });
}

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/cars
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, city, start_date, end_date, min_price, max_price, transmission, fuel, seats } = req.query;

    let query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email, u.avatar as owner_avatar,
             ROUND(AVG(r.car_rating)::numeric, 1) as avg_car_rating,
             COUNT(r.id)::int as review_count
      FROM cars c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON r.car_id = c.id
      WHERE c.available = 1
    `;
    const params = [];
    let idx = 1;

    if (type && type !== 'all') {
      query += ` AND c.type = $${idx++}`;
      params.push(type);
    }
    if (city) {
      query += ` AND c.city ILIKE $${idx++}`;
      params.push(`%${city}%`);
    }
    if (min_price) {
      query += ` AND c.price_per_day >= $${idx++}`;
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      query += ` AND c.price_per_day <= $${idx++}`;
      params.push(parseFloat(max_price));
    }
    if (transmission) {
      query += ` AND c.transmission = $${idx++}`;
      params.push(transmission);
    }
    if (fuel) {
      query += ` AND c.fuel = $${idx++}`;
      params.push(fuel);
    }
    if (seats) {
      query += ` AND c.seats >= $${idx++}`;
      params.push(parseInt(seats));
    }
    if (start_date && end_date) {
      query += `
        AND c.id NOT IN (
          SELECT car_id FROM bookings
          WHERE status IN ('pending', 'confirmed')
          AND NOT (end_date < $${idx++} OR start_date > $${idx++})
        )
      `;
      params.push(start_date, end_date);
    }

    query += ' GROUP BY c.id, u.name, u.phone, u.email, u.avatar ORDER BY c.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ cars: rows.map(car => ({ ...car, images: safeParseJSON(car.images, []) })) });
  } catch (err) {
    console.error('Get cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/my/listings
router.get('/my/listings', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM bookings b WHERE b.car_id = c.id) as total_bookings,
        (SELECT COUNT(*)::int FROM bookings b WHERE b.car_id = c.id AND b.status = 'pending') as pending_bookings
      FROM cars c
      WHERE c.owner_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({ cars: rows.map(car => ({ ...car, images: safeParseJSON(car.images, []) })) });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email, u.avatar as owner_avatar,
             ROUND(AVG(r.car_rating)::numeric, 1) as avg_car_rating,
             COUNT(r.id)::int as review_count,
             ROUND(AVG(r2.owner_rating)::numeric, 1) as avg_owner_rating
      FROM cars c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON r.car_id = c.id
      LEFT JOIN reviews r2 ON r2.owner_id = c.owner_id
      WHERE c.id = $1
      GROUP BY c.id, u.name, u.phone, u.email, u.avatar
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Car not found' });

    res.json({ car: { ...rows[0], images: safeParseJSON(rows[0].images, []) } });
  } catch (err) {
    console.error('Get car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cars
router.post('/', authenticateToken, withUpload, async (req, res) => {
  try {
    const { title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address } = req.body;

    if (!title || !type || !brand || !model || !year || !price_per_day || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['sedan', 'suv', 'van', 'sports', 'luxury', 'economy'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid car type' });
    }

    const images = req.files ? req.files.map(f => f.filename) : [];

    const { rows } = await pool.query(`
      INSERT INTO cars (owner_id, title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [req.user.id, title, description || null, type, brand, model, parseInt(year),
        parseInt(seats) || 5, transmission || 'auto', fuel || 'petrol',
        parseFloat(price_per_day), city, address || null, JSON.stringify(images)]);

    res.status(201).json({ car: { ...rows[0], images: safeParseJSON(rows[0].images, []) } });
  } catch (err) {
    console.error('Create car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cars/:id
router.put('/:id', authenticateToken, withUpload, async (req, res) => {
  try {
    const { rows: carRows } = await pool.query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    const car = carRows[0];

    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (car.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to edit this listing' });

    const { title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, available, existing_images } = req.body;

    let images = safeParseJSON(car.images, []);
    if (existing_images !== undefined) {
      images = safeParseJSON(existing_images, []);
    }
    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map(f => f.filename)];
    }

    const { rows } = await pool.query(`
      UPDATE cars SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        brand = COALESCE($4, brand),
        model = COALESCE($5, model),
        year = COALESCE($6, year),
        seats = COALESCE($7, seats),
        transmission = COALESCE($8, transmission),
        fuel = COALESCE($9, fuel),
        price_per_day = COALESCE($10, price_per_day),
        city = COALESCE($11, city),
        address = COALESCE($12, address),
        images = $13,
        available = COALESCE($14, available)
      WHERE id = $15
      RETURNING *
    `, [
      title || null, description || null, type || null, brand || null, model || null,
      year ? parseInt(year) : null, seats ? parseInt(seats) : null,
      transmission || null, fuel || null, price_per_day ? parseFloat(price_per_day) : null,
      city || null, address || null, JSON.stringify(images),
      available !== undefined ? (available === 'true' || available === true ? 1 : 0) : null,
      req.params.id
    ]);

    res.json({ car: { ...rows[0], images: safeParseJSON(rows[0].images, []) } });
  } catch (err) {
    console.error('Update car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cars/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    const car = rows[0];

    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (car.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this listing' });

    const images = safeParseJSON(car.images, []);
    images.forEach(filename => {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await pool.query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ message: 'Car listing deleted successfully' });
  } catch (err) {
    console.error('Delete car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:id/blocked-dates (public)
router.get('/:id/blocked-dates', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, start_date, end_date FROM blocked_dates WHERE car_id = $1 ORDER BY start_date',
      [req.params.id]
    );
    res.json({ blocked: rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cars/:id/blocked-dates (owner only)
router.post('/:id/blocked-dates', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date || start_date > end_date) {
      return res.status(400).json({ error: 'Dates invalides' });
    }
    const { rows: carRows } = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [req.params.id]);
    if (!carRows.length || carRows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    const { rows } = await pool.query(
      'INSERT INTO blocked_dates (car_id, start_date, end_date) VALUES ($1, $2, $3) RETURNING id, start_date, end_date',
      [req.params.id, start_date, end_date]
    );
    res.json({ block: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cars/:id/blocked-dates/:blockId (owner only)
router.delete('/:id/blocked-dates/:blockId', authenticateToken, async (req, res) => {
  try {
    const { rows: carRows } = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [req.params.id]);
    if (!carRows.length || carRows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    await pool.query('DELETE FROM blocked_dates WHERE id = $1 AND car_id = $2', [req.params.blockId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
