// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Fonction pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'votre_secret_jwt_temporaire',
    { expiresIn: '24h' }
  );
};

// Contrôleur d'authentification
const authController = {
  // Inscription d'un nouvel utilisateur
  register: async (req, res) => {
    const { name, email, password } = req.body;

    try {
      // Vérifier si l'utilisateur existe déjà
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insérer le nouvel utilisateur
      const result = await pool.query(
        'INSERT INTO users (name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, created_at',
        [name, email, hashedPassword]
      );

      const newUser = result.rows[0];

      // Générer un token JWT
      const token = generateToken(newUser.id);

      // Renvoyer les informations utilisateur et le token
      res.status(201).json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at
        },
        token
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
    }
  },

  // Connexion d'un utilisateur existant
  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      // Rechercher l'utilisateur par email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const user = result.rows[0];

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Générer un token JWT
      const token = generateToken(user.id);

      // Renvoyer les informations utilisateur et le token
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          picture: user.picture
        },
        token
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
  },

  // Récupérer le profil de l'utilisateur connecté
  getProfile: async (req, res) => {
    try {
      // L'ID de l'utilisateur est extrait du token JWT par le middleware d'authentification
      const result = await pool.query(
        'SELECT id, name, email, picture, created_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil' });
    }
  }
};

module.exports = authController;
