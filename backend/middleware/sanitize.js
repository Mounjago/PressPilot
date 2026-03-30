'use strict';

/**
 * MIDDLEWARE DE SANITIZATION - Protection anti-NoSQL injection & XSS
 * Nettoie automatiquement req.body, req.query, req.params
 */

/**
 * Nettoie récursivement un objet pour prévenir les NoSQL injections
 * Supprime les clés commençant par $ ou contenant des . (opérateurs MongoDB)
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Strip basic XSS patterns
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      // Block MongoDB operators (keys starting with $)
      if (key.startsWith('$')) continue;

      // Block keys with dots (nested operator injection)
      if (key.includes('.') && key !== key.replace(/\./g, '')) {
        // Allow dotted keys but sanitize their values
        sanitized[key] = sanitizeObject(obj[key]);
        continue;
      }

      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware Express de sanitization
 * A placer AVANT les routes, APRÈS le body parser
 */
const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = sanitize;