/**
 * Monday Automation App - Main Server
 * Enterprise-grade Monday.com application with OAuth, webhooks, and automations
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { validateWebhook } = require('./middleware/webhookValidator');

// Import routes
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhooks');
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');
const automationRoutes = require('./routes/automations');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.monday.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.monday.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.monday.com"],
      frameSrc: ["'self'", "https://monday.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for Monday iframe
app.use(cors({
  origin: [
    'https://monday.com',
    'https://*.monday.com',
    'http://localhost:3000',
    process.env.APP_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Monday-Signature']
}));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for deployment
app.set('trust proxy', 1);

// Static files for client UI
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', validateWebhook, webhookRoutes);
app.use('/api/automations', rateLimiter, automationRoutes);
app.use('/api', rateLimiter, apiRoutes);

// Monday App iframe route
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// OAuth callback route
app.get('/auth/callback', (req, res) => {
  res.redirect('/app?auth=success');
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Monday Automation App',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      webhooks: '/api/webhooks',
      automations: '/api/automations',
      app: '/app'
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Monday Automation App running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 App URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
