const router = require('express').Router();
const { body, param } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const imapController = require('../controllers/imapController');

// Specific routes BEFORE param routes
router.get('/presets', auth, imapController.getPresets);
router.get('/service/status', auth, imapController.getServiceStatus);

// General CRUD routes
router.get('/', auth, imapController.getAll);

router.post('/',
  auth,
  [
    body('host').notEmpty().withMessage('Hote IMAP requis').trim(),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('Port invalide'),
    body('user').notEmpty().withMessage('Utilisateur requis').trim(),
    body('password').notEmpty().withMessage('Mot de passe requis'),
    body('tls').optional().isBoolean(),
    body('mailbox').optional().trim()
  ],
  validate,
  imapController.create
);

// Param routes
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  imapController.getById
);

router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide'),
    body('host').optional().trim(),
    body('port').optional().isInt({ min: 1, max: 65535 }).withMessage('Port invalide'),
    body('user').optional().trim(),
    body('password').optional(),
    body('tls').optional().isBoolean(),
    body('mailbox').optional().trim()
  ],
  validate,
  imapController.update
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  imapController.delete
);

// IMAP actions
router.post('/:id/test',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  imapController.testConnection
);

router.post('/:id/poll',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  imapController.forcePoll
);

router.post('/:id/toggle',
  auth,
  [
    param('id').isMongoId().withMessage('ID configuration invalide')
  ],
  validate,
  imapController.togglePolling
);

module.exports = router;