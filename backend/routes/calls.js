/**
 * CALLS API ROUTES - Routes pour la gestion des appels
 * Gère les opérations CRUD sur les appels avec intégration Ringover
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Middleware d'authentification unifié
const { auth, authorize } = require('../middleware/auth');

// Configuration rate limiting pour les appels
const callRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 appels par IP/utilisateur
  message: {
    error: 'Trop de tentatives d\'appel, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mock de base de données (à remplacer par votre ORM/base réelle)
let callsDatabase = [];
let callIdCounter = 1;

/**
 * VALIDATION SCHEMAS
 */
const createCallValidation = [
  body('contactId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID contact invalide'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .matches(/^[\+]?[0-9\s\-\(\)\.]{10,20}$/)
    .withMessage('Format de numéro de téléphone invalide'),

  body('startedAt')
    .isISO8601()
    .withMessage('Date de début invalide'),

  body('endedAt')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),

  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Durée invalide'),

  body('status')
    .isIn(['connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy'])
    .withMessage('Statut d\'appel invalide'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues (max 1000 caractères)'),

  body('recordingUrl')
    .optional()
    .isURL()
    .withMessage('URL d\'enregistrement invalide')
];

const updateCallValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID d\'appel invalide'),

  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Durée invalide'),

  body('status')
    .optional()
    .isIn(['connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy'])
    .withMessage('Statut d\'appel invalide'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues (max 1000 caractères)'),

  body('endedAt')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide')
];

/**
 * HELPER FUNCTIONS
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

const sanitizeCall = (call) => {
  return {
    id: call.id,
    contactId: call.contactId,
    userId: call.userId,
    phoneNumber: call.phoneNumber,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    duration: call.duration || 0,
    status: call.status,
    notes: call.notes || '',
    recordingUrl: call.recordingUrl || null,
    createdAt: call.createdAt,
    updatedAt: call.updatedAt
  };
};

/**
 * ROUTES
 */

/**
 * GET /api/calls
 * Récupère la liste des appels avec filtres
 */
