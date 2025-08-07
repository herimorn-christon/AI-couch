const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./database/models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const nutritionRoutes = require('./routes/nutrition');
const aiRoutes = require('./routes/ai');
const subscriptionRoutes = require('./routes/subscriptions');
const trainerRoutes = require('./routes/trainers');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');

const socketHandler = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8081",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8081",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);

// Socket.io
socketHandler(io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Unable to connect to database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

module.exports = app;