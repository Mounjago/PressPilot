/**
 * PRESSPILOT BACKEND SERVER
 * Express API server with comprehensive security middlewares
 *
 * Security features:
 * - Helmet (HTTP security headers + CSP)
 * - CORS with whitelist
 * - Rate limiting (global + per-route)
 * - HPP (HTTP Parameter Pollution protection)
 * - Compression
 * - Request size limits
 * - Structured logging (Winston)
 * - Health check endpoint
 * - Graceful shutdown
 */

'use strict';

// ============================================================
// 1. ENVIRONMENT CONFIGURATION
// ============================================================
const dotenv = require('dotenv');
dotenv.config();

// Validate critical environment variables at startup
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  // Use process.stderr.write for pre-boot FATAL errors (Winston not yet loaded)
  process.stderr.write(`FATAL: Missing required environment variables: ${missing.join(', ')}\n`);
  process.stderr.write('Copy .env.example to .env and fill in your values.\n');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  process.stderr.write('FATAL: JWT_SECRET must be at least 32 characters.\n');
  process.exit(1);
}

// ============================================================
// 2. DEPENDENCIES
// ============================================================
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');
const { connectDB, setupDatabaseEvents, isConnected } = require('./config/database');

// ============================================================
// 3. LOGGING (Winston)
// ============================================================
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'presspilot-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE || './logs/error.log',
    level: 'error',
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5
  }));
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE || './logs/combined.log',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  }));
}

// ============================================================
// 4. EXPRESS APP INITIALIZATION
// ============================================================
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (for Railway, Heroku, etc. behind reverse proxy)
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============================================================
// 5. SECURITY MIDDLEWARES
// ============================================================

// 5.1 Helmet - HTTP Security Headers + CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Allow loading cross-origin resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true, // nosniff
  xFrameOptions: { action: 'deny' },
  xXssProtection: true
}));

// 5.2 CORS - Cross-Origin Resource Sharing with whitelist
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173'   // Vite preview
].filter(Boolean);

// In production, only allow explicitly configured origins
if (NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  logger.warn('FRONTEND_URL not set in production! CORS will be restrictive.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400 // 24 hours preflight cache
}));

// 5.3 Rate Limiting - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => req.path === '/health' // Don't rate-limit health checks
});
app.use(globalLimiter);

// 5.4 Auth-specific rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 10 : 100, // 10 attempts per 15 min in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// 5.5 HPP - HTTP Parameter Pollution protection
app.use(hpp());

// ============================================================
// 6. PARSING & COMPRESSION MIDDLEWARES
// ============================================================

// JSON body parser with size limit
app.use(express.json({
  limit: '1mb',
  strict: true
}));

// URL-encoded body parser with size limit
app.use(express.urlencoded({
  extended: true,
  limit: '1mb'
}));

// 6.3 Sanitization - Anti-NoSQL injection & XSS
const sanitize = require('./middleware/sanitize');
app.use(sanitize);

// Compression (gzip)
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ============================================================
// 7. REQUEST LOGGING
// ============================================================

// Morgan HTTP request logging -> Winston
const morganStream = {
  write: (message) => logger.http(message.trim())
};

if (NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: morganStream }));
} else {
  app.use(morgan('dev'));
}

// ============================================================
// 8. SECURITY HEADERS (additional)
// ============================================================
app.use((req, res, next) => {
  // Remove X-Powered-By (already done by helmet, but double-check)
  res.removeHeader('X-Powered-By');

  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  next();
});

// ============================================================
// 9. HEALTH CHECK ENDPOINT
// ============================================================
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: NODE_ENV,
    database: isConnected() ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };

  const statusCode = isConnected() ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================================
// 10. API ROUTES
// ============================================================

// Import route modules
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const campaignsRoutes = require('./routes/campaigns');
const projectsRoutes = require('./routes/projects');
const artistsRoutes = require('./routes/artists');
const analyticsRoutes = require('./routes/analytics');
const messagesRoutes = require('./routes/messages');
const imapRoutes = require('./routes/imap');
const uploadsRoutes = require('./routes/uploads');
const aiRoutes = require('./routes/ai');
const pressReleasesRoutes = require('./routes/pressReleases');
const eventsRoutes = require('./routes/events');
const mediaKitsRoutes = require('./routes/mediaKits');
const adminRoutes = require('./routes/admin');

// 10.1 Upload-specific rate limiting (stricter)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 30 : 200, // 30 uploads per 15 min in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

// Auth routes (with stricter rate limiting)
app.use('/auth', authLimiter, authRoutes);

// API routes (protected by auth middleware in each route file)
app.use('/api/contacts', contactsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/imap', imapRoutes);
app.use('/api/uploads', uploadLimiter, uploadsRoutes);
app.use('/api/ai', aiRoutes);

// BandStream RP routes (interface-protected in route files)
app.use('/api/press-releases', pressReleasesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/media-kits', mediaKitsRoutes);

// Admin routes (admin/super_admin only)
app.use('/api/admin', adminRoutes);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- QUEUE ROUTES (Sprint 2 - Bull/Redis integration) ---
const { auth: authMiddleware } = require('./middleware/auth');

app.get('/api/queue/status', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Queue service - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.get('/api/queue/jobs/:type', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Queue jobs - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.get('/api/queue/repeated', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Repeated jobs - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.get('/api/queue/job/:jobId', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Job details - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.post('/api/queue/job/:jobId/retry', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Retry job - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.delete('/api/queue/job/:jobId', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Delete job - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.post('/api/queue/clean', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Clean queues - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.post('/api/queue/pause', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Pause queues - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});
app.post('/api/queue/resume', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Resume queues - Sprint 2 implementation', code: 'NOT_IMPLEMENTED' });
});

// ============================================================
// 11. 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
});

// ============================================================
// 12. GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, _next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked',
      code: 'CORS_ERROR'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
      code: 'VALIDATION_ERROR'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
      code: 'DUPLICATE_KEY'
    });
  }

  // JSON parse error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// ============================================================
// 13. SERVER STARTUP
// ============================================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    setupDatabaseEvents();

    logger.info('MongoDB connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`PressPilot API server running on port ${PORT} [${NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');

        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        }).catch((err) => {
          logger.error('Error closing MongoDB connection', { error: err.message });
          process.exit(1);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: reason?.message || reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing with supertest
