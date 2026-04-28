require('dotenv').config();
const { Pool } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node set-admin.js <email>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!rows[0]) {
      console.error(`Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }
    await pool.query('UPDATE users SET is_admin = 1 WHERE email = $1', [email]);
    console.log(`OK: ${rows[0].name} (${email}) est maintenant admin.`);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
