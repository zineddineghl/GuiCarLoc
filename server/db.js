const { Pool } = require('pg');
require('dotenv').config(); // On s'assure que le .env est chargé ici aussi

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configuration SSL obligatoire pour Railway depuis ton ordi
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.app')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[DB] Erreur inattendue sur le pool :', err.message);
});

module.exports = pool;