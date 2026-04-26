require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const bookingsRoutes = require('./routes/bookings');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');

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
    credentials: true,
  },
});

// Authenticate socket connections with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // Each user joins their own room (identified by user ID)
  socket.join(`user_${socket.userId}`);

  socket.on('send_message', ({ receiverId, content }) => {
    if (!content?.trim() || !receiverId) return;
    const db = require('./db');
    const result = db.prepare(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)'
    ).run(socket.userId, receiverId, content.trim());

    const message = db.prepare(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`
    ).get(result.lastInsertRowid);

    // Emit to both sender and receiver
    io.to(`user_${socket.userId}`).to(`user_${receiverId}`).emit('new_message', message);
  });

  socket.on('mark_read', ({ senderId }) => {
    const db = require('./db');
    db.prepare(
      'UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?'
    ).run(senderId, socket.userId);
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

server.listen(PORT, () => {
  console.log(`RentCar server running on http://localhost:${PORT}`);
});

module.exports = app;
