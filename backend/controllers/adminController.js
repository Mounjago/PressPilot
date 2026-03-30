/**
 * ADMIN CONTROLLER
 * Gestion des utilisateurs, organisations et statistiques cross-workspace
 * Accessible uniquement aux roles admin et super_admin
 */

const User = require('../models/User');
const Organization = require('../models/Organization');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
const PressRelease = require('../models/PressRelease');
const Event = require('../models/Event');
const MediaKit = require('../models/MediaKit');
const { ROLES, INTERFACES, getInterfacesForRole } = require('../constants/roles');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'presspilot-admin' },
  transports: [new winston.transports.Console()]
});

// ============================================================
// STATISTIQUES CROSS-WORKSPACE
// ============================================================

/**
 * Statistiques globales (dashboard admin)
 * @route GET /api/admin/stats
 */
const getGlobalStats = async (req, res) => {
  try {
    // Comptes utilisateurs par role
    const [
      totalUsers,
      activeUsers,
      pressAgents,
      rpUsers,
      admins,
      totalContacts,
      totalCampaigns,
      totalOrganizations,
      // Stats RP
      totalPressReleases,
      publishedPressReleases,
      totalEvents,
      upcomingEvents,
      totalMediaKits
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: ROLES.PRESS_AGENT, isActive: true }),
      User.countDocuments({ role: ROLES.BANDSTREAM_RP, isActive: true }),
      User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, isActive: true }),
      Contact.countDocuments({ isArchived: { $ne: true } }),
      Campaign.countDocuments({ isArchived: { $ne: true } }),
      Organization.countDocuments({ isActive: true }),
      // RP stats
      PressRelease.countDocuments({}),
      PressRelease.countDocuments({ status: 'published' }),
      Event.countDocuments({}),
      Event.countDocuments({ startDate: { $gte: new Date() }, status: { $ne: 'cancelled' } }),
      MediaKit.countDocuments({ isArchived: { $ne: true } })
    ]);

    // Derniers utilisateurs inscrits
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt lastLogin');

    // Activite recente (derniers logins)
    const recentActivity = await User.find({ lastLogin: { $ne: null } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email role lastLogin');

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: {
            press_agent: pressAgents,
            bandstream_rp: rpUsers,
            admin: admins
          }
        },
        press: {
          contacts: totalContacts,
          campaigns: totalCampaigns
        },
        rp: {
          pressReleases: {
            total: totalPressReleases,
            published: publishedPressReleases
          },
          events: {
            total: totalEvents,
            upcoming: upcomingEvents
          },
          mediaKits: totalMediaKits
        },
        organizations: totalOrganizations,
        recentUsers,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Admin getGlobalStats error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des statistiques'
    });
  }
};

// ============================================================
// GESTION DES UTILISATEURS
// ============================================================

/**
 * Lister tous les utilisateurs avec filtres
 * @route GET /api/admin/users
 * @query {role, isActive, search, page, limit, sort}
 */
const getUsers = async (req, res) => {
  try {
    const {
      role,
      isActive,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -aiSettings.apiKey')
        .populate('organizationId', 'name slug type')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Admin getUsers error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des utilisateurs'
    });
  }
};

