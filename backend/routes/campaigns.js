const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const campaignsController = require('../controllers/campaignsController');

// Check if controller exports attachmentUpload middleware
const hasUploadMiddleware = campaignsController.attachmentUpload &&
                            typeof campaignsController.attachmentUpload.array === 'function';

// Specific routes BEFORE param routes
router.get('/stats',
  auth,
  campaignsController.getStats
);

router.get('/top-performing',
  auth,
  campaignsController.getTopPerforming
);

// General CRUD routes
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    query('status').optional().isIn(['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed']).withMessage('Statut invalide')
  ],
  validate,
  campaignsController.getAll
);

router.post('/',
  auth,
  hasUploadMiddleware ? campaignsController.attachmentUpload.array('attachments', 10) : (req, res, next) => next(),
  [
    body('name').notEmpty().withMessage('Nom de campagne requis').trim().escape(),
    body('subject').notEmpty().withMessage('Sujet requis').trim(),
    body('body').optional().isString().withMessage('Corps du message invalide'),
    body('projectId').optional().isMongoId().withMessage('ID projet invalide'),
    body('scheduledDate').optional().isISO8601().withMessage('Date planifiée invalide')
  ],
  validate,
  campaignsController.create
);

// Param routes
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.getById
);

router.put('/:id',
  auth,
  hasUploadMiddleware ? campaignsController.attachmentUpload.array('attachments', 10) : (req, res, next) => next(),
  [
    param('id').isMongoId().withMessage('ID campagne invalide'),
    body('name').optional().trim().escape(),
    body('subject').optional().trim(),
    body('body').optional().isString().withMessage('Corps du message invalide'),
    body('status').optional().isIn(['draft', 'scheduled', 'paused']).withMessage('Statut invalide'),
    body('scheduledDate').optional().isISO8601().withMessage('Date planifiée invalide')
  ],
  validate,
  campaignsController.update
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.delete
);

// Campaign actions
router.post('/:id/send',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.send
);

router.post('/:id/pause',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.pause
);

router.post('/:id/duplicate',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.duplicate
);

// Recipients management
router.post('/:id/recipients',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide'),
    body('contactIds').isArray({ min: 1 }).withMessage('Au moins un contact requis'),
    body('contactIds.*').isMongoId().withMessage('ID contact invalide')
  ],
  validate,
  campaignsController.addRecipients
);

router.delete('/:id/recipients/:contactId',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide'),
    param('contactId').isMongoId().withMessage('ID contact invalide')
  ],
  validate,
  campaignsController.removeRecipient
);

// Analytics and exchanges
router.get('/:id/analytics',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.getAnalytics
);

router.get('/:id/exchanges',
  auth,
  [
    param('id').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  campaignsController.getExchanges
);

module.exports = router;