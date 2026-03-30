/**
 * CONTROLLER PRESS RELEASES - Communiques de presse
 * CRUD + workflow d'approbation + distribution
 * Interface: BandStream RP (rp)
 */

const PressRelease = require('../models/PressRelease');
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
  const pr = await PressRelease.findById(id);
  if (!pr) {
    const err = new Error('Communique de presse non trouve');
    err.status = 404;
    throw err;
  }
  if (!isAdminRole(role) && pr.createdBy.toString() !== userId.toString()) {
    const err = new Error('Acces refuse a ce communique');
    err.status = 403;
    throw err;
  }
  return pr;
};

// GET / - Liste des communiques
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = { isArchived: { $ne: true } };

    // Scope par utilisateur (sauf admin)
    if (!isAdminRole(req.user.role)) {
      query.createdBy = req.user.id;
    } else if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [pressReleases, total] = await Promise.all([
      PressRelease.find(query)
        .populate('createdBy', 'name email')
        .populate('lastEditedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PressRelease.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        pressReleases,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching press releases', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la recuperation des communiques', error: error.message });
  }
};

// GET /:id - Detail d'un communique
const getById = async (req, res) => {
  try {
    const pr = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const populated = await PressRelease.findById(pr._id)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email')
      .populate('approval.approvedBy', 'name email')
      .populate('approval.rejectedBy', 'name email')
      .populate('linkedCampaigns', 'name status');

    res.json({ success: true, data: populated });
  } catch (error) {
    logger.error('Error fetching press release', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST / - Creer un communique
const create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
      organizationId: req.user.organizationId || null
    };

    // Parse les champs JSON si envoyes en string
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (typeof data.contentBlocks === 'string') data.contentBlocks = JSON.parse(data.contentBlocks);
    if (typeof data.distribution === 'string') data.distribution = JSON.parse(data.distribution);
    if (typeof data.pressContact === 'string') data.pressContact = JSON.parse(data.pressContact);
    if (typeof data.seo === 'string') data.seo = JSON.parse(data.seo);

    const pr = new PressRelease(data);
    pr.statusHistory.push({ status: 'draft', changedBy: req.user.id });
    await pr.save();

    const populated = await PressRelease.findById(pr._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Communique de presse cree avec succes'
    });
  } catch (error) {
    logger.error('Error creating press release', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la creation', error: error.message });
  }
};

// PUT /:id - Modifier un communique
const update = async (req, res) => {
  try {
    const pr = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const updateData = { ...req.body, lastEditedBy: req.user.id };

    if (typeof updateData.tags === 'string') updateData.tags = JSON.parse(updateData.tags);
    if (typeof updateData.contentBlocks === 'string') updateData.contentBlocks = JSON.parse(updateData.contentBlocks);
    if (typeof updateData.distribution === 'string') updateData.distribution = JSON.parse(updateData.distribution);
    if (typeof updateData.pressContact === 'string') updateData.pressContact = JSON.parse(updateData.pressContact);
    if (typeof updateData.seo === 'string') updateData.seo = JSON.parse(updateData.seo);

    Object.assign(pr, updateData);
    await pr.save();

    const populated = await PressRelease.findById(pr._id)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');

    res.json({ success: true, data: populated, message: 'Communique mis a jour' });
  } catch (error) {
    logger.error('Error updating press release', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id - Archiver un communique
const deletePressRelease = async (req, res) => {
  try {
    const pr = await verifyAccess(req.params.id, req.user.id, req.user.role);
    pr.isArchived = true;
    await pr.save();
    res.json({ success: true, message: 'Communique archive avec succes' });
  } catch (error) {
    logger.error('Error archiving press release', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /:id/submit - Soumettre pour relecture
const submitForReview = async (req, res) => {
  try {
    const pr = await verifyAccess(req.params.id, req.user.id, req.user.role);
    await pr.submitForReview(req.user.id);

    res.json({ success: true, data: pr, message: 'Communique soumis pour relecture' });
  } catch (error) {
    logger.error('Error submitting for review', { error: error.message });
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// POST /:id/approve - Approuver
const approve = async (req, res) => {
  try {
    const pr = await PressRelease.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Communique non trouve' });

    await pr.approve(req.user.id);

    res.json({ success: true, data: pr, message: 'Communique approuve' });
  } catch (error) {
    logger.error('Error approving press release', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /:id/reject - Rejeter
const reject = async (req, res) => {
  try {
    const pr = await PressRelease.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Communique non trouve' });

    const { reason } = req.body;
    await pr.reject(req.user.id, reason || 'Aucune raison specifiee');

    res.json({ success: true, data: pr, message: 'Communique rejete' });
  } catch (error) {
    logger.error('Error rejecting press release', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /:id/publish - Publier
const publish = async (req, res) => {
  try {
    const pr = await PressRelease.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Communique non trouve' });

    await pr.publish(req.user.id);

    res.json({ success: true, data: pr, message: 'Communique publie' });
  } catch (error) {
    logger.error('Error publishing press release', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /:id/duplicate - Dupliquer un communique
const duplicate = async (req, res) => {
  try {
    const original = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const duplicatedData = original.toObject();
    delete duplicatedData._id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    delete duplicatedData.__v;

    duplicatedData.title = `${duplicatedData.title} (Copie)`;
    duplicatedData.status = 'draft';
    duplicatedData.statusHistory = [{ status: 'draft', changedBy: req.user.id }];
    duplicatedData.approval = {};
    duplicatedData.metrics = { views: 0, downloads: 0, shares: 0, mediaPickups: 0 };
    duplicatedData.distribution = { ...duplicatedData.distribution, distributedAt: null };
    duplicatedData.createdBy = req.user.id;
    duplicatedData.lastEditedBy = req.user.id;

    const duplicated = new PressRelease(duplicatedData);
    await duplicated.save();

    const populated = await PressRelease.findById(duplicated._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Communique duplique' });
  } catch (error) {
    logger.error('Error duplicating press release', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /stats - Statistiques des communiques
const getStats = async (req, res) => {
  try {
    const query = { isArchived: { $ne: true } };

    if (!isAdminRole(req.user.role)) {
      query.createdBy = req.user.id;
    } else if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    const [total, statusCounts, categoryCounts, recent] = await Promise.all([
      PressRelease.countDocuments(query),
      PressRelease.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      PressRelease.aggregate([
        { $match: query },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      PressRelease.find(query)
        .sort('-createdAt')
        .limit(5)
        .select('title status category createdAt')
        .lean()
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const byCategory = categoryCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: { total, byStatus, byCategory, recent }
    });
  } catch (error) {
    logger.error('Error fetching press release stats', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la recuperation des stats', error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deletePressRelease,
  submitForReview,
  approve,
  reject,
  publish,
  duplicate,
  getStats
};