/**
 * Obtenir un utilisateur par ID
 * @route GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -aiSettings.apiKey')
      .populate('organizationId', 'name slug type');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    // Statistiques de l'utilisateur
    const [contactCount, campaignCount] = await Promise.all([
      Contact.countDocuments({ createdBy: user._id, isArchived: { $ne: true } }),
      Campaign.countDocuments({ createdBy: user._id, isArchived: { $ne: true } })
    ]);

    return res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          contacts: contactCount,
          campaigns: campaignCount
        }
      }
    });
  } catch (error) {
    logger.error('Admin getUserById error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation de l\'utilisateur'
    });
  }
};

/**
 * Creer un utilisateur (par l'admin)
 * @route POST /api/admin/users
 * @body {name, email, password, role, company, organizationId}
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, company, organizationId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont obligatoires'
      });
    }

    // Verifier que l'email n'existe pas deja
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est deja utilise'
      });
    }

    // Valider le role
    const validRoles = Object.values(ROLES);
    const userRole = role || ROLES.PRESS_AGENT;
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: `Role invalide. Roles autorises: ${validRoles.join(', ')}`
      });
    }

    // Si bandstream_rp, organizationId est requis
    if (userRole === ROLES.BANDSTREAM_RP && !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Une organisation est requise pour le role bandstream_rp'
      });
    }

    // Super admin ne peut etre cree que par un super admin
    if (userRole === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut creer un autre super administrateur'
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: userRole,
      company: company || '',
      organizationId: organizationId || undefined,
      isActive: true,
      emailVerified: true, // Admin-created users are pre-verified
      emailSettings: {
        senderEmail: email,
        senderName: name,
        replyToEmail: email,
        trackOpens: true,
        trackClicks: true,
        unsubscribeLink: true
      }
    });

    await user.save();

    const publicUser = user.getPublicProfile();

    logger.info('Admin created user', {
      adminId: req.user.id,
      newUserId: user._id,
      role: userRole
    });

    return res.status(201).json({
      success: true,
      data: publicUser
    });
  } catch (error) {
    logger.error('Admin createUser error', { error: error.message, stack: error.stack });

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la creation de l\'utilisateur'
    });
  }
};

/**
 * Mettre a jour un utilisateur
 * @route PUT /api/admin/users/:id
 * @body {name, email, role, company, organizationId, isActive}
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, role, company, organizationId, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    // Empecher la modification de son propre role
    if (req.params.id === req.user.id && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre role'
      });
    }

    // Empecher la desactivation de son propre compte
    if (req.params.id === req.user.id && isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas desactiver votre propre compte'
      });
    }

    // Valider le role si fourni
    if (role) {
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Role invalide. Roles autorises: ${validRoles.join(', ')}`
        });
      }

      // Super admin ne peut etre attribue que par un super admin
      if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Seul un super administrateur peut attribuer le role super_admin'
        });
      }
    }

    // Mise a jour des champs
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (company !== undefined) user.company = company;
    if (organizationId !== undefined) user.organizationId = organizationId || undefined;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    logger.info('Admin updated user', {
      adminId: req.user.id,
      targetUserId: user._id,
      changes: Object.keys(req.body)
    });

    const updatedUser = await User.findById(user._id)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -aiSettings.apiKey')
      .populate('organizationId', 'name slug type');

    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Admin updateUser error', { error: error.message, stack: error.stack });

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise a jour de l\'utilisateur'
    });
  }
};

/**
 * Changer le role d'un utilisateur
 * @route PUT /api/admin/users/:id/role
 * @body {role}
 */
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Le role est obligatoire'
      });
    }

    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role invalide. Roles autorises: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    // Empecher la modification de son propre role
    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre role'
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    logger.info('Admin changed user role', {
      adminId: req.user.id,
      targetUserId: user._id,
      previousRole,
      newRole: role
    });

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        previousRole,
        interfaces: getInterfacesForRole(user.role)
      }
    });
  } catch (error) {
    logger.error('Admin changeUserRole error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de role'
    });
  }
};

/**
 * Verrouiller / deverrouiller un compte
 * @route PUT /api/admin/users/:id/lock
 * @body {locked: true/false}
 */
const toggleUserLock = async (req, res) => {
  try {
    const { locked } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas verrouiller votre propre compte'
      });
    }

    if (locked) {
      // Verrouiller le compte
      user.isActive = false;
      user.lockUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
    } else {
      // Deverrouiller le compte
      user.isActive = true;
      user.lockUntil = undefined;
      user.loginAttempts = 0;
    }

    await user.save();

    logger.info('Admin toggled user lock', {
      adminId: req.user.id,
      targetUserId: user._id,
      locked
    });

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        locked
      }
    });
  } catch (error) {
    logger.error('Admin toggleUserLock error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du verrouillage/deverrouillage'
    });
  }
};

/**
 * Supprimer un utilisateur (soft delete)
 * @route DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Soft delete
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`; // Liberer l'email
    await user.save();

    logger.info('Admin deleted user', {
      adminId: req.user.id,
      targetUserId: user._id
    });

    return res.json({
      success: true,
      message: 'Utilisateur supprime avec succes'
    });
  } catch (error) {
    logger.error('Admin deleteUser error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};

// ============================================================
// GESTION DES ORGANISATIONS
// ============================================================

/**
 * Lister toutes les organisations
 * @route GET /api/admin/organizations
 */
const getOrganizations = async (req, res) => {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (status) filter['subscription.status'] = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Organization.countDocuments(filter)
    ]);

    // Enrichir avec le nombre de membres actifs
    const enriched = await Promise.all(
      organizations.map(async (org) => {
        const memberCount = await User.countDocuments({
          organizationId: org._id,
          isActive: true
        });
        return {
          ...org.toObject(),
          memberCount
        };
      })
    );

    return res.json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Admin getOrganizations error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des organisations'
    });
  }
};

/**
 * Obtenir une organisation par ID
 * @route GET /api/admin/organizations/:id
 */
const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvee'
      });
    }

    // Membres de l'organisation
    const members = await User.find({ organizationId: org._id })
      .select('name email role isActive lastLogin createdAt')
      .sort('-createdAt');

    // Stats actualisees
    await Organization.updateStats(org._id);

    return res.json({
      success: true,
      data: {
        ...org.toObject(),
        members
      }
    });
  } catch (error) {
    logger.error('Admin getOrganizationById error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation de l\'organisation'
    });
  }
};

