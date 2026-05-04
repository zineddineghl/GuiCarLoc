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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Colonnes KYC vérification d'identité
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_front TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_back TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_selfie TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_status TEXT DEFAULT 'none'`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_submitted_at TIMESTAMP`);

    console.log('[DB] Migrations terminées avec succès sur Railway !');
  } catch (err) {
    console.error('[DB] Erreur pendant la migration :', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

module.exports = migrate;