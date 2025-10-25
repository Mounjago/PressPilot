/**
 * ROUTES IMAP - Gestion des configurations email IMAP
 * Routes Express pour configurer et gérer les comptes IMAP des utilisateurs
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const IMAPConfiguration = require('../models/IMAPConfiguration');
const imapService = require('../services/imapService');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * RATE LIMITING
 */
const testConnectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Maximum 10 tests de connexion par utilisateur
  message: {
    success: false,
    message: 'Trop de tests de connexion. Réessayez dans 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * VALIDATEURS
 */
const createConfigValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la configuration est obligatoire')
    .isLength({ min: 1, max: 100 })
    .withMessage('Le nom doit contenir entre 1 et 100 caractères'),

  body('email')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),

  body('provider')
    .isIn(['gmail', 'outlook', 'yahoo', 'custom'])
    .withMessage('Provider non supporté'),

  body('imapConfig.host')
    .trim()
    .notEmpty()
    .withMessage('Le serveur IMAP est obligatoire'),

  body('imapConfig.port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Le port doit être entre 1 et 65535'),

  body('imapConfig.username')
    .trim()
    .notEmpty()
    .withMessage('Le nom d\'utilisateur est obligatoire'),

  body('imapConfig.password')
    .isLength({ min: 1 })
    .withMessage('Le mot de passe est obligatoire'),

  body('pollingConfig.intervalMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('L\'intervalle doit être entre 1 et 60 minutes'),

  body('pollingConfig.maxMessages')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Le nombre max de messages doit être entre 1 et 500')
];

const updateConfigValidators = [
  param('id').isMongoId().withMessage('ID invalide'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le nom doit contenir entre 1 et 100 caractères'),

  body('pollingConfig.intervalMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('L\'intervalle doit être entre 1 et 60 minutes'),

  body('pollingConfig.enabled')
    .optional()
    .isBoolean()
    .withMessage('Le statut enabled doit être un booléen')
];

/**
 * GET /api/imap - Récupérer les configurations IMAP de l'utilisateur
 */
router.get('/', auth, async (req, res) => {
  try {
    const configurations = await IMAPConfiguration.findByUser(req.user.id);

    res.json({
      success: true,
      data: configurations.map(config => config.getPublicConfig())
    });

  } catch (error) {
    console.error('❌ Erreur récupération configurations IMAP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des configurations'
    });
  }
});

/**
 * GET /api/imap/presets - Récupérer les presets pour les providers
 */
router.get('/presets', auth, async (req, res) => {
  try {
    const presets = {
      gmail: IMAPConfiguration.getPresetForProvider('gmail'),
      outlook: IMAPConfiguration.getPresetForProvider('outlook'),
      yahoo: IMAPConfiguration.getPresetForProvider('yahoo')
    };

    res.json({
      success: true,
      data: presets
    });

  } catch (error) {
    console.error('❌ Erreur récupération presets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des presets'
    });
  }
});

/**
 * GET /api/imap/:id - Récupérer une configuration spécifique
 */
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('ID invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    res.json({
      success: true,
      data: config.getPublicConfig()
    });

  } catch (error) {
    console.error('❌ Erreur récupération configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration'
    });
  }
});

/**
 * POST /api/imap - Créer une nouvelle configuration IMAP
 */
