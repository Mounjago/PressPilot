/**
 * ROUTES CAMPAGNES EMAIL - API COMPLÈTE
 * Gestion complète des campagnes email avec envoi réel via Mailgun
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Campaign = require('../models/Campaign');
const EmailTracking = require('../models/EmailTracking');
const emailService = require('../services/emailService');
const { auth } = require('../middleware/auth');

const router = express.Router();

const { uuidv4 } = require('../utils/uuid');

/**
 * RATE LIMITING SPÉCIALISÉ
 */

// Limite stricte pour l'envoi d'emails
const emailSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50, // Max 50 campagnes par heure par IP
  message: {
    error: 'Limite d\'envoi d\'emails atteinte. Veuillez patienter.'
  }
});

// Limite pour les tests
const testEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 tests par 15 min
  message: {
    error: 'Limite de tests d\'emails atteinte.'
  }
});

/**
 * VALIDATORS
 */

const campaignValidators = [
  body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Nom requis (3-200 caractères)'),
  body('subject').trim().isLength({ min: 5, max: 300 }).withMessage('Sujet requis (5-300 caractères)'),
  body('content').trim().isLength({ min: 10 }).withMessage('Contenu requis (min 10 caractères)'),
  body('targetContacts').isArray({ min: 1 }).withMessage('Au moins un contact requis'),
  body('targetContacts.*.contactId').isMongoId().withMessage('ID contact invalide')
];

const sendCampaignValidators = [
  param('campaignId').isMongoId().withMessage('ID campagne invalide'),
  body('confirmSend').equals('true').withMessage('Confirmation d\'envoi requise')
];

const testEmailValidators = [
  body('to').isEmail().withMessage('Email destinataire requis'),
  body('subject').trim().isLength({ min: 1, max: 300 }).withMessage('Sujet requis'),
  body('htmlContent').trim().isLength({ min: 10 }).withMessage('Contenu HTML requis')
];

/**
 * ROUTES CAMPAGNES
 */

/**
 * GET /api/campaigns - Liste des campagnes
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      artistId,
      projectId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construire le filtre
    const filter = { createdBy: req.user.id };
    if (status) filter.status = status;
    if (artistId) filter.artistId = artistId;
    if (projectId) filter.projectId = projectId;

    // Options de pagination et tri
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'artistId', select: 'name' },
        { path: 'projectId', select: 'title type' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]
    };

    const campaigns = await Campaign.paginate(filter, options);

    res.json({
      success: true,
      data: campaigns.docs,
      pagination: {
        page: campaigns.page,
        limit: campaigns.limit,
        total: campaigns.totalDocs,
        pages: campaigns.totalPages,
        hasNext: campaigns.hasNextPage,
        hasPrev: campaigns.hasPrevPage
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération campagnes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des campagnes'
    });
  }
});

/**
 * GET /api/campaigns/:id - Détails d'une campagne
 */
router.get('/:id', auth, param('id').isMongoId(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    })
      .populate('artistId', 'name')
      .populate('projectId', 'title type')
      .populate('targetContacts.contactId', 'email firstName lastName')
      .populate('createdBy', 'firstName lastName email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne introuvable'
      });
    }

    res.json({
      success: true,
      data: campaign
    });

  } catch (error) {
    console.error('❌ Erreur récupération campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la campagne'
    });
  }
});

/**
 * POST /api/campaigns - Créer une nouvelle campagne
 */
