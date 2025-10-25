/**
 * Script de démarrage intelligent pour Railway
 * Détecte automatiquement l'environnement et configure les variables
 */

// Détecter si on est sur Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

if (isRailway) {
  console.log('🚂 Environnement Railway détecté');

  // Variables par défaut pour Railway si manquantes
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://mongo:RmgNTDnqwAMzDabcCSOyXNMfOsxZGnoc@turntable.proxy.rlwy.net:43126';
    console.log('📀 MONGODB_URI configuré automatiquement');
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'presspilot-jwt-secret-2025';
    console.log('🔐 JWT_SECRET configuré automatiquement');
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log('🌍 NODE_ENV configuré automatiquement');
  }

  if (!process.env.MAILGUN_API_KEY) {
    process.env.MAILGUN_API_KEY = '334e041590b98e90ec12d7b62ab4ccb7-ba8a60cd-d7df791d';
    console.log('📧 MAILGUN_API_KEY configuré automatiquement');
  }

  if (!process.env.MAILGUN_DOMAIN) {
    process.env.MAILGUN_DOMAIN = 'sandbox-123.mailgun.org';
    console.log('🌐 MAILGUN_DOMAIN configuré automatiquement');
  }
}

console.log('🚀 Démarrage du serveur PressPilot...');
console.log('📍 Environment:', process.env.NODE_ENV);
console.log('🗄️  MongoDB:', process.env.MONGODB_URI ? '✅ Configuré' : '❌ Manquant');

// Démarrer le serveur principal
require('./server.js');