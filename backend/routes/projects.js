const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const projectsController = require('../controllers/projectsController');

// Specific routes BEFORE param routes
router.get('/stats', auth, projectsController.getStats);

router.get('/upcoming', auth, projectsController.getUpcoming);

router.get('/search',
  auth,
  [
    query('q').notEmpty().withMessage('Terme de recherche requis').trim()
  ],
  validate,
  projectsController.search
);

// General CRUD routes
router.get('/',
  auth,
  [
    query('page').optional().isInt({min:1}).withMessage('Page doit être un entier positif'),
    query('limit').optional().isInt({min:1, max:100}).withMessage('Limite doit être entre 1 et 100'),
    query('status').optional().isIn(['planning','active','completed','on_hold','cancelled'])
      .withMessage('Statut invalide')
  ],
  validate,
  projectsController.getAll
);

router.post('/',
  auth,
  [
    body('name').notEmpty().withMessage('Nom du projet requis').trim().escape(),
    body('type').notEmpty().isIn(['single','ep','album','tour','event','other'])
      .withMessage('Type de projet invalide'),
    body('artistId').optional().isMongoId().withMessage('ID artiste invalide'),
    body('releaseDate').optional().isISO8601().withMessage('Date de sortie invalide'),
    body('budget.total').optional().isFloat({min:0}).withMessage('Budget doit être positif')
  ],
  validate,
  projectsController.create
);

// Param routes
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide')
  ],
  validate,
  projectsController.getById
);

router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide'),
    body('name').optional().trim().escape(),
    body('status').optional().isIn(['planning','active','completed','on_hold','cancelled'])
      .withMessage('Statut invalide'),
    body('releaseDate').optional().isISO8601().withMessage('Date de sortie invalide')
  ],
  validate,
  projectsController.update
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide')
  ],
  validate,
  projectsController.delete
);

// Project sub-resources
router.post('/:id/milestones',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide'),
    body('name').notEmpty().withMessage('Nom du jalon requis').trim().escape(),
    body('dueDate').optional().isISO8601().withMessage('Date d\'échéance invalide'),
    body('status').optional().isIn(['pending','in_progress','completed'])
      .withMessage('Statut du jalon invalide')
  ],
  validate,
  projectsController.addMilestone
);

router.put('/:id/milestones/:milestoneId',
  auth,
  [
    param('id').isMongoId().withMessage('ID jalon invalide'),
    param('milestoneId').isMongoId().withMessage('ID jalon invalide'),
    body('status').optional().isIn(['pending','in_progress','completed'])
      .withMessage('Statut du jalon invalide')
  ],
  validate,
  projectsController.updateMilestone
);

router.post('/:id/expenses',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide'),
    body('description').notEmpty().withMessage('Description requise').trim().escape(),
    body('amount').isFloat({min:0}).withMessage('Montant doit être positif'),
    body('category').optional().trim().escape()
  ],
  validate,
  projectsController.addExpense
);

router.post('/:id/collaborators',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide'),
    body('name').notEmpty().withMessage('Nom du collaborateur requis').trim().escape(),
    body('role').notEmpty().withMessage('Rôle requis').trim().escape(),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide')
  ],
  validate,
  projectsController.addCollaborator
);

router.put('/:id/deliverables/:deliverable',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide'),
    param('deliverable').notEmpty().withMessage('Livrable requis').trim(),
    body('status').optional().isIn(['pending','in_progress','completed','delivered'])
      .withMessage('Statut du livrable invalide')
  ],
  validate,
  projectsController.updateDeliverable
);

// Analytics
router.get('/:id/analytics',
  auth,
  [
    param('id').isMongoId().withMessage('ID projet invalide')
  ],
  validate,
  projectsController.getAnalytics
);

module.exports = router;