router.post('/', auth, campaignValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      subject,
      content,
      htmlContent,
      targetContacts,
      artistId,
      projectId,
      scheduledAt,
      attachments = [],
      trackingEnabled = true
    } = req.body;

    // Générer un ID de tracking si activé
    const trackingPixelId = trackingEnabled ? uuidv4() : null;

    const campaign = new Campaign({
      name,
      description,
      subject,
      content,
      htmlContent,
      artistId,
      projectId,
      createdBy: req.user.id,
      targetContacts: targetContacts.map(contact => ({
        contactId: contact.contactId,
        status: 'pending'
      })),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      attachments,
      trackingEnabled,
      trackingPixelId,
      status: scheduledAt ? 'scheduled' : 'draft'
    });

    await campaign.save();

    // Populer les références pour la réponse
    await campaign.populate([
      { path: 'artistId', select: 'name' },
      { path: 'projectId', select: 'title type' },
      { path: 'targetContacts.contactId', select: 'email firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Campagne créée avec succès',
      data: campaign
    });

  } catch (error) {
    console.error('❌ Erreur création campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la campagne'
    });
  }
});

/**
 * PUT /api/campaigns/:id - Modifier une campagne
 */
router.put('/:id', auth, param('id').isMongoId(), campaignValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne introuvable'
      });
    }

    // Vérifier que la campagne peut être modifiée
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une campagne envoyée ou en cours d\'envoi'
      });
    }

    // Mettre à jour les champs
    const allowedFields = [
      'name', 'description', 'subject', 'content', 'htmlContent',
      'targetContacts', 'scheduledAt', 'attachments'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'targetContacts') {
          campaign[field] = req.body[field].map(contact => ({
            contactId: contact.contactId,
            status: 'pending'
          }));
        } else {
          campaign[field] = req.body[field];
        }
      }
    });

    campaign.updatedAt = new Date();
    await campaign.save();

    await campaign.populate([
      { path: 'artistId', select: 'name' },
      { path: 'projectId', select: 'title type' },
      { path: 'targetContacts.contactId', select: 'email firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Campagne mise à jour avec succès',
      data: campaign
    });

  } catch (error) {
    console.error('❌ Erreur modification campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la campagne'
    });
  }
});

/**
 * POST /api/campaigns/:id/send - ENVOYER UNE CAMPAGNE RÉELLEMENT
 */
router.post('/:id/send', auth, emailSendLimiter, sendCampaignValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('targetContacts.contactId', 'email firstName lastName');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne introuvable'
      });
    }

    // Vérifications de sécurité
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cette campagne a déjà été envoyée'
      });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Cette campagne est déjà en cours d\'envoi'
      });
    }

    if (!campaign.targetContacts || campaign.targetContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun contact ciblé pour cette campagne'
      });
    }

    // Vérifier que le service email est disponible
    try {
      await emailService.testConnection();
    } catch (testError) {
      return res.status(503).json({
        success: false,
        message: 'Service d\'envoi temporairement indisponible',
        error: testError.message
      });
    }

    // ENVOI RÉEL DE LA CAMPAGNE
    console.log(`🚀 Démarrage envoi campagne ${campaign._id} - ${campaign.targetContacts.length} destinataires`);

    const sendOptions = {
      batchSize: req.body.batchSize || 10,
      delayMs: req.body.delayMs || 100
    };

    const results = await emailService.sendCampaign(campaign._id, sendOptions);

    // Mettre à jour les métriques de la campagne
    await campaign.updateMetrics();

    res.json({
      success: true,
      message: 'Campagne envoyée avec succès',
      data: {
        campaignId: campaign._id,
        campaignName: campaign.name,
        totalTargets: results.results.total,
        successfulSends: results.results.sent,
        failedSends: results.results.failed,
        errors: results.results.errors,
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur envoi campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la campagne',
      error: error.message
    });
  }
});

/**
 * POST /api/campaigns/test-email - Envoyer un email de test
 */
router.post('/test-email', auth, testEmailLimiter, testEmailValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { to, subject, htmlContent, textContent } = req.body;

    // Vérifier que le service email est disponible
    try {
      await emailService.testConnection();
    } catch (testError) {
      return res.status(503).json({
        success: false,
        message: 'Service d\'envoi temporairement indisponible',
        error: testError.message
      });
    }

    // ENVOI RÉEL DE L'EMAIL DE TEST
    const result = await emailService.sendTestEmail({
      to,
      subject,
      htmlContent,
      textContent
    });

    res.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      data: {
        emailId: result.emailId,
        recipient: to,
        subject: `[TEST] ${subject}`,
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur envoi email de test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de test',
      error: error.message
    });
  }
});

