/**
 * ROUTES MEDIA KITS - Dossiers de presse
 * Interface: BandStream RP (sauf route publique)
 */

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requireInterface } = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const controller = require('../controllers/mediaKitsController');

// Middleware commun
const rpAuth = [auth, requireInterface('rp')];

// --- Route publique (pas d'auth) ---

// GET /public/:slug - Acces public a un media kit
router.get('/public/:slug',
  [param('slug').isString().trim()],
  validate,
  controller.getPublic
);

// --- Routes specifiques AVANT les routes :id ---

// GET /stats - Statistiques
router.get('/stats', ...rpAuth, controller.getStats);

// --- CRUD ---

// GET / - Liste des media kits
router.get('/',
  ...rpAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'active', 'archived', 'all']),
    query('context').optional().isIn(['company', 'product', 'event', 'campaign', 'executive', 'crisis', 'seasonal', 'other', 'all']),
    query('search').optional().isString().trim()
  ],
  validate,
  controller.getAll
);

// POST / - Creer un media kit
router.post('/',
  ...rpAuth,
  [
    body('name').notEmpty().withMessage('Nom requis').trim(),
    body('context').optional().isIn(['company', 'product', 'event', 'campaign', 'executive', 'crisis', 'seasonal', 'other']),
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
    body('name').optional().trim(),
    body('context').optional().isIn(['company', 'product', 'event', 'campaign', 'executive', 'crisis', 'seasonal', 'other']),
    body('status').optional().isIn(['draft', 'active', 'archived'])
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

// --- Gestion des assets ---

// POST /:id/assets - Ajouter un asset
router.post('/:id/assets',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID media kit invalide'),
    body('name').notEmpty().withMessage('Nom de l\'asset requis').trim(),
    body('category').optional().isIn(['logo', 'photo', 'video', 'document', 'infographic', 'presentation', 'audio', 'social_media', 'template', 'other'])
  ],
  validate,
  controller.addAsset
);

// DELETE /:id/assets/:assetId - Retirer un asset
router.delete('/:id/assets/:assetId',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID media kit invalide'),
    param('assetId').isMongoId().withMessage('ID asset invalide')
  ],
  validate,
  controller.removeAsset
);

// POST /:id/assets/:assetId/download - Tracker un telechargement
router.post('/:id/assets/:assetId/download',
  [
    param('id').isMongoId().withMessage('ID media kit invalide'),
    param('assetId').isMongoId().withMessage('ID asset invalide')
  ],
  validate,
  controller.trackDownload
);

// --- Acces public ---

// POST /:id/public - Activer l'acces public
router.post('/:id/public',
  ...rpAuth,
  [
    param('id').isMongoId().withMessage('ID invalide'),
    body('password').optional().isString().trim(),
    body('expiresAt').optional().isISO8601()
  ],
  validate,
  controller.enablePublicAccess
);

// DELETE /:id/public - Desactiver l'acces public
router.delete('/:id/public',
  ...rpAuth,
  [param('id').isMongoId().withMessage('ID invalide')],
  validate,
  controller.disablePublicAccess
);

module.exports = router;
