const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(`
      SELECT
        u.id, u.name, u.avatar,
        m.content as last_message,
        m.created_at as last_message_at,
        m.sender_id as last_sender_id,
        m.read as last_message_read,
        SUM(CASE WHEN m2.read = 0 AND m2.sender_id != $1 AND m2.receiver_id = $2 THEN 1 ELSE 0 END)::int as unread_count
      FROM (
        SELECT CASE WHEN sender_id = $3 THEN receiver_id ELSE sender_id END as other_id,
               MAX(id) as last_id
        FROM messages
        WHERE sender_id = $4 OR receiver_id = $5
        GROUP BY other_id
      ) conv
      JOIN messages m ON m.id = conv.last_id
      JOIN users u ON u.id = conv.other_id
      LEFT JOIN messages m2 ON (m2.sender_id = conv.other_id AND m2.receiver_id = $6)
      GROUP BY u.id, u.name, u.avatar, m.content, m.created_at, m.sender_id, m.read
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId, userId, userId]);

    res.json({ conversations: rows });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/unread-count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int as count FROM messages WHERE receiver_id = $1 AND read = 0',
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/:userId
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const me = req.user.id;
    const other = parseInt(req.params.userId);

    await pool.query(
      'UPDATE messages SET read = 1 WHERE sender_id = $1 AND receiver_id = $2',
      [other, me]
    );

    const [messagesResult, otherUserResult] = await Promise.all([
      pool.query(`
        SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = $1 AND m.receiver_id = $2)
           OR (m.sender_id = $3 AND m.receiver_id = $4)
        ORDER BY m.created_at ASC
      `, [me, other, other, me]),
      pool.query('SELECT id, name, avatar FROM users WHERE id = $1', [other])
    ]);

    res.json({ messages: messagesResult.rows, otherUser: otherUserResult.rows[0] });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/:userId
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message requis' });
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)
       RETURNING id, sender_id, receiver_id, content, created_at`,
      [req.user.id, parseInt(req.params.userId), content.trim()]
    );
    res.json({ message: rows[0] });
  } catch (err) {
    console.error('Post message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