/**
 * GET /api/campaigns/:id/stats - Statistiques détaillées d'une campagne
 */
router.get('/:id/stats', auth, param('id').isMongoId(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne introuvable'
      });
    }

    // Mettre à jour les métriques depuis la base de données
    await campaign.updateMetrics();

    // Récupérer les statistiques détaillées du tracking
    const emailStats = await EmailTracking.getCampaignMetrics(
      campaign._id,
      campaign.sentAt || new Date(0),
      new Date()
    );

    // Récupérer les événements récents
    const recentEvents = await EmailTracking.find({
      campaignId: campaign._id
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('contactId', 'email firstName lastName')
      .select('status openedAt clickedAt repliedAt contactId updatedAt');

    // Calculer les insights de performance
    const insights = campaign.getPerformanceInsights();

    // Calculer le ROI si applicable
    const roi = campaign.getROI();

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          sentAt: campaign.sentAt
        },
        metrics: {
          ...campaign.metrics.toObject(),
          ...emailStats
        },
        performance: {
          insights,
          roi,
          engagementScore: campaign.metrics.engagementScore
        },
        recentEvents,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * DELETE /api/campaigns/:id - Supprimer une campagne
 */
router.delete('/:id', auth, param('id').isMongoId(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne introuvable'
      });
    }

    // Empêcher la suppression de campagnes en cours d'envoi
    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une campagne en cours d\'envoi'
      });
    }

    // Soft delete: marquer comme archivée
    campaign.isArchived = true;
    await campaign.save();

    res.json({
      success: true,
      message: 'Campagne supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la campagne'
    });
  }
});

/**
 * GET /api/campaigns/service/status - Statut du service email
 */
router.get('/service/status', auth, async (req, res) => {
  try {
    const status = await emailService.testConnection();

    res.json({
      success: true,
      service: 'Mailgun',
      status: 'operational',
      ...status,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'Mailgun',
      status: 'error',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/campaigns/:id/exchanges - Récupérer tous les échanges d'une campagne
 */
router.get('/:id/exchanges', auth, [
  param('id').isMongoId().withMessage('ID campagne invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const campaignId = req.params.id;

    // Vérifier que la campagne existe et appartient à l'utilisateur
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campagne non trouvée'
      });
    }

    // Récupérer tous les échanges de cette campagne
    const exchanges = await EmailTracking.find({
      campaignId: campaignId
    })
    .populate('contactId', 'name email media type location')
    .sort({ sentAt: -1 })
    .lean();

    // Formater les données pour la modale
    const formattedExchanges = exchanges.map(exchange => ({
      _id: exchange._id,
      type: exchange.type || 'sent',
      status: exchange.status || 'sent',
      subject: exchange.subject || campaign.subject,
      to: exchange.to,
      from: exchange.from,
      sentAt: exchange.sentAt,
      receivedAt: exchange.receivedAt,
      contact: exchange.contactId ? {
        name: exchange.contactId.name,
        email: exchange.contactId.email,
        media: exchange.contactId.media,
        type: exchange.contactId.type,
        location: exchange.contactId.location
      } : null,
      tracking: {
        opened: exchange.opened || false,
        openedAt: exchange.openedAt,
        clicked: exchange.clicked || false,
        clickedAt: exchange.clickedAt,
        replied: exchange.replied || false,
        repliedAt: exchange.repliedAt
      },
      htmlContent: exchange.htmlContent,
      textContent: exchange.textContent,
      body: exchange.body,
      reply: exchange.reply ? {
        content: exchange.reply.content,
        receivedAt: exchange.reply.receivedAt
      } : null
    }));

    res.json({
      success: true,
      data: formattedExchanges,
      count: formattedExchanges.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération échanges campagne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des échanges'
    });
  }
});

module.exports = router;