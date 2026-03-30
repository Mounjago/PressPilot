const router = require('express').Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const aiController = require('../controllers/aiController');

// POST /generate-press-release - Générer un communiqué de presse via IA
router.post('/generate-press-release', auth, [
  body('subject')
    .notEmpty().withMessage('Le sujet est requis')
    .isLength({ max: 2000 }).withMessage('Le sujet ne doit pas dépasser 2000 caractères')
    .trim()
], validate, aiController.generatePressRelease);

// GET /settings - Récupérer les paramètres IA de l'utilisateur
router.get('/settings', auth, aiController.getAiSettings);

// PUT /settings - Mettre à jour les paramètres IA
router.put('/settings', auth, [
  body('provider')
    .isIn(['openai', 'anthropic', 'gemini']).withMessage('Provider invalide (openai, anthropic, gemini)'),
  body('apiKey')
    .optional({ nullable: true })
    .isString().withMessage('La clé API doit être une chaîne de caractères'),
  body('model')
    .optional({ nullable: true })
    .isString().withMessage('Le modèle doit être une chaîne de caractères')
    .isLength({ max: 100 }).withMessage('Le nom du modèle est trop long')
], validate, aiController.updateAiSettings);

// POST /test-connection - Tester la connexion au provider IA
router.post('/test-connection', auth, aiController.testAiConnection);

module.exports = router;
