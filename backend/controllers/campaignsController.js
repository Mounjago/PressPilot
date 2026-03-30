const Campaign = require('../models/Campaign');
const EmailTracking = require('../models/EmailTracking');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'campaigns');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow common attachment types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, Word, and Excel files are allowed.'));
    }
  }
});

// Middleware for handling multipart/form-data
const uploadMiddleware = upload.array('attachments', 10);

// Helper function to verify campaign ownership
const verifyCampaignOwnership = async (campaignId, userId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  if (campaign.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to this campaign');
  }
  return campaign;
};

// Get all campaigns for the authenticated user
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isArchived = false
    } = req.query;

    const query = {
      createdBy: req.user.id,
      isArchived: isArchived === 'true'
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('projectId', 'name')
        .populate('artistId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching campaigns', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
};

// Get campaign by ID
const getById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    })
      .populate('targetContacts', 'email name organization tags')
      .populate('projectId', 'name description')
      .populate('artistId', 'name bio')
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error('Error fetching campaign', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message
    });
  }
};

// Create new campaign
const create = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload failed',
        error: err.message
      });
    }

    try {
      const campaignData = {
        ...req.body,
        createdBy: req.user.id,
        attachments: []
      };

      // Parse JSON fields if they come as strings
      if (typeof req.body.targetContacts === 'string') {
        campaignData.targetContacts = JSON.parse(req.body.targetContacts);
      }
      if (typeof req.body.tags === 'string') {
        campaignData.tags = JSON.parse(req.body.tags);
      }
      if (typeof req.body.abTesting === 'string') {
        campaignData.abTesting = JSON.parse(req.body.abTesting);
      }

      // Handle file attachments
      if (req.files && req.files.length > 0) {
        campaignData.attachments = req.files.map(file => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
      }

      const campaign = new Campaign(campaignData);
      await campaign.save();

      const populatedCampaign = await Campaign.findById(campaign._id)
        .populate('projectId', 'name')
        .populate('artistId', 'name')
        .populate('targetContacts', 'email name');

      res.status(201).json({
        success: true,
        data: populatedCampaign,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      logger.error('Error creating campaign', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error.message
      });
    }
  });
};

// Update campaign
const update = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload failed',
        error: err.message
      });
    }

    try {
      const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

      const updateData = { ...req.body };

      // Parse JSON fields if they come as strings
      if (typeof req.body.targetContacts === 'string') {
        updateData.targetContacts = JSON.parse(req.body.targetContacts);
      }
      if (typeof req.body.tags === 'string') {
        updateData.tags = JSON.parse(req.body.tags);
      }
      if (typeof req.body.abTesting === 'string') {
        updateData.abTesting = JSON.parse(req.body.abTesting);
      }

      // Handle file attachments (append to existing)
      if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map(file => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
        updateData.attachments = [...(campaign.attachments || []), ...newAttachments];
      }

      // Update campaign
      Object.assign(campaign, updateData);
      await campaign.save();

      const updatedCampaign = await Campaign.findById(campaign._id)
        .populate('projectId', 'name')
        .populate('artistId', 'name')
        .populate('targetContacts', 'email name');

      res.json({
        success: true,
        data: updatedCampaign,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      logger.error('Error updating campaign', { error: error.message, stack: error.stack });
      res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update campaign'
      });
    }
  });
};

// Soft delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    campaign.isArchived = true;
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign archived successfully'
    });
  } catch (error) {
    logger.error('Error deleting campaign', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to delete campaign'
    });
  }
};

// Get aggregated campaign statistics
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { createdBy: req.user.id, isArchived: false };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [
      totalCampaigns,
      statusCounts,
      averageMetrics,
      recentCampaigns
    ] = await Promise.all([
      Campaign.countDocuments(query),
      Campaign.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Campaign.aggregate([
        { $match: { ...query, status: 'sent' } },
        {
          $group: {
            _id: null,
            avgOpenRate: { $avg: '$openRate' },
            avgClickRate: { $avg: '$clickRate' },
            avgResponseRate: { $avg: '$responseRate' },
            avgBounceRate: { $avg: '$bounceRate' },
            avgEngagementScore: { $avg: '$engagementScore' },
            totalSent: { $sum: '$totalSent' },
            totalDelivered: { $sum: '$totalDelivered' },
            totalOpened: { $sum: '$totalOpened' },
            totalClicked: { $sum: '$totalClicked' }
          }
        }
      ]),
      Campaign.find(query)
        .sort('-createdAt')
        .limit(5)
        .select('name status openRate clickRate engagementScore createdAt')
        .lean()
    ]);

    // Format status counts
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalCampaigns,
        byStatus: {
          draft: statusMap.draft || 0,
          scheduled: statusMap.scheduled || 0,
          sending: statusMap.sending || 0,
          sent: statusMap.sent || 0,
          paused: statusMap.paused || 0,
          cancelled: statusMap.cancelled || 0
        },
        averageMetrics: averageMetrics[0] || {
          avgOpenRate: 0,
          avgClickRate: 0,
          avgResponseRate: 0,
          avgBounceRate: 0,
          avgEngagementScore: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0
        },
        recentCampaigns
      }
    });
  } catch (error) {
    logger.error('Error fetching campaign stats', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign statistics',
      error: error.message
    });
  }
};

