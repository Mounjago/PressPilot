const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const contactsController = require('../controllers/contactsController');

// Specific routes BEFORE param routes
router.get('/count',
  auth,
  contactsController.getCount
);

router.get('/stats',
  auth,
  contactsController.getStats
);

router.get('/search',
  auth,
  [
    query('q').notEmpty().withMessage('Terme de recherche requis').trim()
  ],
  validate,
  contactsController.search
);

router.get('/export',
  auth,
  contactsController.exportCSV
);

router.post('/import',
  auth,
  contactsController.importCSV
);

router.post('/import/json',
  auth,
  contactsController.importJSON
);

// General CRUD routes
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    query('type').optional().trim()
  ],
  validate,
  contactsController.getAll
);

router.post('/',
  auth,
  [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('firstName').notEmpty().withMessage('Prénom requis').trim().escape(),
    body('lastName').notEmpty().withMessage('Nom requis').trim().escape(),
    body('type').optional().isIn(['journalist', 'blogger', 'influencer', 'media', 'other']).withMessage('Type invalide'),
    body('media').optional().trim().escape(),
    body('phone').optional().trim()
  ],
  validate,
  contactsController.create
);

// Param routes
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide')
  ],
  validate,
  contactsController.getById
);

router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('email').optional().isEmail().withMessage('Email invalide').normalizeEmail(),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('type').optional().isIn(['journalist', 'blogger', 'influencer', 'media', 'other']).withMessage('Type invalide')
  ],
  validate,
  contactsController.update
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide')
  ],
  validate,
  contactsController.delete
);

// Contact engagement and tags
router.post('/:id/engagement',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('type').notEmpty().isIn(['email_sent', 'email_opened', 'email_replied', 'meeting', 'call', 'event']).withMessage('Type d\'engagement invalide'),
    body('notes').optional().trim().escape()
  ],
  validate,
  contactsController.updateEngagement
);

router.post('/:id/tags',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('tag').notEmpty().withMessage('Tag requis').isLength({ max: 50 }).withMessage('Tag: max 50 caractères').trim().escape()
  ],
  validate,
  contactsController.addTag
);

router.delete('/:id/tags/:tag',
  auth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    param('tag').notEmpty().trim().escape()
  ],
  validate,
  contactsController.removeTag
);

module.exports = router;