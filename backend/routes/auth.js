const router = require('express').Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

// POST /register - Inscription
router.post('/register', [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('name')
    .notEmpty().withMessage('Le nom est requis')
    .trim()
    .escape(),
  body('organization')
    .optional()
    .trim()
    .escape()
], validate, authController.register);

// POST /login - Connexion
router.post('/login', [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
], validate, authController.login);

// GET /me - Profil utilisateur (pas de validation nécessaire)
router.get('/me', auth, authController.getProfile);

// PUT /profile - Mise à jour du profil
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .escape(),
  body('organization')
    .optional()
    .trim()
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any').withMessage('Numéro de téléphone invalide')
], validate, authController.updateProfile);

// PUT /change-password - Changement de mot de passe
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Les mots de passe ne correspondent pas')
], validate, authController.changePassword);

// POST /refresh-token - Rafraîchissement du token JWT
router.post('/refresh-token', auth, authController.refreshToken);

// POST /logout - Déconnexion (server-side acknowledgment)
router.post('/logout', auth, authController.logout);

// GET /email-settings - Récupération des paramètres email (pas de validation nécessaire)
router.get('/email-settings', auth, authController.getEmailSettings);

// PUT /email-settings - Mise à jour des paramètres email
router.put('/email-settings', auth, [
  body('smtpHost')
    .optional()
    .trim(),
  body('smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 }).withMessage('Le port SMTP doit être entre 1 et 65535'),
  body('smtpUser')
    .optional()
    .trim(),
  body('smtpPass')
    .optional(),
  body('senderName')
    .optional()
    .trim()
    .escape(),
  body('senderEmail')
    .optional()
    .isEmail().withMessage('Email expéditeur invalide')
    .normalizeEmail()
], validate, authController.updateEmailSettings);

module.exports = router;