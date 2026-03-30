/**
 * CONTROLLER MEDIA KITS - Dossiers de presse
 * CRUD + gestion assets + acces public + metriques
 * Interface: BandStream RP (rp)
 */

const MediaKit = require('../models/MediaKit');
const { isAdminRole } = require('../constants/roles');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

// Helper: verifier propriete ou admin
const verifyAccess = async (id, userId, role) => {
  const kit = await MediaKit.findById(id);
  if (!kit) {
    const err = new Error('Media kit non trouve');
    err.status = 404;
    throw err;
  }
  if (!isAdminRole(role) && kit.createdBy.toString() !== userId.toString()) {
    const err = new Error('Acces refuse a ce media kit');
    err.status = 403;
    throw err;
  }
  return kit;
};

// GET / - Liste des media kits
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      context,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = { isArchived: { $ne: true } };

    if (!isAdminRole(req.user.role)) {
      query.createdBy = req.user.id;
    } else if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    if (status && status !== 'all') query.status = status;
    if (context && context !== 'all') query.context = context;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [mediaKits, total] = await Promise.all([
      MediaKit.find(query)
        .populate('createdBy', 'name email')
        .populate('lastEditedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MediaKit.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        mediaKits,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching media kits', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur recuperation media kits', error: error.message });
  }
};

// GET /public/:slug - Acces public a un media kit (pas d'auth requise)
const getPublic = async (req, res) => {
  try {
    const kit = await MediaKit.findByPublicSlug(req.params.slug);

    if (!kit) {
      return res.status(404).json({ success: false, message: 'Media kit non trouve ou expire' });
    }

    // Verifier le mot de passe si necessaire
    if (kit.publicAccess.password) {
      const { password } = req.query;
      if (!password || password !== kit.publicAccess.password) {
        return res.status(401).json({ success: false, message: 'Mot de passe requis', code: 'PASSWORD_REQUIRED' });
      }
    }

    // Enregistrer la vue
    kit.recordView();
    await kit.save();

    res.json({
      success: true,
      data: kit.getPublicInfo()
    });
  } catch (error) {
    logger.error('Error fetching public media kit', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur acces public', error: error.message });
  }
};

// GET /:id - Detail d'un media kit
const getById = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const populated = await MediaKit.findById(kit._id)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email')
      .populate('linkedPressReleases', 'title status')
      .populate('linkedEvents', 'name status startDate')
      .populate('linkedCampaigns', 'name status');

    res.json({ success: true, data: populated });
  } catch (error) {
    logger.error('Error fetching media kit', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST / - Creer un media kit
const create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
      organizationId: req.user.organizationId || null
    };

    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (typeof data.sections === 'string') data.sections = JSON.parse(data.sections);
    if (typeof data.keyFacts === 'string') data.keyFacts = JSON.parse(data.keyFacts);
    if (typeof data.spokespeople === 'string') data.spokespeople = JSON.parse(data.spokespeople);
    if (typeof data.branding === 'string') data.branding = JSON.parse(data.branding);
    if (typeof data.assets === 'string') data.assets = JSON.parse(data.assets);

    const kit = new MediaKit(data);
    await kit.save();

    const populated = await MediaKit.findById(kit._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Media kit cree avec succes'
    });
  } catch (error) {
    logger.error('Error creating media kit', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur creation media kit', error: error.message });
  }
};

