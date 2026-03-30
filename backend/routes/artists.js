const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const artistsController = require('../controllers/artistsController');

// CRUD routes
router.get('/',
  auth,
  [
    query('page').optional().isInt({min:1}).withMessage('Page doit être un entier positif'),
    query('limit').optional().isInt({min:1, max:100}).withMessage('Limite doit être entre 1 et 100')
  ],
  validate,
  artistsController.getAll
);

router.post('/',
  auth,
  [
    body('name').notEmpty().withMessage('Nom artiste requis').trim().escape(),
    body('genre').optional().trim().escape(),
    body('label').optional().trim().escape(),
    body('bio').optional().trim(),
    body('socialLinks.spotify').optional().isURL().withMessage('Lien Spotify invalide'),
    body('socialLinks.instagram').optional().isURL().withMessage('Lien Instagram invalide')
  ],
  validate,
  artistsController.create
);

router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID artiste invalide')
  ],
  validate,
  artistsController.getById
);

router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID artiste invalide'),
    body('name').optional().trim().escape(),
    body('genre').optional().trim().escape(),
    body('label').optional().trim().escape()
  ],
  validate,
  artistsController.update
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID artiste invalide')
  ],
  validate,
  artistsController.delete
);

module.exports = router;