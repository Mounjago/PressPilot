/**
 * ROUTES PRESS RELEASES - Communiques de presse
 * Interface: BandStream RP
 * Toutes les routes necessitent auth + interface rp (sauf admin qui a acces partout)
 */

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requireInterface } = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const controller = require('../controllers/pressReleasesController');

// Middleware commun: auth + interface RP
const rpAuth = [auth, requireInterface('rp')];

// --- Routes specifiques AVANT les routes :id ---

// GET /stats - Statistiques
router.get('/stats', ...rpAuth, controller.getStats);

// --- CRUD ---

// GET / - Liste des communiques
router.get('/',
  ...rpAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'review', 'approved', 'published', 'archived', 'all']),
    query('category').optional().isIn(['corporate', 'product', 'partnership', 'event', 'financial', 'talent', 'crisis', 'industry', 'other', 'all']),
    query('search').optional().isString().trim()
  ],
  validate,
  controller.getAll
);

// POST / - Creer un communique
router.post('/',
  ...rpAuth,
  [
    body('title').notEmpty().withMessage('Titre requis').trim(),
    body('content').notEmpty().withMessage('Contenu requis'),
    body('category').optional().isIn(['corporate', 'product', 'partnership', 'event', 'financial', 'talent', 'crisis', 'industry', 'other']),
    body('language').optional().isIn(['fr', 'en', 'es', 'de'])
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
    body('title').optional().trim(),
    body('category').optional().isIn(['corporate', 'product', 'partnership', 'event', 'financial', 'talent', 'crisis', 'industry', 'other']),
    body('status').optional().isIn(['draft', 'archived'])
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

// --- Workflow ---

// POST /:id/submit - Soumettre pour relecture
router.post('/:id/submit',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.submitForReview
);

// POST /:id/approve - Approuver
router.post('/:id/approve',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.approve
);

// POST /:id/reject - Rejeter
router.post('/:id/reject',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('reason').optional().isString().trim()
  ],
  validate,
  controller.reject
);

// POST /:id/publish - Publier
router.post('/:id/publish',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.publish
);

// POST /:id/duplicate - Dupliquer
router.post('/:id/duplicate',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.duplicate
);

module.exports = router;
