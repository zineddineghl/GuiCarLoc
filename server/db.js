const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'rentcar.db');

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'renter' CHECK(role IN ('owner', 'renter', 'both')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('sedan', 'suv', 'van', 'sports', 'luxury', 'economy')),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    seats INTEGER NOT NULL DEFAULT 5,
    transmission TEXT NOT NULL DEFAULT 'auto' CHECK(transmission IN ('auto', 'manual')),
    fuel TEXT NOT NULL DEFAULT 'petrol' CHECK(fuel IN ('petrol', 'diesel', 'electric', 'hybrid')),
    price_per_day REAL NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    images TEXT DEFAULT '[]',
    available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    renter_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Add bio + avatar columns to users if they don't exist (migration)
const userCols = db.prepare('PRAGMA table_info(users)').all();
if (!userCols.find(c => c.name === 'bio')) {
  db.exec('ALTER TABLE users ADD COLUMN bio TEXT');
}
if (!userCols.find(c => c.name === 'avatar')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar TEXT');
}
if (!userCols.find(c => c.name === 'two_fa_enabled')) {
  db.exec('ALTER TABLE users ADD COLUMN two_fa_enabled INTEGER NOT NULL DEFAULT 0');
}
if (!userCols.find(c => c.name === 'two_fa_code')) {
  db.exec('ALTER TABLE users ADD COLUMN two_fa_code TEXT');
}
if (!userCols.find(c => c.name === 'two_fa_expires')) {
  db.exec('ALTER TABLE users ADD COLUMN two_fa_expires INTEGER');
}

// Add renter_seen column if it doesn't exist (migration)
const bookingCols = db.prepare('PRAGMA table_info(bookings)').all();
if (!bookingCols.find(c => c.name === 'renter_seen')) {
  db.exec('ALTER TABLE bookings ADD COLUMN renter_seen INTEGER NOT NULL DEFAULT 1');
}

// Reviews table
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL UNIQUE,
    reviewer_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    car_rating INTEGER NOT NULL CHECK(car_rating BETWEEN 1 AND 5),
    owner_rating INTEGER NOT NULL CHECK(owner_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

module.exports = db;
