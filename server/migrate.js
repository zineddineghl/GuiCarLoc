const pool = require('./db');

async function migrate() {
  let client;
  try {
    client = await pool.connect();
    console.log('[DB] Connexion établie pour la migration...');

    // Table Users
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
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Cars (avec les nouvelles colonnes)
    // ... dans migrate.js, remplace la partie correspondante dans la table cars :
    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        seats INTEGER NOT NULL DEFAULT 5,
        transmission TEXT NOT NULL DEFAULT 'auto',
        fuel TEXT NOT NULL DEFAULT 'petrol',
        price_per_day REAL NOT NULL,
        weekend_price REAL,
        min_rental_days INTEGER DEFAULT 1,
        max_rental_days INTEGER,
        requires_deposit BOOLEAN DEFAULT FALSE,
        deposit_amount REAL,
        -- ON REMPLACE LES 2 COLONNES PAR CELLE-CI :
        discounts JSONB DEFAULT '[]', 
        city TEXT NOT NULL,
        address TEXT,
        images TEXT DEFAULT '[]',
        available INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT,
        renter_seen INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Reviews
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

    // Table Messages
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

    // Table Favorites
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id)
      )
    `);

    // Table Blocked Dates
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table Reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Colonnes manquantes sur users
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_code TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_expires BIGINT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires BIGINT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 1`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_code TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires BIGINT`);

    // Colonnes KYC vérification d'identité
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_front TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_back TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_selfie TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_status TEXT DEFAULT 'none'`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_submitted_at TIMESTAMP`);

    // Colonnes manquantes sur bookings
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS message TEXT`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS renter_seen INTEGER NOT NULL DEFAULT 1`);

    // Colonnes pricing/caution sur cars
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS weekend_price REAL`);
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS min_rental_days INTEGER DEFAULT 1`);
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS max_rental_days INTEGER`);
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS deposit_amount REAL`);
    await client.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS discounts JSONB DEFAULT '[]'`);

    // Renommer rating → car_rating dans reviews si l'ancienne colonne existe encore
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'reviews' AND column_name = 'rating'
        ) THEN
          ALTER TABLE reviews RENAME COLUMN rating TO car_rating;
        END IF;
      END $$;
    `);

    console.log('[DB] Migrations terminées avec succès sur Railway !');
  } catch (err) {
    console.error('[DB] Erreur pendant la migration :', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

module.exports = migrate;