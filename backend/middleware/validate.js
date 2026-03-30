/**
 * MIDDLEWARE DE VALIDATION - Gestionnaire centralise des erreurs express-validator
 * Intercepte les erreurs de validation et retourne une reponse 400 formatee
 */

const { validationResult } = require('express-validator');

/**
 * Middleware qui verifie les resultats de validation express-validator
 * A utiliser apres les regles de validation dans les routes
 *
 * Usage:
 *   router.post('/', [
 *     body('email').isEmail(),
 *     body('name').notEmpty()
 *   ], validate, controller.create);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatter les erreurs pour une reponse claire
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value !== undefined ? String(err.value).substring(0, 100) : undefined,
      location: err.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }

  next();
};

module.exports = validate;
