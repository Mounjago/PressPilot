/**
 * CONFIGURATION BASE DE DONNÉES - Connexion MongoDB
 * Configuration et connexion sécurisée à MongoDB avec Mongoose
 */

const mongoose = require('mongoose');

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

    console.log('🔄 Connexion à MongoDB...');

    // Connexion à MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    console.log(`📊 État de la connexion: ${conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);

    // Log des informations de la base de données en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏷️  Nom de la base: ${conn.connection.name}`);
      console.log(`🔗 URL de connexion: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Masquer les credentials
    }

    return conn;

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);

    // Log détaillé en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Détails de l\'erreur:', error);
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
    console.log('🟢 Mongoose connecté à MongoDB');
  });

  // Erreur de connexion
  mongoose.connection.on('error', (err) => {
    console.error('🔴 Erreur de connexion Mongoose:', err);
  });

  // Déconnexion
  mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose déconnecté de MongoDB');
  });

  // Reconnexion
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnecté à MongoDB');
  });

  // Arrêt gracieux de l'application
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🛑 Connexion MongoDB fermée via signal d\'arrêt de l\'app');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture de la connexion MongoDB:', error);
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
    console.error('Erreur lors de la récupération des statistiques:', error);
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
      console.log(`🧹 Collection ${collection.name} nettoyée`);
    }

    console.log('✅ Base de données nettoyée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error);
    throw error;
  }
};

/**
 * Fonction de seeding pour les données de test
 */
const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Seeding ignoré en production');
    return;
  }

  try {
    const User = require('../models/User');

    // Vérifier si des utilisateurs existent déjà
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`👥 ${userCount} utilisateur(s) déjà présent(s), seeding ignoré`);
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
    console.log('🌱 Utilisateur de test créé:', testUser.email);

    console.log('✅ Seeding de la base de données terminé');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
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