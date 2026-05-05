const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rentcar_super_secret_key_2024';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// POST /api/reports — signaler une annonce
router.post('/', authMiddleware, async (req, res) => {
  const { car_id, reason } = req.body;
  if (!car_id || !reason) return res.status(400).json({ error: 'car_id et reason requis' });
  try {
    await pool.query(
      `INSERT INTO reports (car_id, reporter_id, reason) VALUES ($1, $2, $3)`,
      [car_id, req.user.id, reason]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
