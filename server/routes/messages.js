const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations - list all conversations for current user
router.get('/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const conversations = db.prepare(`
    SELECT
      u.id, u.name, u.avatar,
      m.content as last_message,
      m.created_at as last_message_at,
      m.sender_id as last_sender_id,
      SUM(CASE WHEN m2.read = 0 AND m2.sender_id != ? AND m2.receiver_id = ? THEN 1 ELSE 0 END) as unread_count
    FROM (
      SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
             MAX(id) as last_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_id
    ) conv
    JOIN messages m ON m.id = conv.last_id
    JOIN users u ON u.id = conv.other_id
    LEFT JOIN messages m2 ON (m2.sender_id = conv.other_id AND m2.receiver_id = ?)
    GROUP BY u.id
    ORDER BY m.created_at DESC
  `).all(userId, userId, userId, userId, userId, userId);

  res.json({ conversations });
});

// GET /api/messages/unread-count - total unread messages
router.get('/unread-count', authenticateToken, (req, res) => {
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0'
  ).get(req.user.id);
  res.json({ count: row.count });
});

// GET /api/messages/:userId - conversation history with a specific user
router.get('/:userId', authenticateToken, (req, res) => {
  const me = req.user.id;
  const other = parseInt(req.params.userId);

  // Mark messages from other as read
  db.prepare(
    'UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?'
  ).run(other, me);

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(me, other, other, me);

  const otherUser = db.prepare(
    'SELECT id, name, avatar FROM users WHERE id = ?'
  ).get(other);

  res.json({ messages, otherUser });
});

module.exports = router;
