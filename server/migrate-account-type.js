const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'personal'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rccm VARCHAR(100)`);
    console.log('Migration OK : account_type, company_name, rccm ajoutés');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
