const cron = require('node-cron');
const pool = require('./db');

// Cette fonction va s'exécuter automatiquement
// '0 * * * *' = s'exécute à la minute 0 de chaque heure (ex: 14h00, 15h00...)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('[CRON] Vérification des demandes de location expirées...');

    // On met à jour les réservations 'pending' créées il y a plus de 24h
    const result = await pool.query(`
      UPDATE bookings 
      SET status = 'canceled'
      WHERE status = 'pending' 
      AND created_at <= NOW() - INTERVAL '1 minute'
      RETURNING id;
    `);

    if (result.rowCount > 0) {
      console.log(`[CRON] ${result.rowCount} demande(s) annulée(s) car délai de 24h dépassé.`);
      
      // 💡 BONUS : Ici, tu pourrais appeler ta fonction sendEmail() 
      // pour prévenir le locataire que sa demande a expiré !
    }
  } catch (err) {
    console.error('[CRON] Erreur lors de l\'annulation automatique :', err);
  }
});

module.exports = cron;