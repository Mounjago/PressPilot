/**
 * MIDDLEWARE ROLEGUARD - Controle d'acces par role et interface
 * Fournit des middlewares pour proteger les routes selon:
 *   - Le role de l'utilisateur
 *   - L'interface/workspace demande
 *   - La hierarchie des roles
 */

const {
  ROLES,
  ROLE_HIERARCHY,
  canAccessInterface,
  isAdminRole
} = require('../constants/roles');

/**
 * Middleware: requireRoles
 * Autorise uniquement les roles specifies
 *
 * Usage: router.get('/route', auth, requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), handler)
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acces refuse. Role insuffisant.',
        code: 'ROLE_FORBIDDEN',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware: requireInterface
 * Verifie que l'utilisateur a acces a l'interface demandee
 *
 * Usage: router.get('/rp/contacts', auth, requireInterface('rp'), handler)
 */
const requireInterface = (interfaceName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verifier que le role de l'utilisateur a acces a cette interface
    if (!canAccessInterface(req.user.role, interfaceName)) {
      return res.status(403).json({
        success: false,
        message: `Acces refuse a l'interface "${interfaceName}".`,
        code: 'INTERFACE_FORBIDDEN',
        requiredInterface: interfaceName,
        currentRole: req.user.role
      });
    }

    // Injecter l'interface courante dans la requete
    req.currentInterface = interfaceName;

    next();
  };
};

/**
 * Middleware: requireMinRole
 * Autorise tous les roles ayant un niveau hierarchique >= au role requis
 *
 * Usage: router.get('/admin/stats', auth, requireMinRole(ROLES.ADMIN), handler)
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Acces refuse. Niveau d\'autorisation insuffisant.',
        code: 'MIN_ROLE_FORBIDDEN',
        requiredMinRole: minRole,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware: requireAdmin
 * Raccourci pour requireMinRole(ROLES.ADMIN)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acces reserve aux administrateurs.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware: requireSuperAdmin
 * Autorise uniquement les super_admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Acces reserve aux super administrateurs.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware: requireResourceOwnership
 * Verifie que l'utilisateur est proprietaire de la ressource ou admin
 * Attend que le controller injecte req.resource avec un champ createdBy
 */
const requireResourceOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }

  // Les admins ont toujours acces
  if (isAdminRole(req.user.role)) {
    return next();
  }

  // Verifier si la ressource a ete chargee
  if (!req.resource) {
    return next(); // Sera verifie dans le controller
  }

  const ownerId = req.resource.createdBy?.toString() || req.resource.userId?.toString();

  if (ownerId && ownerId !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Acces refuse. Vous n\'etes pas proprietaire de cette ressource.',
      code: 'OWNERSHIP_REQUIRED'
    });
  }

  next();
};

module.exports = {
  requireRoles,
  requireInterface,
  requireMinRole,
  requireAdmin,
  requireSuperAdmin,
  requireResourceOwnership
};