// Get top performing campaigns
const getTopPerforming = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const campaigns = await Campaign.getPerformanceLeaderboard(req.user.id, limit);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    logger.error('Error fetching top performing campaigns', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performing campaigns',
      error: error.message
    });
  }
};

// Send campaign
const send = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: `Cannot send campaign with status: ${campaign.status}`
      });
    }

    if (!campaign.targetContacts || campaign.targetContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients selected for this campaign'
      });
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await campaign.save();

    // TODO: Implement actual email sending with Mailgun integration
    // This is a placeholder for the actual email sending logic
    // Will be implemented when Mailgun integration is added

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign is being sent'
    });
  } catch (error) {
    logger.error('Error sending campaign', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to send campaign'
    });
  }
};

// Pause campaign
const pause = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    if (campaign.status !== 'sending' && campaign.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot pause campaign with status: ${campaign.status}`
      });
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign paused successfully'
    });
  } catch (error) {
    logger.error('Error pausing campaign', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to pause campaign'
    });
  }
};

// Duplicate campaign
const duplicate = async (req, res) => {
  try {
    const originalCampaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    // Create a copy of the campaign
    const duplicatedData = originalCampaign.toObject();
    delete duplicatedData._id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    delete duplicatedData.__v;

    // Reset campaign-specific fields
    duplicatedData.name = `${duplicatedData.name} (Copy)`;
    duplicatedData.status = 'draft';
    duplicatedData.sentAt = null;
    duplicatedData.scheduledAt = null;
    duplicatedData.totalSent = 0;
    duplicatedData.totalDelivered = 0;
    duplicatedData.totalOpened = 0;
    duplicatedData.totalClicked = 0;
    duplicatedData.totalReplied = 0;
    duplicatedData.totalBounced = 0;
    duplicatedData.totalUnsubscribed = 0;
    duplicatedData.deliveryRate = 0;
    duplicatedData.openRate = 0;
    duplicatedData.clickRate = 0;
    duplicatedData.responseRate = 0;
    duplicatedData.bounceRate = 0;
    duplicatedData.engagementScore = 0;

    const duplicatedCampaign = new Campaign(duplicatedData);
    await duplicatedCampaign.save();

    const populatedCampaign = await Campaign.findById(duplicatedCampaign._id)
      .populate('projectId', 'name')
      .populate('artistId', 'name')
      .populate('targetContacts', 'email name');

    res.status(201).json({
      success: true,
      data: populatedCampaign,
      message: 'Campaign duplicated successfully'
    });
  } catch (error) {
    logger.error('Error duplicating campaign', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to duplicate campaign'
    });
  }
};

// Add recipients to campaign
const addRecipients = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid contact IDs'
      });
    }

    // Add unique contacts only
    const existingContacts = campaign.targetContacts.map(c => c.toString());
    const newContacts = contactIds.filter(id => !existingContacts.includes(id));

    campaign.targetContacts.push(...newContacts);
    await campaign.save();

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate('targetContacts', 'email name organization');

    res.json({
      success: true,
      data: updatedCampaign,
      message: `Added ${newContacts.length} new recipients`
    });
  } catch (error) {
    logger.error('Error adding recipients', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to add recipients'
    });
  }
};

// Remove recipient from campaign
const removeRecipient = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);
    const { contactId } = req.params;

    campaign.targetContacts = campaign.targetContacts.filter(
      c => c.toString() !== contactId
    );
    await campaign.save();

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate('targetContacts', 'email name organization');

    res.json({
      success: true,
      data: updatedCampaign,
      message: 'Recipient removed successfully'
    });
  } catch (error) {
    logger.error('Error removing recipient', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to remove recipient'
    });
  }
};

// Get campaign analytics
const getAnalytics = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    // Get email tracking data for this campaign
    const emailTrackingData = await EmailTracking.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: null,
          totalOpens: {
            $sum: {
              $cond: [{ $gt: ['$openedAt', null] }, 1, 0]
            }
          },
          totalClicks: {
            $sum: {
              $cond: [{ $gt: ['$clickedAt', null] }, 1, 0]
            }
          },
          totalReplies: {
            $sum: {
              $cond: [{ $gt: ['$repliedAt', null] }, 1, 0]
            }
          },
          totalBounces: {
            $sum: {
              $cond: [{ $gt: ['$bouncedAt', null] }, 1, 0]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $gt: ['$repliedAt', null] },
                {
                  $divide: [
                    { $subtract: ['$repliedAt', '$sentAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                },
                null
              ]
            }
          },
          clicksByLink: { $push: '$clickedLinks' }
        }
      }
    ]);

    // Calculate temporal metrics
    const temporalMetrics = await EmailTracking.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$openedAt'
            }
          },
          opens: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get device and client statistics
    const deviceStats = await EmailTracking.aggregate([
      { $match: { campaignId: campaign._id, openedAt: { $ne: null } } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const analytics = {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt,
        totalRecipients: campaign.targetContacts.length
      },
      metrics: {
        totalSent: campaign.totalSent,
        totalDelivered: campaign.totalDelivered,
        totalOpened: campaign.totalOpened,
        totalClicked: campaign.totalClicked,
        totalReplied: campaign.totalReplied,
        totalBounced: campaign.totalBounced,
        totalUnsubscribed: campaign.totalUnsubscribed,
        deliveryRate: campaign.deliveryRate,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        responseRate: campaign.responseRate,
        bounceRate: campaign.bounceRate,
        engagementScore: campaign.engagementScore
      },
      tracking: emailTrackingData[0] || {
        totalOpens: 0,
        totalClicks: 0,
        totalReplies: 0,
        totalBounces: 0,
        avgResponseTime: 0
      },
      temporal: temporalMetrics,
      devices: deviceStats,
      performance: {
        vsTargetOpenRate: campaign.targetOpenRate ?
          ((campaign.openRate / campaign.targetOpenRate) * 100).toFixed(2) : null,
        vsTargetClickRate: campaign.targetClickRate ?
          ((campaign.clickRate / campaign.targetClickRate) * 100).toFixed(2) : null,
        vsTargetResponseRate: campaign.targetResponseRate ?
          ((campaign.responseRate / campaign.targetResponseRate) * 100).toFixed(2) : null
      },
      insights: campaign.getPerformanceInsights ? await campaign.getPerformanceInsights() : null
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error fetching campaign analytics', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch campaign analytics'
    });
  }
};

// Get campaign email exchanges
const getExchanges = async (req, res) => {
  try {
    const campaign = await verifyCampaignOwnership(req.params.id, req.user.id);

    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'sentAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { campaignId: campaign._id };

    // Filter by status if provided
    if (status) {
      switch (status) {
        case 'opened':
          query.openedAt = { $ne: null };
          break;
        case 'clicked':
          query.clickedAt = { $ne: null };
          break;
        case 'replied':
          query.repliedAt = { $ne: null };
          break;
        case 'bounced':
          query.bouncedAt = { $ne: null };
          break;
        case 'unsubscribed':
          query.unsubscribedAt = { $ne: null };
          break;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [exchanges, total] = await Promise.all([
      EmailTracking.find(query)
        .populate('contactId', 'email name organization')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailTracking.countDocuments(query)
    ]);

    // Format exchange data
    const formattedExchanges = exchanges.map(exchange => ({
      id: exchange._id,
      contact: exchange.contactId,
      email: exchange.email,
      status: exchange.status,
      sentAt: exchange.sentAt,
      deliveredAt: exchange.deliveredAt,
      openedAt: exchange.openedAt,
      clickedAt: exchange.clickedAt,
      repliedAt: exchange.repliedAt,
      bouncedAt: exchange.bouncedAt,
      unsubscribedAt: exchange.unsubscribedAt,
      openCount: exchange.openCount || 0,
      clickCount: exchange.clickCount || 0,
      clickedLinks: exchange.clickedLinks || [],
      deviceType: exchange.deviceType,
      emailClient: exchange.emailClient,
      ipAddress: exchange.ipAddress,
      location: exchange.location,
      conversationThread: exchange.conversationThread || []
    }));

    res.json({
      success: true,
      data: {
        exchanges: formattedExchanges,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching campaign exchanges', { error: error.message, stack: error.stack });
    res.status(error.message === 'Unauthorized access to this campaign' ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch campaign exchanges'
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteCampaign,
  getStats,
  getTopPerforming,
  send,
  pause,
  duplicate,
  addRecipients,
  removeRecipient,
  getAnalytics,
  getExchanges,
  attachmentUpload: upload
};