router.get('/', auth, [
  query('contactId').optional().isInt({ min: 1 }),
  query('status').optional().isIn(['connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { contactId, status, startDate, endDate, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    let filteredCalls = callsDatabase.filter(call => call.userId === userId);

    // Filtrage par contact
    if (contactId) {
      filteredCalls = filteredCalls.filter(call => call.contactId == contactId);
    }

    // Filtrage par statut
    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status);
    }

    // Filtrage par date
    if (startDate) {
      filteredCalls = filteredCalls.filter(call =>
        new Date(call.startedAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredCalls = filteredCalls.filter(call =>
        new Date(call.startedAt) <= new Date(endDate)
      );
    }

    // Tri par date décroissante
    filteredCalls.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    // Pagination
    const paginatedCalls = filteredCalls.slice(offset, offset + parseInt(limit));
    const total = filteredCalls.length;

    res.json({
      success: true,
      calls: paginatedCalls.map(sanitizeCall),
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: (offset + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Erreur récupération appels:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/calls
 * Crée un nouvel appel
 */
router.post('/', auth, callRateLimit, createCallValidation, handleValidationErrors, async (req, res) => {
  try {
    const { contactId, phoneNumber, startedAt, endedAt, duration, status, notes, recordingUrl } = req.body;
    const userId = req.user.id;

    const newCall = {
      id: callIdCounter++,
      contactId: contactId || null,
      userId,
      phoneNumber,
      startedAt,
      endedAt: endedAt || null,
      duration: duration || 0,
      status,
      notes: notes || '',
      recordingUrl: recordingUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    callsDatabase.push(newCall);

    // Log de l'activité
    console.log(`📞 Nouvel appel créé: ${phoneNumber} par utilisateur ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Appel créé avec succès',
      call: sanitizeCall(newCall)
    });

  } catch (error) {
    console.error('Erreur création appel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'appel'
    });
  }
});

/**
 * GET /api/calls/:id
 * Récupère un appel spécifique
 */
router.get('/:id', auth, [
  param('id').isInt({ min: 1 }).withMessage('ID d\'appel invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const callId = parseInt(req.params.id);
    const userId = req.user.id;

    const call = callsDatabase.find(c => c.id === callId && c.userId === userId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Appel non trouvé'
      });
    }

    res.json({
      success: true,
      call: sanitizeCall(call)
    });

  } catch (error) {
    console.error('Erreur récupération appel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * PUT /api/calls/:id
 * Met à jour un appel
 */
router.put('/:id', auth, updateCallValidation, handleValidationErrors, async (req, res) => {
  try {
    const callId = parseInt(req.params.id);
    const userId = req.user.id;
    const updates = req.body;

    const callIndex = callsDatabase.findIndex(c => c.id === callId && c.userId === userId);

    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appel non trouvé'
      });
    }

    // Mise à jour des champs autorisés
    const allowedFields = ['duration', 'status', 'notes', 'endedAt', 'recordingUrl'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        callsDatabase[callIndex][field] = updates[field];
      }
    });

    callsDatabase[callIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Appel mis à jour avec succès',
      call: sanitizeCall(callsDatabase[callIndex])
    });

  } catch (error) {
    console.error('Erreur mise à jour appel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

/**
 * DELETE /api/calls/:id
 * Supprime un appel
 */
router.delete('/:id', auth, authorize(['admin', 'user']), [
  param('id').isInt({ min: 1 }).withMessage('ID d\'appel invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const callId = parseInt(req.params.id);
    const userId = req.user.id;

    const callIndex = callsDatabase.findIndex(c => c.id === callId && c.userId === userId);

    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appel non trouvé'
      });
    }

    const deletedCall = callsDatabase.splice(callIndex, 1)[0];

    console.log(`🗑️ Appel supprimé: ${deletedCall.phoneNumber} par utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Appel supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression appel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

/**
 * PATCH /api/calls/:id/notes
 * Met à jour uniquement les notes d'un appel
 */
router.patch('/:id/notes', auth, [
  param('id').isInt({ min: 1 }).withMessage('ID d\'appel invalide'),
  body('notes').isLength({ max: 1000 }).withMessage('Notes trop longues')
], handleValidationErrors, async (req, res) => {
  try {
    const callId = parseInt(req.params.id);
    const userId = req.user.id;
    const { notes } = req.body;

    const callIndex = callsDatabase.findIndex(c => c.id === callId && c.userId === userId);

    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appel non trouvé'
      });
    }

    callsDatabase[callIndex].notes = notes;
    callsDatabase[callIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Notes mises à jour avec succès',
      call: sanitizeCall(callsDatabase[callIndex])
    });

  } catch (error) {
    console.error('Erreur mise à jour notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notes'
    });
  }
});

/**
 * GET /api/calls/recent
 * Récupère les appels récents
 */
router.get('/recent', auth, [
  query('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const userCalls = callsDatabase
      .filter(call => call.userId === userId)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);

    res.json({
      success: true,
      calls: userCalls.map(sanitizeCall)
    });

  } catch (error) {
    console.error('Erreur appels récents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/calls/stats
 * Récupère les statistiques d'appels
 */
router.get('/stats', auth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('contactId').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, contactId } = req.query;

    let filteredCalls = callsDatabase.filter(call => call.userId === userId);

    // Filtrage par dates
    if (startDate) {
      filteredCalls = filteredCalls.filter(call =>
        new Date(call.startedAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredCalls = filteredCalls.filter(call =>
        new Date(call.startedAt) <= new Date(endDate)
      );
    }

    if (contactId) {
      filteredCalls = filteredCalls.filter(call => call.contactId == contactId);
    }

    // Calcul des statistiques
    const stats = {
      totalCalls: filteredCalls.length,
      connectedCalls: filteredCalls.filter(c => c.status === 'ended').length,
      missedCalls: filteredCalls.filter(c => c.status === 'missed').length,
      totalDuration: filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0),
      averageDuration: 0,
      callsByStatus: {},
      callsByDay: {}
    };

    // Calculs supplémentaires
    const connectedCalls = filteredCalls.filter(c => c.status === 'ended');
    if (connectedCalls.length > 0) {
      stats.averageDuration = Math.round(
        connectedCalls.reduce((sum, call) => sum + call.duration, 0) / connectedCalls.length
      );
    }

    // Répartition par statut
    filteredCalls.forEach(call => {
      stats.callsByStatus[call.status] = (stats.callsByStatus[call.status] || 0) + 1;
    });

    // Répartition par jour (derniers 7 jours)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(day => {
      stats.callsByDay[day] = filteredCalls.filter(call =>
        call.startedAt.split('T')[0] === day
      ).length;
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erreur stats appels:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques'
    });
  }
});

/**
 * GET /api/calls/search
 * Recherche dans les appels
 */
router.get('/search', auth, [
  query('q').notEmpty().withMessage('Terme de recherche requis'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit = 20, offset = 0 } = req.query;

    const searchTerm = q.toLowerCase();

    const matchingCalls = callsDatabase
      .filter(call => call.userId === userId)
      .filter(call =>
        call.phoneNumber.toLowerCase().includes(searchTerm) ||
        (call.notes && call.notes.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      calls: matchingCalls.map(sanitizeCall),
      searchTerm: q
    });

  } catch (error) {
    console.error('Erreur recherche appels:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

module.exports = router;