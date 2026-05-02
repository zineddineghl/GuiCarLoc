require('dotenv').config();
require('./cronTasks');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { sendNewMessageEmail } = require('./mailer');

const pool = require('./db');
const migrate = require('./migrate');
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const bookingsRoutes = require('./routes/bookings');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const favoritesRoutes = require('./routes/favorites');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rentcar_super_secret_key_2024';

const CLIENT_ORIGIN = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];

// Socket.io
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user_${socket.userId}`);

  socket.on('send_message', async ({ receiverId, content }) => {
    if (!content?.trim() || !receiverId) return;
    try {
      const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id',
        [socket.userId, receiverId, content.trim()]
      );
      const msgId = result.rows[0].id;
      const [msgResult, usersResult] = await Promise.all([
        pool.query(
          `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
           FROM messages m JOIN users u ON m.sender_id = u.id
           WHERE m.id = $1`,
          [msgId]
        ),
        pool.query(
          'SELECT id, name, email FROM users WHERE id = ANY($1)',
          [[socket.userId, receiverId]]
        ),
      ]);
      const message = msgResult.rows[0];
      io.to(`user_${socket.userId}`).to(`user_${receiverId}`).emit('new_message', message);

      // Send email notification only if receiver is not connected
      const receiverSockets = await io.in(`user_${receiverId}`).fetchSockets();
      if (receiverSockets.length === 0) {
        const sender = usersResult.rows.find(u => u.id === socket.userId);
        const receiver = usersResult.rows.find(u => u.id === parseInt(receiverId));
        if (sender && receiver) {
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
          sendNewMessageEmail({
            to: receiver.email,
            receiverName: receiver.name,
            senderName: sender.name,
            content: content.trim(),
            messagesUrl: `${clientUrl}/messages/${socket.userId}`,
          }).catch(err => console.error('[Socket] Email notification error:', err.message));
        }
      }
    } catch (err) {
      console.error('[Socket] send_message error:', err.message);
    }
  });

  socket.on('mark_read', async ({ senderId }) => {
    try {
      await pool.query(
        'UPDATE messages SET read = 1 WHERE sender_id = $1 AND receiver_id = $2',
        [senderId, socket.userId]
      );
      // Notify the original sender that their messages have been read
      io.to(`user_${senderId}`).emit('messages_read', { by: socket.userId });
    } catch (err) {
      console.error('[Socket] mark_read error:', err.message);
    }
  });
});

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RentCar API is running', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', message: err.message });
});

// Start server after migrations
migrate()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`RentCar server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[FATAL] Could not run migrations:', err.message);
    process.exit(1);
  });

module.exports = app;