/**
 * Creer une organisation
 * @route POST /api/admin/organizations
 * @body {name, type, description, contactEmail, website}
 */
const createOrganization = async (req, res) => {
  try {
    const { name, type, description, contactEmail, website } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'organisation est obligatoire'
      });
    }

    const org = new Organization({
      name,
      type: type || 'corporate',
      description,
      contactEmail,
      website,
      createdBy: req.user.id
    });

    await org.save();

    logger.info('Admin created organization', {
      adminId: req.user.id,
      orgId: org._id,
      orgName: org.name
    });

    return res.status(201).json({
      success: true,
      data: org
    });
  } catch (error) {
    logger.error('Admin createOrganization error', { error: error.message, stack: error.stack });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Une organisation avec ce slug existe deja'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la creation de l\'organisation'
    });
  }
};

/**
 * Mettre a jour une organisation
 * @route PUT /api/admin/organizations/:id
 */
const updateOrganization = async (req, res) => {
  try {
    const { name, type, description, contactEmail, website, isActive, settings } = req.body;

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvee'
      });
    }

    if (name !== undefined) org.name = name;
    if (type !== undefined) org.type = type;
    if (description !== undefined) org.description = description;
    if (contactEmail !== undefined) org.contactEmail = contactEmail;
    if (website !== undefined) org.website = website;
    if (isActive !== undefined) org.isActive = isActive;
    if (settings) {
      if (settings.maxUsers !== undefined) org.settings.maxUsers = settings.maxUsers;
      if (settings.features) {
        Object.assign(org.settings.features, settings.features);
      }
      if (settings.branding) {
        Object.assign(org.settings.branding, settings.branding);
      }
    }

    await org.save();

    logger.info('Admin updated organization', {
      adminId: req.user.id,
      orgId: org._id,
      changes: Object.keys(req.body)
    });

    return res.json({
      success: true,
      data: org
    });
  } catch (error) {
    logger.error('Admin updateOrganization error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise a jour de l\'organisation'
    });
  }
};

/**
 * Supprimer une organisation
 * @route DELETE /api/admin/organizations/:id
 */
const deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvee'
      });
    }

    // Verifier qu'il n'y a plus de membres actifs
    const memberCount = await User.countDocuments({
      organizationId: org._id,
      isActive: true
    });

    if (memberCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer: ${memberCount} membre(s) actif(s) dans cette organisation`
      });
    }

    org.isActive = false;
    await org.save();

    logger.info('Admin deleted organization', {
      adminId: req.user.id,
      orgId: org._id
    });

    return res.json({
      success: true,
      message: 'Organisation desactivee avec succes'
    });
  } catch (error) {
    logger.error('Admin deleteOrganization error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'organisation'
    });
  }
};

// ============================================================
// ANALYTICS CROSS-WORKSPACE
// ============================================================

/**
 * Analytics globales (press + rp combinees)
 * @route GET /api/admin/analytics
 * @query {period: '7d' | '30d' | '90d' | '1y'}
 */
const getCrossWorkspaceAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '30d';

    // Calculer la date de debut selon la periode
    const periodMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Stats press workspace
    const [
      newContacts,
      activeCampaigns,
      // Stats RP workspace
      newPressReleases,
      publishedPressReleases,
      newEvents,
      newMediaKits,
      // Utilisateurs
      newUsers,
      activeUsersInPeriod
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: startDate }, isArchived: { $ne: true } }),
      Campaign.countDocuments({
        createdAt: { $gte: startDate },
        isArchived: { $ne: true },
        status: { $in: ['draft', 'sending', 'scheduled'] }
      }),
      PressRelease.countDocuments({ createdAt: { $gte: startDate } }),
      PressRelease.countDocuments({ publishedAt: { $gte: startDate } }),
      Event.countDocuments({ createdAt: { $gte: startDate } }),
      MediaKit.countDocuments({ createdAt: { $gte: startDate }, isArchived: { $ne: true } }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ lastLogin: { $gte: startDate } })
    ]);

    // Croissance utilisateurs par jour (pour graphique)
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        press: {
          newContacts,
          activeCampaigns
        },
        rp: {
          newPressReleases,
          publishedPressReleases,
          newEvents,
          newMediaKits
        },
        users: {
          newUsers,
          activeUsersInPeriod
        },
        charts: {
          userGrowth
        }
      }
    });
  } catch (error) {
    logger.error('Admin getCrossWorkspaceAnalytics error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des analytics'
    });
  }
};

module.exports = {
  // Stats
  getGlobalStats,
  getCrossWorkspaceAnalytics,
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserRole,
  toggleUserLock,
  deleteUser,
  // Organizations
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
