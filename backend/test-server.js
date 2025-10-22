const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware basic
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Route simple de test
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Route auth simple pour tester la connexion
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Test de connexion OK',
    token: 'test-token'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur test sur port ${PORT}`);
});