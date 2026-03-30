/**
 * CONTROLLER EVENTS - Evenements et invitations
 * CRUD + gestion invites + RSVP + check-in
 * Interface: BandStream RP (rp)
 */

const Event = require('../models/Event');
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
  const event = await Event.findById(id);
  if (!event) {
    const err = new Error('Evenement non trouve');
    err.status = 404;
    throw err;
  }
  if (!isAdminRole(role) && event.createdBy.toString() !== userId.toString()) {
    const err = new Error('Acces refuse a cet evenement');
    err.status = 403;
    throw err;
  }
  return event;
};

// GET / - Liste des evenements
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      upcoming,
      sortBy = 'startDate',
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
    if (type && type !== 'all') query.type = type;

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
      query.status = { $nin: ['cancelled', 'postponed', 'completed'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('createdBy', 'name email')
        .populate('linkedPressReleases', 'title status')
        .populate('mediaKit', 'name status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching events', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la recuperation des evenements', error: error.message });
  }
};

// GET /:id - Detail d'un evenement
const getById = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('invitedContacts.contactId', 'name email organization type')
      .populate('linkedPressReleases', 'title status category')
      .populate('mediaKit', 'name status context');

    res.json({ success: true, data: populated });
  } catch (error) {
    logger.error('Error fetching event', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST / - Creer un evenement
const create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user.id,
      organizationId: req.user.organizationId || null
    };

    // Parse les champs JSON si envoyes en string
    if (typeof data.location === 'string') data.location = JSON.parse(data.location);
    if (typeof data.agenda === 'string') data.agenda = JSON.parse(data.agenda);
    if (typeof data.invitation === 'string') data.invitation = JSON.parse(data.invitation);
    if (typeof data.budget === 'string') data.budget = JSON.parse(data.budget);
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (typeof data.capacity === 'string') data.capacity = JSON.parse(data.capacity);

    const event = new Event(data);
    await event.save();

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Evenement cree avec succes'
    });
  } catch (error) {
    logger.error('Error creating event', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur lors de la creation', error: error.message });
  }
};

// PUT /:id - Modifier un evenement
const update = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);

    const updateData = { ...req.body };

    if (typeof updateData.location === 'string') updateData.location = JSON.parse(updateData.location);
    if (typeof updateData.agenda === 'string') updateData.agenda = JSON.parse(updateData.agenda);
    if (typeof updateData.invitation === 'string') updateData.invitation = JSON.parse(updateData.invitation);
    if (typeof updateData.budget === 'string') updateData.budget = JSON.parse(updateData.budget);
    if (typeof updateData.tags === 'string') updateData.tags = JSON.parse(updateData.tags);
    if (typeof updateData.capacity === 'string') updateData.capacity = JSON.parse(updateData.capacity);

    Object.assign(event, updateData);
    await event.save();

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('invitedContacts.contactId', 'name email organization');

    res.json({ success: true, data: populated, message: 'Evenement mis a jour' });
  } catch (error) {
    logger.error('Error updating event', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id - Archiver un evenement
const deleteEvent = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    event.isArchived = true;
    await event.save();
    res.json({ success: true, message: 'Evenement archive' });
  } catch (error) {
    logger.error('Error archiving event', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /:id/invite - Ajouter des invites
const addInvitees = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ success: false, message: 'contactIds requis (tableau)' });
    }

    let added = 0;
    const errors = [];

    for (const contactId of contactIds) {
      try {
        event.addInvitee(contactId);
        added++;
      } catch (err) {
        errors.push({ contactId, message: err.message });
      }
    }

    await event.save();

    res.json({
      success: true,
      data: { added, errors },
      message: `${added} invite(s) ajoute(s)`
    });
  } catch (error) {
    logger.error('Error adding invitees', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /:id/invite/:contactId - Retirer un invite
const removeInvitee = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    const { contactId } = req.params;

    event.invitedContacts = event.invitedContacts.filter(
      c => c.contactId.toString() !== contactId
    );
    event.updateMetrics();
    await event.save();

    res.json({ success: true, message: 'Invite retire' });
  } catch (error) {
    logger.error('Error removing invitee', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// PUT /:id/rsvp/:contactId - Mettre a jour le RSVP
const updateRSVP = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    const { contactId } = req.params;
    const { rsvpStatus, comment } = req.body;

    event.updateRSVP(contactId, rsvpStatus, comment);
    await event.save();

    res.json({ success: true, data: event.metrics, message: 'RSVP mis a jour' });
  } catch (error) {
    logger.error('Error updating RSVP', { error: error.message });
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// POST /:id/checkin/:contactId - Check-in d'un invite
const checkIn = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    const { contactId } = req.params;

    event.checkIn(contactId);
    await event.save();

    res.json({ success: true, data: event.metrics, message: 'Check-in effectue' });
  } catch (error) {
    logger.error('Error checking in', { error: error.message });
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// PATCH /:id/status - Changer le statut
const updateStatus = async (req, res) => {
  try {
    const event = await verifyAccess(req.params.id, req.user.id, req.user.role);
    const { status } = req.body;

    const validStatuses = ['planning', 'confirmed', 'invitations_sent', 'ongoing', 'completed', 'cancelled', 'postponed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Statut invalide. Valeurs acceptees: ${validStatuses.join(', ')}` });
    }

    event.status = status;
    await event.save();

    res.json({ success: true, data: event, message: `Statut mis a jour: ${status}` });
  } catch (error) {
    logger.error('Error updating event status', { error: error.message });
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /stats - Statistiques des evenements
const getStats = async (req, res) => {
  try {
    const query = { isArchived: { $ne: true } };

    if (!isAdminRole(req.user.role)) {
      query.createdBy = req.user.id;
    } else if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    const now = new Date();

    const [total, upcoming, statusCounts, typeCounts] = await Promise.all([
      Event.countDocuments(query),
      Event.countDocuments({ ...query, startDate: { $gte: now }, status: { $nin: ['cancelled', 'postponed'] } }),
      Event.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Event.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const byType = typeCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: { total, upcoming, byStatus, byType }
    });
  } catch (error) {
    logger.error('Error fetching event stats', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur stats evenements', error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteEvent,
  addInvitees,
  removeInvitee,
  updateRSVP,
  checkIn,
  updateStatus,
  getStats
};
