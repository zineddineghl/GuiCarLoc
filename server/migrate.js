const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'renter' CHECK(role IN ('owner', 'renter', 'both')),
        bio TEXT,
        avatar TEXT,
        two_fa_enabled INTEGER NOT NULL DEFAULT 0,
        two_fa_code TEXT,
        two_fa_expires BIGINT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        banned INTEGER NOT NULL DEFAULT 0,
        reset_token TEXT,
        reset_token_expires BIGINT,
        email_verified INTEGER NOT NULL DEFAULT 1,
        email_verify_code TEXT,
        email_verify_expires BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
        message TEXT,
        renter_seen INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        car_rating INTEGER NOT NULL CHECK(car_rating BETWEEN 1 AND 5),
        owner_rating INTEGER NOT NULL CHECK(owner_rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id)
      )
    `);

    console.log('[DB] Migrations completed successfully');
  } catch (err) {
    console.error('[DB] Migration error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = migrate;
