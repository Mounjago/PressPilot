/**
 * MIDDLEWARE DATASCOPE - Isolation des donnees par workspace
 * Injecte des filtres de requete selon le role et l'interface de l'utilisateur
 * pour garantir l'isolation des donnees entre workspaces
 */

const {
  INTERFACES,
  CONTACT_VISIBILITY,
  isAdminRole
} = require('../constants/roles');

/**
 * Middleware: injectDataScope
 * Injecte req.dataScope avec les filtres de donnees adaptes au contexte
 *
 * req.dataScope contient:
 *   - userId: ID de l'utilisateur
 *   - role: role de l'utilisateur
 *   - organizationId: ID de l'organisation (si applicable)
 *   - currentInterface: interface active
 *   - isAdmin: boolean
 *   - filter: objet filtre MongoDB de base a appliquer aux requetes
 */
const injectDataScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }

  const scope = {
    userId: req.user.id,
    role: req.user.role,
    organizationId: req.user.organizationId || null,
    currentInterface: req.currentInterface || null,
    isAdmin: isAdminRole(req.user.role),
    filter: {}
  };

  // Les admins voient tout (pas de filtre de base)
  if (scope.isAdmin) {
    // Si l'admin a choisi une interface, filtrer par interface
    if (scope.currentInterface) {
      scope.filter.interface = scope.currentInterface;
    }
  } else {
    // Utilisateur standard: filtrer par createur
    scope.filter.createdBy = req.user.id;
  }

  req.dataScope = scope;
  next();
};

/**
 * Construit un filtre MongoDB pour les contacts selon la visibilite
 *
 * Regles de visibilite:
 *   - private: uniquement le createur
 *   - organization: tous les membres de l'organisation
 *   - shared_pool: lecture pour tous, ecriture pour le createur uniquement
 *
 * @param {Object} scope - req.dataScope
 * @param {String} accessMode - 'read' ou 'write'
 * @returns {Object} Filtre MongoDB
 */
function buildContactFilter(scope, accessMode = 'read') {
  // Les admins voient tout
  if (scope.isAdmin) {
    const filter = {};
    if (scope.currentInterface) {
      filter.interface = scope.currentInterface;
    }
    return filter;
  }

  if (accessMode === 'write') {
    // Ecriture: uniquement ses propres contacts
    return { createdBy: scope.userId };
  }

  // Lecture: contacts prives + organisation + pool partage
  const orConditions = [
    // Ses propres contacts
    { createdBy: scope.userId },
    // Contacts du pool partage
    { visibility: CONTACT_VISIBILITY.SHARED_POOL }
  ];

  // Si l'utilisateur appartient a une organisation, voir les contacts de l'organisation
  if (scope.organizationId) {
    orConditions.push({
      organizationId: scope.organizationId,
      visibility: CONTACT_VISIBILITY.ORGANIZATION
    });
  }

  const filter = { $or: orConditions };

  // Filtrer par interface si definie
  if (scope.currentInterface) {
    filter.interface = scope.currentInterface;
  }

  return filter;
}

/**
 * Construit un filtre MongoDB generique selon le scope
 *
 * @param {Object} scope - req.dataScope
 * @param {Object} additionalFilters - Filtres supplementaires
 * @returns {Object} Filtre MongoDB
 */
function buildFilter(scope, additionalFilters = {}) {
  const filter = { ...scope.filter, ...additionalFilters };

  // Ne pas inclure les elements archives par defaut
  if (filter.isArchived === undefined) {
    filter.isArchived = { $ne: true };
  }

  return filter;
}

/**
 * Construit un filtre pour les campagnes selon le scope
 * Les campagnes sont filtrees par interface ET par createur (sauf admin)
 */
function buildCampaignFilter(scope, additionalFilters = {}) {
  const filter = { ...additionalFilters };

  if (scope.isAdmin) {
    if (scope.currentInterface) {
      filter.interface = scope.currentInterface;
    }
  } else {
    filter.createdBy = scope.userId;
    if (scope.currentInterface) {
      filter.interface = scope.currentInterface;
    }
  }

  if (filter.isArchived === undefined) {
    filter.isArchived = { $ne: true };
  }

  return filter;
}

/**
 * Middleware: requireOwnership
 * Verifie que l'utilisateur est proprietaire d'une ressource chargee
 * Doit etre utilise APRES avoir charge la ressource dans req.resource
 */
const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  // Admins passent toujours
  if (isAdminRole(req.user.role)) {
    return next();
  }

  if (!req.resource) {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvee'
    });
  }

  const ownerId = (req.resource.createdBy || req.resource.userId || '').toString();
  const userId = req.user.id.toString();

  if (ownerId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Acces refuse. Vous n\'etes pas proprietaire de cette ressource.',
      code: 'OWNERSHIP_REQUIRED'
    });
  }

  next();
};

module.exports = {
  injectDataScope,
  buildContactFilter,
  buildFilter,
  buildCampaignFilter,
  requireOwnership
};
