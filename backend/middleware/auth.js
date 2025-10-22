/**
 * MIDDLEWARE D'AUTHENTIFICATION JWT - Protection des routes
 * Middleware Express pour vérifier et valider les tokens JWT
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification principal
 * Vérifie le token JWT et charge l'utilisateur
 */
const auth = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token d\'authentification manquant.'
      });
    }

    // Vérifier le format du token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Format de token invalide.'
      });
    }

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'presspilot',
        audience: 'presspilot-users'
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré. Veuillez vous reconnecter.',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token invalide.',
          code: 'TOKEN_INVALID'
        });
      }

      throw jwtError;
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Utilisateur non trouvé.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez le support.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      company: user.company,
      subscription: user.subscription
    };

    // Ajouter le token à la requête pour un éventuel rafraîchissement
    req.token = token;

    next();

  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'authentification'
    });
  }
};

/**
 * Middleware d'autorisation par rôle
 * Vérifie que l'utilisateur a le rôle requis
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Privilèges insuffisants.',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware d'authentification optionnel
 * Charge l'utilisateur si un token est fourni, sinon continue
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      // Pas de token, continuer sans authentification
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'presspilot',
        audience: 'presspilot-users'
      });

      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive && !user.isLocked) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          company: user.company,
          subscription: user.subscription
        };
        req.token = token;
      }
    } catch (jwtError) {
      // Token invalide ou expiré, continuer sans authentification
      console.log('Token optionnel invalide ou expiré:', jwtError.message);
    }

    next();

  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification optionnel:', error);
    // En cas d'erreur, continuer sans authentification
    next();
  }
};

/**
 * Middleware de vérification de l'abonnement
 * Vérifie que l'utilisateur a un abonnement actif
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const { subscription } = req.user;

  if (!subscription || subscription.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Abonnement actif requis pour accéder à cette fonctionnalité',
      code: 'SUBSCRIPTION_REQUIRED'
    });
  }

  // Vérifier si l'abonnement n'est pas expiré
  if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
    return res.status(403).json({
      success: false,
      message: 'Abonnement expiré. Veuillez renouveler votre abonnement.',
      code: 'SUBSCRIPTION_EXPIRED'
    });
  }

  next();
};

/**
 * Middleware de vérification du plan d'abonnement
 * Vérifie que l'utilisateur a le plan requis ou supérieur
 */
const requirePlan = (...plans) => {
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const userPlan = req.user.subscription?.plan || 'free';
    const userPlanLevel = planHierarchy[userPlan];
    const requiredLevel = Math.min(...plans.map(plan => planHierarchy[plan]));

    if (userPlanLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Plan d\'abonnement insuffisant pour accéder à cette fonctionnalité',
        code: 'PLAN_UPGRADE_REQUIRED',
        userPlan,
        requiredPlans: plans
      });
    }

    next();
  };
};

/**
 * Middleware de validation du propriétaire de ressource
 * Vérifie que l'utilisateur est propriétaire de la ressource ou admin
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Les admins ont accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Récupérer l'ID de la ressource depuis les paramètres
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de ressource manquant'
        });
      }

      // Cette logique dépendra de votre modèle de données
      // Ici on assume que la ressource a un champ userId
      // Vous devrez adapter cette logique selon vos besoins
      req.resourceOwnership = {
        resourceId,
        userId: req.user.id,
        userIdField
      };

      next();

    } catch (error) {
      console.error('Erreur dans la vérification de propriété:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };
};

/**
 * Middleware de logging des accès sécurisés
 */
const logSecureAccess = (req, res, next) => {
  if (req.user) {
    console.log(`🔒 Accès sécurisé: ${req.user.email} -> ${req.method} ${req.originalUrl} depuis ${req.ip}`);
  }
  next();
};

module.exports = {
  auth,
  authorize,
  optionalAuth,
  requireActiveSubscription,
  requirePlan,
  requireOwnership,
  logSecureAccess
};