router.post('/', auth, createConfigValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      provider,
      imapConfig,
      pollingConfig = {},
      filters = {}
    } = req.body;

    // Appliquer les presets pour les providers connus
    let finalImapConfig = { ...imapConfig };
    if (provider !== 'custom') {
      const preset = IMAPConfiguration.getPresetForProvider(provider);
      if (preset) {
        finalImapConfig = {
          ...preset,
          ...finalImapConfig,
          // Garder le username et password de l'utilisateur
          username: imapConfig.username,
          passwordEncrypted: imapConfig.password // Sera chiffré par le middleware
        };
      }
    } else {
      finalImapConfig.passwordEncrypted = imapConfig.password;
    }

    // Créer la configuration
    const config = new IMAPConfiguration({
      userId: req.user.id,
      name,
      email,
      provider,
      imapConfig: finalImapConfig,
      pollingConfig: {
        enabled: true,
        intervalMinutes: 5,
        mailbox: 'INBOX',
        markAsRead: false,
        onlyUnread: true,
        maxMessages: 50,
        ...pollingConfig
      },
      filters: {
        dateFilter: {
          enabled: true,
          daysBack: 7
        },
        excludeAutoReply: true,
        ...filters
      }
    });

    await config.save();

    res.status(201).json({
      success: true,
      message: 'Configuration IMAP créée avec succès',
      data: config.getPublicConfig()
    });

  } catch (error) {
    console.error('❌ Erreur création configuration IMAP:', error);

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

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une configuration avec ce nom existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la configuration'
    });
  }
});

/**
 * PUT /api/imap/:id - Mettre à jour une configuration IMAP
 */
router.put('/:id', auth, updateConfigValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = [
      'name', 'pollingConfig', 'filters'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'pollingConfig' || field === 'filters') {
          config[field] = { ...config[field].toObject(), ...req.body[field] };
        } else {
          config[field] = req.body[field];
        }
      }
    });

    await config.save();

    res.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: config.getPublicConfig()
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration'
    });
  }
});

/**
 * DELETE /api/imap/:id - Supprimer une configuration IMAP
 */
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('ID invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    // Arrêter le polling pour cette configuration
    imapService.stopPollingForConfiguration(config._id);

    // Marquer comme inactive au lieu de supprimer
    config.isActive = false;
    config.status = 'inactive';
    await config.save();

    res.json({
      success: true,
      message: 'Configuration supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la configuration'
    });
  }
});

/**
 * POST /api/imap/:id/test - Tester une connexion IMAP
 */
router.post('/:id/test', auth, testConnectionLimiter, [
  param('id').isMongoId().withMessage('ID invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    // Tester la connexion
    const result = await config.testConnection();

    // Mettre à jour les statistiques
    await config.updateConnectionStats(true);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur test connexion:', error);

    // Mettre à jour les statistiques d'erreur
    try {
      const config = await IMAPConfiguration.findOne({
        _id: req.params.id,
        userId: req.user.id
      });
      if (config) {
        await config.updateConnectionStats(false, error);
      }
    } catch (updateError) {
      console.error('❌ Erreur mise à jour stats:', updateError);
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Erreur de connexion IMAP',
      details: {
        code: error.code,
        syscall: error.syscall,
        hostname: error.hostname
      }
    });
  }
});

/**
 * POST /api/imap/:id/poll - Forcer un poll pour une configuration
 */
router.post('/:id/poll', auth, [
  param('id').isMongoId().withMessage('ID invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    // Forcer un poll
    await imapService.forcePoll(config._id);

    res.json({
      success: true,
      message: 'Poll forcé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur poll forcé:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du poll forcé'
    });
  }
});

/**
 * POST /api/imap/:id/toggle - Activer/Désactiver le polling
 */
router.post('/:id/toggle', auth, [
  param('id').isMongoId().withMessage('ID invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const config = await IMAPConfiguration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }

    // Basculer l'état du polling
    config.pollingConfig.enabled = !config.pollingConfig.enabled;
    config.status = config.pollingConfig.enabled ? 'active' : 'inactive';

    await config.save();

    // Gérer le polling dans le service
    if (config.pollingConfig.enabled) {
      await imapService.startPollingForConfiguration(config);
    } else {
      imapService.stopPollingForConfiguration(config._id);
    }

    res.json({
      success: true,
      message: `Polling ${config.pollingConfig.enabled ? 'activé' : 'désactivé'}`,
      data: config.getPublicConfig()
    });

  } catch (error) {
    console.error('❌ Erreur toggle polling:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du basculement du polling'
    });
  }
});

/**
 * GET /api/imap/service/status - Obtenir le statut du service IMAP
 */
router.get('/service/status', auth, async (req, res) => {
  try {
    const status = imapService.getStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Erreur statut service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
});

module.exports = router;