// PUT /:id - Modifier un media kit
const update = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const updateData = { ...req.body, lastEditedBy: req.user.id };

    if (typeof updateData.tags === 'string') updateData.tags = JSON.parse(updateData.tags);
    if (typeof updateData.sections === 'string') updateData.sections = JSON.parse(updateData.sections);
    if (typeof updateData.keyFacts === 'string') updateData.keyFacts = JSON.parse(updateData.keyFacts);
    if (typeof updateData.spokespeople === 'string') updateData.spokespeople = JSON.parse(updateData.spokespeople);
    if (typeof updateData.branding === 'string') updateData.branding = JSON.parse(updateData.branding);
    if (typeof updateData.assets === 'string') updateData.assets = JSON.parse(updateData.assets);

    Object.assign(kit, updateData);
    await kit.save();

    const populated = await MediaKit.findById(kit._id)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');

    res.json({ success: true, data: populated, message: 'Media kit mis a jour' });
  } catch (error) {
    logger.error('Error updating media kit', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id - Archiver un media kit
const deleteMediaKit = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);
    kit.isArchived = true;
    await kit.save();
    res.json({ success: true, message: 'Media kit archive' });
  } catch (error) {
    logger.error('Error archiving media kit', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /:id/assets - Ajouter un asset
const addAsset = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const assetData = { ...req.body };
    if (typeof assetData.file === 'string') assetData.file = JSON.parse(assetData.file);
    if (typeof assetData.dimensions === 'string') assetData.dimensions = JSON.parse(assetData.dimensions);

    kit.addAsset(assetData);
    kit.lastEditedBy = req.user.id;
    kit.metrics.lastUpdated = new Date();
    await kit.save();

    res.status(201).json({ success: true, data: kit.assets, message: 'Asset ajoute' });
  } catch (error) {
    logger.error('Error adding asset', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id/assets/:assetId - Retirer un asset
const removeAsset = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);

    kit.removeAsset(req.params.assetId);
    kit.lastEditedBy = req.user.id;
    kit.metrics.lastUpdated = new Date();
    await kit.save();

    res.json({ success: true, message: 'Asset retire' });
  } catch (error) {
    logger.error('Error removing asset', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /:id/assets/:assetId/download - Tracker un telechargement
const trackDownload = async (req, res) => {
  try {
    const kit = await MediaKit.findById(req.params.id);
    if (!kit) return res.status(404).json({ success: false, message: 'Media kit non trouve' });

    kit.incrementDownload(req.params.assetId);
    await kit.save();

    res.json({ success: true, message: 'Telechargement enregistre' });
  } catch (error) {
    logger.error('Error tracking download', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /:id/public - Activer l'acces public
const enablePublicAccess = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const slug = kit.generatePublicSlug();

    if (req.body.password) {
      kit.publicAccess.password = req.body.password;
    }
    if (req.body.expiresAt) {
      kit.publicAccess.expiresAt = new Date(req.body.expiresAt);
    }

    await kit.save();

    res.json({
      success: true,
      data: {
        slug,
        url: `/media-kits/public/${slug}`,
        expiresAt: kit.publicAccess.expiresAt
      },
      message: 'Acces public active'
    });
  } catch (error) {
    logger.error('Error enabling public access', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id/public - Desactiver l'acces public
const disablePublicAccess = async (req, res) => {
  try {
    const kit = await verifyAccess(req.params.id, req.user.id, req.user.role);
    await kit.disablePublicAccess();

    res.json({ success: true, message: 'Acces public desactive' });
  } catch (error) {
    logger.error('Error disabling public access', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /stats - Statistiques des media kits
const getStats = async (req, res) => {
  try {
    const query = { isArchived: { $ne: true } };

    if (!isAdminRole(req.user.role)) {
      query.createdBy = req.user.id;
    } else if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    const [total, statusCounts, contextCounts, downloadStats] = await Promise.all([
      MediaKit.countDocuments(query),
      MediaKit.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      MediaKit.aggregate([
        { $match: query },
        { $group: { _id: '$context', count: { $sum: 1 } } }
      ]),
      MediaKit.aggregate([
        { $match: query },
        { $group: {
          _id: null,
          totalViews: { $sum: '$metrics.views' },
          totalDownloads: { $sum: '$metrics.totalDownloads' },
          totalAssets: { $sum: { $size: '$assets' } }
        }}
      ])
    ]);

    const byStatus = statusCounts.reduce((acc, i) => { acc[i._id] = i.count; return acc; }, {});
    const byContext = contextCounts.reduce((acc, i) => { acc[i._id] = i.count; return acc; }, {});

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        byContext,
        aggregated: downloadStats[0] || { totalViews: 0, totalDownloads: 0, totalAssets: 0 }
      }
    });
  } catch (error) {
    logger.error('Error fetching media kit stats', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur stats media kits', error: error.message });
  }
};

module.exports = {
  getAll,
  getPublic,
  getById,
  create,
  update,
  delete: deleteMediaKit,
  addAsset,
  removeAsset,
  trackDownload,
  enablePublicAccess,
  disablePublicAccess,
  getStats
};
