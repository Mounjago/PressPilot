/**
 * PRESSPILOT BACKEND SERVER - Serveur principal avec intégration Ringover
 * Serveur Express.js pour l'API PressPilot avec gestion des appels
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Configuration base de données
const { connectDB, setupDatabaseEvents, getDatabaseStats } = require('./config/database');

// Import des modèles pour assurer leur enregistrement dans Mongoose
require('./models/User');
require('./models/Artist');
require('./models/Project');
require('./models/Campaign');
require('./models/Contact');
require('./models/EmailTracking');
require('./models/IMAPConfiguration');

// Routes
const authRoutes = require('./routes/auth');
const callsRoutes = require('./routes/calls');
// const analyticsRoutes = require('./routes/analytics');
const campaignsRoutes = require('./routes/campaigns');
const emailTrackingRoutes = require('./routes/email-tracking');
const incomingEmailsRoutes = require('./routes/incoming-emails');
const contactsRoutes = require('./routes/contacts');
const artistsRoutes = require('./routes/artists');
const projectsRoutes = require('./routes/projects');
const imapRoutes = require('./routes/imap');
const queueRoutes = require('./routes/queue');

// Configuration du serveur
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * MIDDLEWARES DE SÉCURITÉ
 */

// Protection des headers HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://public-api.ringover.com"]
    }
  }
}));

// Compression des réponses
app.use(compression());

// CORS configuration - Optimisé pour production Railway
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les domaines Railway et localhost
    const allowedOrigins = [
      'https://presspilot.up.railway.app',
      'https://frontend-presspilot-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173'
    ];

    // Autoriser les requêtes sans origin (Postman, mobile apps, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Temporairement permissif pour debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite de 1000 requêtes par IP
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Parsing JSON et URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * ROUTES PRINCIPALES
 */

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route de test pour Ringover
app.get('/api/test-ringover', async (req, res) => {
  try {
    const ringoverApiKey = process.env.RINGOVER_API_KEY;

    if (!ringoverApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Clé API Ringover non configurée'
      });
    }

    // Test de connexion à l'API Ringover
    const response = await fetch('https://public-api.ringover.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${ringoverApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      res.json({
        success: true,
        message: 'Connexion Ringover réussie',
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email
        }
      });
    } else {
      res.status(response.status).json({
        success: false,
        message: 'Erreur de connexion Ringover',
        status: response.status
      });
    }

  } catch (error) {
    console.error('Erreur test Ringover:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test Ringover'
    });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
// app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/email', emailTrackingRoutes);
app.use('/api/incoming', incomingEmailsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/imap', imapRoutes);
app.use('/api/queue', queueRoutes);

// Route de statistiques de la base de données (développement)
if (NODE_ENV === 'development') {
  app.get('/api/db-stats', async (req, res) => {
    try {
      const stats = await getDatabaseStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  });
}

// Route pour les fichiers statiques (si nécessaire)
if (NODE_ENV === 'production') {
  app.use(express.static('../dist'));

  // Catch-all pour React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

/**
 * GESTION DES ERREURS
 */

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);

  // Erreur de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  // Erreur CORS
  if (error.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée'
    });
  }

  // Erreur de parsing JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide'
    });
  }

  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    message: NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur',
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

/**
 * GESTION DES SIGNAUX SYSTÈME
 */

const gracefulShutdown = (signal) => {
  console.log(`\n📡 Signal ${signal} reçu, arrêt gracieux du serveur...`);

  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });

  // Force l'arrêt après 10 secondes
  setTimeout(() => {
    console.log('⚠️ Arrêt forcé du serveur');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

/**
 * INITIALISATION ET DÉMARRAGE DU SERVEUR
 */

const startServer = async () => {
  let dbConnected = false;

  try {
    // Tentative de connexion à la base de données
    console.log('🔄 Tentative de connexion à MongoDB...');
    await connectDB();
    setupDatabaseEvents();
    dbConnected = true;
    console.log('✅ MongoDB connecté avec succès');
  } catch (dbError) {
    console.warn('⚠️ Impossible de se connecter à MongoDB:', dbError.message);
    console.warn('🔄 Le serveur va démarrer sans base de données (mode dégradé)');
  }

  try {
    // Vérification des variables d'environnement requises (seulement JWT_SECRET)
    if (!process.env.JWT_SECRET) {
      // Générer un JWT temporaire pour Railway si manquant
      process.env.JWT_SECRET = 'temporary-jwt-secret-' + Math.random().toString(36);
      console.warn('⚠️ JWT_SECRET manquant, utilisation d\'une clé temporaire');
    }

    // Démarrer le serveur (toujours, même sans DB)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
🚀 PressPilot Backend démarré
📍 Port: ${PORT}
🌍 Environnement: ${NODE_ENV}
🔐 JWT: ${process.env.JWT_SECRET ? '✅ Configuré' : '❌ Non configuré'}
📞 Ringover: ${process.env.RINGOVER_API_KEY ? '✅ Configuré' : '❌ Non configuré'}
🗄️  MongoDB: ${dbConnected ? '✅ Connecté' : '⚠️ Non disponible (mode dégradé)'}
⏰ ${new Date().toLocaleString('fr-FR')}
      `);

      if (NODE_ENV === 'development') {
        console.log(`
📋 Endpoints disponibles:
• Health: http://localhost:${PORT}/health
• Auth Register: http://localhost:${PORT}/api/auth/register
• Auth Login: http://localhost:${PORT}/api/auth/login
• Auth Profile: http://localhost:${PORT}/api/auth/me
• Test Ringover: http://localhost:${PORT}/api/test-ringover
• Appels: http://localhost:${PORT}/api/calls
• DB Stats: http://localhost:${PORT}/api/db-stats
        `);
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Erreur critique lors du démarrage du serveur:', error);

    // Dernière tentative avec un serveur minimal
    try {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🆘 Serveur minimal démarré sur le port ${PORT}`);
      });
      return server;
    } catch (finalError) {
      console.error('❌ Impossible de démarrer le serveur:', finalError);
      process.exit(1);
    }
  }
};

// Démarrer le serveur
startServer();

module.exports = app;