const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
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
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/cars - list cars with filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { type, city, start_date, end_date, min_price, max_price, transmission, fuel, seats } = req.query;

    let query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email, u.avatar as owner_avatar,
             ROUND(AVG(r.car_rating), 1) as avg_car_rating,
             COUNT(r.id) as review_count
      FROM cars c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON r.car_id = c.id
      WHERE c.available = 1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND c.type = ?';
      params.push(type);
    }

    if (city) {
      query += ' AND LOWER(c.city) LIKE LOWER(?)';
      params.push(`%${city}%`);
    }

    if (min_price) {
      query += ' AND c.price_per_day >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ' AND c.price_per_day <= ?';
      params.push(parseFloat(max_price));
    }

    if (transmission) {
      query += ' AND c.transmission = ?';
      params.push(transmission);
    }

    if (fuel) {
      query += ' AND c.fuel = ?';
      params.push(fuel);
    }

    if (seats) {
      query += ' AND c.seats >= ?';
      params.push(parseInt(seats));
    }

    // If date range provided, exclude cars with confirmed bookings in that range
    if (start_date && end_date) {
      query += `
        AND c.id NOT IN (
          SELECT car_id FROM bookings
          WHERE status IN ('pending', 'confirmed')
          AND NOT (end_date < ? OR start_date > ?)
        )
      `;
      params.push(start_date, end_date);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const cars = db.prepare(query).all(...params);

    // Parse images JSON for each car
    const parsedCars = cars.map(car => ({
      ...car,
      images: safeParseJSON(car.images, [])
    }));

    res.json({ cars: parsedCars });
  } catch (err) {
    console.error('Get cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/my/listings - get my listings (auth required)
router.get('/my/listings', authenticateToken, (req, res) => {
  try {
    const cars = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id) as total_bookings,
        (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id AND b.status = 'pending') as pending_bookings
      FROM cars c
      WHERE c.owner_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    const parsedCars = cars.map(car => ({
      ...car,
      images: safeParseJSON(car.images, [])
    }));

    res.json({ cars: parsedCars });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:id - get single car
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const car = db.prepare(`
      SELECT c.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email, u.avatar as owner_avatar,
             ROUND(AVG(r.car_rating), 1) as avg_car_rating,
             COUNT(r.id) as review_count,
             ROUND(AVG(r2.owner_rating), 1) as avg_owner_rating
      FROM cars c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON r.car_id = c.id
      LEFT JOIN reviews r2 ON r2.owner_id = c.owner_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(req.params.id);

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const parsedCar = {
      ...car,
      images: safeParseJSON(car.images, [])
    };

    res.json({ car: parsedCar });
  } catch (err) {
    console.error('Get car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handler wrapper
function withUpload(req, res, next) {
  upload.array('images', 8)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
}

// POST /api/cars - create listing (auth required)
router.post('/', authenticateToken, withUpload, (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO cars (owner_id, title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      title,
      description || null,
      type,
      brand,
      model,
      parseInt(year),
      parseInt(seats) || 5,
      transmission || 'auto',
      fuel || 'petrol',
      parseFloat(price_per_day),
      city,
      address || null,
      JSON.stringify(images)
    );

    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ car: { ...car, images: safeParseJSON(car.images, []) } });
  } catch (err) {
    console.error('Create car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cars/:id - update listing (auth, owner only)
router.put('/:id', authenticateToken, withUpload, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (car.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this listing' });
    }

    const { title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, available, existing_images } = req.body;

    let images = safeParseJSON(car.images, []);

    // Handle existing images (ones the user wants to keep)
    if (existing_images !== undefined) {
      images = safeParseJSON(existing_images, []);
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map(f => f.filename)];
    }

    const stmt = db.prepare(`
      UPDATE cars SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        year = COALESCE(?, year),
        seats = COALESCE(?, seats),
        transmission = COALESCE(?, transmission),
        fuel = COALESCE(?, fuel),
        price_per_day = COALESCE(?, price_per_day),
        city = COALESCE(?, city),
        address = COALESCE(?, address),
        images = ?,
        available = COALESCE(?, available)
      WHERE id = ?
    `);

    stmt.run(
      title || null,
      description || null,
      type || null,
      brand || null,
      model || null,
      year ? parseInt(year) : null,
      seats ? parseInt(seats) : null,
      transmission || null,
      fuel || null,
      price_per_day ? parseFloat(price_per_day) : null,
      city || null,
      address || null,
      JSON.stringify(images),
      available !== undefined ? (available === 'true' || available === true ? 1 : 0) : null,
      req.params.id
    );

    const updatedCar = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    res.json({ car: { ...updatedCar, images: safeParseJSON(updatedCar.images, []) } });
  } catch (err) {
    console.error('Update car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cars/:id - delete listing (auth, owner only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (car.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Delete car images from filesystem
    const images = safeParseJSON(car.images, []);
    images.forEach(filename => {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id);
    res.json({ message: 'Car listing deleted successfully' });
  } catch (err) {
    console.error('Delete car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = router;
