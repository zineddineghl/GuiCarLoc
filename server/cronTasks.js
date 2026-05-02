const cron = require('node-cron');
const pool = require('./db');

// S'exécute TOUTES LES MINUTES
cron.schedule('* * * * *', async () => {
  try {
    console.log('\n--- ⏱️ [CRON] DÉBUT DE LA VÉRIFICATION ---');

    // 1. On regarde ce que voit la base de données
    const check = await pool.query(`
      SELECT id, status, created_at, NOW() as current_db_time 
      FROM bookings 
      WHERE status = 'pending'
    `);
    
    console.log(`[CRON] J'ai trouvé ${check.rowCount} réservation(s) en 'pending'.`);

    if (check.rowCount > 0) {
      console.log(`[CRON] Date de création :`, check.rows[0].created_at);
      console.log(`[CRON] Heure actuelle DB :`, check.rows[0].current_db_time);
    }

    // 2. TEST EXTRÊME : On annule TOUTES les réservations en attente, 
    // sans aucune condition de temps (pour voir si la requête marche)
    const result = await pool.query(`
      UPDATE bookings 
      SET status = 'canceled'
      WHERE status = 'pending' 
      RETURNING id;
    `);

    if (result.rowCount > 0) {
      console.log(`[CRON] ✅ SUCCÈS ! ${result.rowCount} demande(s) annulée(s) de force.`);
    } else {
      console.log(`[CRON] ❌ Rien n'a été annulé par l'UPDATE.`);
    }
    
    console.log('------------------------------------------\n');

  } catch (err) {
    console.error('[CRON] Erreur :', err);
  }
});

module.exports = cron;