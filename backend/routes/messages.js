const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const messagesController = require('../controllers/messagesController');

// Specific routes BEFORE param routes
router.get('/search',
  auth,
  [
    query('q').notEmpty().withMessage('Terme de recherche requis').trim()
  ],
  validate,
  messagesController.search
);

router.get('/stats', auth, messagesController.getStats);

router.get('/config/:configId',
  auth,
  [
    param('configId').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  messagesController.getByConfig
);

router.get('/campaign/:campaignId',
  auth,
  [
    param('campaignId').isMongoId().withMessage('ID campagne invalide')
  ],
  validate,
  messagesController.getByCampaign
);

// General routes
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('status').optional().isIn(['unread', 'read', 'flagged', 'archived']).withMessage('Statut invalide')
  ],
  validate,
  messagesController.getAll
);

// Param routes
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide')
  ],
  validate,
  messagesController.getById
);

router.patch('/:id/read',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide')
  ],
  validate,
  messagesController.markAsRead
);

router.patch('/:id/flag',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide')
  ],
  validate,
  messagesController.markAsFlagged
);

router.patch('/:id/archive',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide')
  ],
  validate,
  messagesController.archive
);

// Tags management
router.post('/:id/tags',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide'),
    body('tag').notEmpty().withMessage('Tag requis').isLength({ max: 50 }).withMessage('Tag: max 50 caracteres').trim().escape()
  ],
  validate,
  messagesController.addTag
);

router.delete('/:id/tags/:tag',
  auth,
  [
    param('id').isMongoId().withMessage('ID message invalide'),
    param('tag').notEmpty().withMessage('Tag requis').trim()
  ],
  validate,
  messagesController.removeTag
);

module.exports = router;