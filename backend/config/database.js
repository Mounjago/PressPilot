/**
 * CONFIGURATION BASE DE DONNÉES - Connexion MongoDB
 * Configuration et connexion sécurisée à MongoDB avec Mongoose
 */

const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-db' },
  transports: [new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    )
  })]
});

/**
 * Configuration de la connexion MongoDB
 */
const connectDB = async () => {
  try {
    // Options de connexion MongoDB (versions récentes)
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    // URL de connexion MongoDB
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/presspilot';

    logger.info('Connexion a MongoDB...');

    // Connexion à MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info('MongoDB connecte', { host: conn.connection.host, port: conn.connection.port, db: conn.connection.name });
    logger.info('Etat de la connexion', { state: conn.connection.readyState === 1 ? 'Connecte' : 'Deconnecte' });

    // Log des informations de la base de données en développement
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Nom de la base', { db: conn.connection.name });
      logger.debug('URL de connexion', { url: mongoURI.replace(/\/\/.*@/, '//***:***@') }); // Masquer les credentials
    }

    return conn;

  } catch (error) {
    logger.error('Erreur de connexion MongoDB', { error: error.message });

    // Log détaillé en développement
    if (process.env.NODE_ENV === 'development') {
      logger.error('Details de erreur', { error: error.message, stack: error.stack });
    }

    // Arrêter l'application en cas d'erreur de connexion
    process.exit(1);
  }
};

/**
 * Gestion des événements de connexion MongoDB
 */
const setupDatabaseEvents = () => {
  // Connexion réussie
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connecte a MongoDB');
  });

  // Erreur de connexion
  mongoose.connection.on('error', (err) => {
    logger.error('Erreur de connexion Mongoose', { error: err.message });
  });

  // Déconnexion
  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose deconnecte de MongoDB');
  });

  // Reconnexion
  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnecte a MongoDB');
  });

  // Arrêt gracieux de l'application
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('Connexion MongoDB fermee via signal arret');
      process.exit(0);
    } catch (error) {
      logger.error('Erreur fermeture connexion MongoDB', { error: error.message });
      process.exit(1);
    }
  });
};

/**
 * Fonction utilitaire pour vérifier l'état de la connexion
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Fonction utilitaire pour obtenir les statistiques de la base de données
 */
const getDatabaseStats = async () => {
  try {
    if (!isConnected()) {
      throw new Error('Base de données non connectée');
    }

    const stats = await mongoose.connection.db.stats();

    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // En MB
      indexSize: Math.round(stats.indexSize / 1024 / 1024 * 100) / 100, // En MB
      objects: stats.objects
    };
  } catch (error) {
    logger.error('Erreur recuperation statistiques', { error: error.message });
    throw error;
  }
};

/**
 * Fonction utilitaire pour nettoyer la base de données (développement uniquement)
 */
const cleanDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Nettoyage de la base de données interdit en production');
  }

  try {
    if (!isConnected()) {
      throw new Error('Base de données non connectée');
    }

    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      logger.info('Collection nettoyee', { collection: collection.name });
    }

    logger.info('Base de donnees nettoyee');
  } catch (error) {
    logger.error('Erreur nettoyage base de donnees', { error: error.message });
    throw error;
  }
};

/**
 * Fonction de seeding pour les données de test
 */
const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Seeding ignore en production');
    return;
  }

  try {
    const User = require('../models/User');

    // Vérifier si des utilisateurs existent déjà
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info('Seeding ignore, utilisateurs deja presents', { count: userCount });
      return;
    }

    // Créer un utilisateur de test
    const testUser = new User({
      name: 'Test User',
      email: 'test@presspilot.com',
      password: 'Test123456!',
      company: 'PressPilot Test',
      role: 'admin',
      emailVerified: true
    });

    await testUser.save();
    logger.info('Utilisateur de test cree', { email: testUser.email });

    logger.info('Seeding termine');
  } catch (error) {
    logger.error('Erreur seeding', { error: error.message });
  }
};

module.exports = {
  connectDB,
  setupDatabaseEvents,
  isConnected,
  getDatabaseStats,
  cleanDatabase,
  seedDatabase
};