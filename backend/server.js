const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// ✅ Always load backend .env first
dotenv.config({ path: path.join(__dirname, '.env') });

// Simple environment check
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in backend/.env');
  console.error('   Please check your .env file in the backend directory');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting for API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000'], // Frontend runs on port 3000
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('📥 API Request:', {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'LegalAid Connect API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/lawyers', require('./routes/lawyers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ml-match', require('./routes/mlMatch'));
// New feature routes
app.use('/api/booking', require('./routes/booking'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/payment', require('./routes/payment'));

// Error handler
app.use((err, req, res, next) => {
  // Enhanced error logging
  console.error('🚨 Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((e) => `${e.path}: ${e.message}`);
    console.log('❌ Validation errors:', validationErrors);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: validationErrors.join(', ')
    });
  }

  if (err.name === 'CastError') {
    console.log('❌ Cast error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  if (err.code === 11000) {
    console.log('❌ Duplicate key error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value',
      error: 'This value already exists'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join_case', (caseId) => {
    socket.join(`case_${caseId}`);
  });
  socket.on('message_case', ({ caseId, content, meta }) => {
    io.to(`case_${caseId}`).emit('case_message', { content, caseId, meta, ts: Date.now() });
  });
  socket.on('disconnect', () => console.log('❌ Client disconnected', socket.id));
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
      mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
  });
});

module.exports = app;
