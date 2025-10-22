/**
 * ROUTES D'AUTHENTIFICATION - Endpoints sécurisés pour l'authentification
 * Routes Express pour register, login, vérification, etc.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * RATE LIMITING SPÉCIFIQUE À L'AUTHENTIFICATION
 */

// Rate limiting pour les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite à 5 tentatives par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'inscription
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Limite à 3 inscriptions par IP par heure
  message: {
    success: false,
    message: 'Trop d\'inscriptions tentées. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * VALIDATEURS
 */

const registerValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Veuillez entrer un email valide')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 100 caractères')
];

const loginValidators = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Veuillez entrer un email valide')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est obligatoire')
];

/**
 * ROUTE: POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', registerLimiter, registerValidators, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { name, email, password, company } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cette adresse email existe déjà'
      });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      company: company?.trim() || undefined
    });

    // Sauvegarder en base de données
    await user.save();

    // Générer le token d'authentification
    const token = user.generateAuthToken();

    // Mettre à jour la dernière connexion
    await user.updateLastLogin();

    // Log de sécurité
    console.log(`📝 Nouvelle inscription: ${email} depuis ${req.ip}`);

    // Réponse de succès (sans le mot de passe)
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);

    // Erreur de validation MongoDB
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Erreur de duplication (email déjà utilisé)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'inscription'
    });
  }
});

/**
 * ROUTE: POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', loginLimiter, loginValidators, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur par email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé. Contactez le support.'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé en raison de tentatives de connexion multiples. Réessayez plus tard.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      // Incrémenter les tentatives de connexion
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Réinitialiser les tentatives de connexion en cas de succès
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Mettre à jour la dernière connexion
    await user.updateLastLogin();

    // Générer le token d'authentification
    const token = user.generateAuthToken();

    // Log de sécurité
    console.log(`🔐 Connexion réussie: ${email} depuis ${req.ip}`);

    // Réponse de succès
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la connexion'
    });
  }
});

/**
 * ROUTE: GET /api/auth/me
 * Obtenir les informations de l'utilisateur connecté
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * ROUTE: PUT /api/auth/profile
 * Mettre à jour le profil utilisateur
 */
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),

  body('preferences.language')
    .optional()
    .isIn(['fr', 'en', 'es'])
    .withMessage('Langue non supportée'),

  body('preferences.timezone')
    .optional()
    .isString()
    .withMessage('Fuseau horaire invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs autorisés
    const allowedUpdates = ['name', 'company', 'preferences'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'preferences' && typeof req.body[field] === 'object') {
          updates[field] = { ...user[field], ...req.body[field] };
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Appliquer les mises à jour
    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * ROUTE: POST /api/auth/logout
 * Déconnexion (côté client principalement)
 */
router.post('/logout', auth, async (req, res) => {
  try {
    // Log de sécurité
    console.log(`🚪 Déconnexion: ${req.user.email} depuis ${req.ip}`);

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * ROUTE: POST /api/auth/verify-token
 * Vérifier la validité d'un token
 */
router.post('/verify-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou utilisateur inactif'
      });
    }

    res.json({
      success: true,
      message: 'Token valide',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * ROUTE: POST /api/auth/refresh-token
 * Rafraîchir le token d'authentification
 */
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Générer un nouveau token
    const newToken = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      token: newToken,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;