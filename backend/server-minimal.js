/**
 * SERVEUR MINIMAL POUR RAILWAY - DÉMARRAGE GARANTI
 * Version simplifiée pour assurer le démarrage sur Railway
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Démarrage du serveur minimal PressPilot...');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// CORS ultra-permissif pour Railway
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
}));

// Middleware de base
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check simple
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PressPilot Backend minimal fonctionnel',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Login endpoint minimal (sans DB)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  console.log('📧 Tentative de connexion:', email);

  // Validation basique
  if (email === 'admin@presspilot.fr' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Connexion réussie (mode minimal)',
      user: {
        id: '1',
        name: 'Administrateur PressPilot',
        email: email,
        role: 'admin'
      },
      token: 'minimal-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Identifiants incorrects'
    });
  }
});

// Endpoint de test
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API PressPilot minimale fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Route catch-all
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.originalUrl,
    method: req.method
  });
});

// Gestion d'erreur globale
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: error.message
  });
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Serveur minimal PressPilot démarré sur le port', PORT);
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('🔐 Login: POST http://localhost:' + PORT + '/api/auth/login');
});

// Gestion d'arrêt propre
process.on('SIGTERM', () => {
  console.log('📴 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Interruption reçue, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

console.log('🎯 Serveur minimal prêt pour Railway');