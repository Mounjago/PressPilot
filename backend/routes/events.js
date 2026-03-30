/**
 * ROUTES EVENTS - Evenements et invitations
 * Interface: BandStream RP
 * Toutes les routes necessitent auth + interface rp
 */

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requireInterface } = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const controller = require('../controllers/eventsController');

// Middleware commun
const rpAuth = [auth, requireInterface('rp')];

// --- Routes specifiques AVANT les routes :id ---

// GET /stats - Statistiques
router.get('/stats', ...rpAuth, controller.getStats);

// --- CRUD ---

// GET / - Liste des evenements
router.get('/',
  ...rpAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['planning', 'confirmed', 'invitations_sent', 'ongoing', 'completed', 'cancelled', 'postponed', 'all']),
    query('type').optional().isIn(['press_conference', 'product_launch', 'networking', 'workshop', 'webinar', 'interview_session', 'exhibition', 'gala', 'other', 'all']),
    query('upcoming').optional().isIn(['true', 'false']),
    query('search').optional().isString().trim()
  ],
  validate,
  controller.getAll
);

// POST / - Creer un evenement
router.post('/',
  ...rpAuth,
  [
    body('name').notEmpty().withMessage('Nom requis').trim(),
    body('startDate').notEmpty().withMessage('Date de debut requise').isISO8601(),
    body('type').optional().isIn(['press_conference', 'product_launch', 'networking', 'workshop', 'webinar', 'interview_session', 'exhibition', 'gala', 'other']),
    body('endDate').optional().isISO8601()
  ],
  validate,
  controller.create
);

// GET /:id - Detail
router.get('/:id',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.getById
);

// PUT /:id - Modifier
router.put('/:id',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('name').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('type').optional().isIn(['press_conference', 'product_launch', 'networking', 'workshop', 'webinar', 'interview_session', 'exhibition', 'gala', 'other'])
  ],
  validate,
  controller.update
);

// DELETE /:id - Archiver
router.delete('/:id',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.delete
);

// --- Gestion des invites ---

// POST /:id/invite - Ajouter des invites
router.post('/:id/invite',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID evenement invalide'),
    body('contactIds').isArray({ min: 1 }).withMessage('contactIds requis (tableau)'),
    body('contactIds.*').isMongoId().withMessage('ID contact invalide')
  ],
  validate,
  controller.addInvitees
);

// DELETE /:id/invite/:contactId - Retirer un invite
router.delete('/:id/invite/:contactId',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID evenement invalide'),
    param('contactId').isMongoId().withMessage('ID contact invalide')
  ],
  validate,
  controller.removeInvitee
);

// PUT /:id/rsvp/:contactId - Mettre a jour le RSVP
router.put('/:id/rsvp/:contactId',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID evenement invalide'),
    param('contactId').isMongoId().withMessage('ID contact invalide'),
    body('rsvpStatus').isIn(['pending', 'accepted', 'declined', 'tentative', 'no_response']).withMessage('Statut RSVP invalide')
  ],
  validate,
  controller.updateRSVP
);

// POST /:id/checkin/:contactId - Check-in
router.post('/:id/checkin/:contactId',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID evenement invalide'),
    param('contactId').isMongoId().withMessage('ID contact invalide')
  ],
  validate,
  controller.checkIn
);

// --- Statut ---

// PATCH /:id/status - Changer le statut
router.patch('/:id/status',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('status').isIn(['planning', 'confirmed', 'invitations_sent', 'ongoing', 'completed', 'cancelled', 'postponed']).withMessage('Statut invalide')
  ],
  validate,
  controller.updateStatus
);

module.exports = router;
