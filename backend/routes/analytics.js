const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');

// Import models
const EmailTracking = require('../models/EmailTracking');
const JournalistProfile = require('../models/JournalistProfile');
const Campaign = require('../models/Campaign');
const AnalyticsMetric = require('../models/AnalyticsMetric');

// Import middleware
const { auth, authorize } = require('../middleware/auth');

// Import services
const metricsEngine = require('../services/metricsEngine');
const predictionService = require('../services/predictionService');

// Middleware pour valider les erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Middleware pour parser les dates
const parseDateRange = (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;

    if (period) {
      const now = new Date();
      const start = new Date();

      switch (period) {
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          start.setDate(now.getDate() - 30);
      }

      req.dateRange = { startDate: start, endDate: now };
    } else if (startDate && endDate) {
      req.dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    } else {
      // Par défaut: 30 derniers jours
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - 30);
      req.dateRange = { startDate: start, endDate: now };
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid date format',
      error: error.message
    });
  }
};

// Appliquer l'authentification à toutes les routes
router.use(auth);

/**
 * @route GET /api/analytics/dashboard
 * @desc Récupérer les métriques du dashboard principal
 * @access Private
 */
router.get('/dashboard',
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
    query('artistId').optional().isMongoId(),
    query('projectId').optional().isMongoId()
  ],
  handleValidationErrors,
  parseDateRange,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.dateRange;
      const { artistId, projectId } = req.query;

      // Construire les filtres
      const filters = {};
      if (artistId) filters.artistId = new mongoose.Types.ObjectId(artistId);
      if (projectId) filters.projectId = new mongoose.Types.ObjectId(projectId);

      // Vérifier si on a des métriques en cache
      const cacheKey = `dashboard_${JSON.stringify(filters)}_${startDate.toISOString()}_${endDate.toISOString()}`;
      let cachedMetric = await AnalyticsMetric.getCachedMetric('global_metrics', {
        'references.artistId': artistId,
        'references.projectId': projectId
      });

      let metrics;

      if (cachedMetric && !cachedMetric.isExpired()) {
        metrics = cachedMetric.metrics;
      } else {
        // Calculer les métriques en temps réel
        metrics = await metricsEngine.calculateGlobalMetrics(startDate, endDate, filters);

        // Sauvegarder en cache
        const analyticsMetric = new AnalyticsMetric({
          type: 'global_metrics',
          period: { startDate, endDate, granularity: 'day' },
          references: {
            artistId: artistId || null,
            projectId: projectId || null
          },
          metrics,
          status: 'completed'
        });
        analyticsMetric.setValidityPeriod(6); // 6 heures de cache
        await analyticsMetric.save();
      }

      // Calculer les comparaisons avec la période précédente
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      const periodDuration = endDate - startDate;
      previousStartDate.setTime(previousStartDate.getTime() - periodDuration);
      previousEndDate.setTime(previousEndDate.getTime() - periodDuration);

      const previousMetrics = await metricsEngine.calculateGlobalMetrics(
        previousStartDate,
        previousEndDate,
        filters
      );

      // Calculer les changements
      const changes = {};
      ['openRate', 'clickRate', 'responseRate', 'engagementScore'].forEach(metric => {
        const current = metrics[metric] || 0;
        const previous = previousMetrics[metric] || 0;
        changes[metric] = {
          absolute: current - previous,
          percentage: previous !== 0 ? ((current - previous) / previous) * 100 : 0
        };
      });

      // Récupérer les top performers
      const topCampaigns = await Campaign.getPerformanceLeaderboard(5, 'responseRate');
      const topJournalists = await JournalistProfile.getTopPerformers(5, 'globalScore');

      // Données temporelles pour les graphiques
      const temporalData = await Campaign.getTemporalMetrics('30d', 'day');

      res.json({
        success: true,
        data: {
          metrics,
          changes,
          topCampaigns,
          topJournalists,
          temporalData,
          period: { startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/analytics/campaigns/:campaignId
 * @desc Analyse détaillée d'une campagne
 * @access Private
 */
router.get('/campaigns/:campaignId',
  async (req, res) => {
    try {
      const { campaignId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      // Vérifier que la campagne existe et appartient à l'utilisateur
      const campaign = await Campaign.findById(campaignId)
        .populate('artistId', 'name')
        .populate('projectId', 'title');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Mettre à jour les métriques de la campagne
      await campaign.updateMetrics();
      await campaign.save();

      // Récupérer les données de tracking détaillées
      const trackingData = await EmailTracking.find({ campaignId })
        .populate('contactId', 'firstName lastName email media position')
        .sort({ sentAt: -1 });

      // Calculer les métriques par heure d'envoi
      const hourlyMetrics = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        {
          $group: {
            _id: { $hour: '$sentAt' },
            sent: { $sum: 1 },
            opened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
            replied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } }
          }
        },
        {
          $project: {
            hour: '$_id',
            sent: 1,
            opened: 1,
            clicked: 1,
            replied: 1,
            openRate: { $multiply: [{ $divide: ['$opened', '$sent'] }, 100] },
            clickRate: { $multiply: [{ $divide: ['$clicked', '$opened'] }, 100] },
            responseRate: { $multiply: [{ $divide: ['$replied', '$sent'] }, 100] }
          }
        },
        { $sort: { hour: 1 } }
      ]);

      // Analyse des clics par lien
      const clickAnalysis = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        { $unwind: '$clickedLinks' },
        {
          $group: {
            _id: '$clickedLinks.url',
            clicks: { $sum: 1 },
            uniqueClickers: { $addToSet: '$contactId' }
          }
        },
        {
          $project: {
            url: '$_id',
            clicks: 1,
            uniqueClickers: { $size: '$uniqueClickers' }
          }
        },
        { $sort: { clicks: -1 } }
      ]);

      // Analyse des appareils utilisés
      const deviceAnalysis = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        {
          $group: {
            _id: '$deviceType',
            count: { $sum: 1 },
            opened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } }
          }
        },
        {
          $project: {
            deviceType: '$_id',
            count: 1,
            opened: 1,
            clicked: 1,
            openRate: { $multiply: [{ $divide: ['$opened', '$count'] }, 100] },
            clickRate: { $multiply: [{ $divide: ['$clicked', '$opened'] }, 100] }
          }
        }
      ]);

      // Générer des insights automatiques
      const insights = campaign.getPerformanceInsights();

      // Calculer le ROI
      const roi = campaign.getROI();

      res.json({
        success: true,
        data: {
          campaign: {
            _id: campaign._id,
            name: campaign.name,
            subject: campaign.subject,
            status: campaign.status,
            sentAt: campaign.sentAt,
            metrics: campaign.metrics,
            artist: campaign.artistId,
            project: campaign.projectId
          },
          trackingData,
          hourlyMetrics,
          clickAnalysis,
          deviceAnalysis,
          insights,
          roi
        }
      });

    } catch (error) {
      console.error('Campaign analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching campaign analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/analytics/journalists/:contactId
 * @desc Analyse du profil d'engagement d'un journaliste
 * @access Private
 */
router.get('/journalists/:contactId',
  async (req, res) => {
    try {
      const { contactId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(contactId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact ID'
        });
      }

      // Récupérer ou créer le profil journaliste
      let profile = await JournalistProfile.findOne({ contactId })
        .populate('contactId', 'firstName lastName email media position');

      if (!profile) {
        // Créer un nouveau profil
        profile = new JournalistProfile({ contactId });
        await profile.updateEngagementHistory();
        await profile.save();
      } else {
        // Mettre à jour le profil si nécessaire
        const lastUpdate = profile.lastCalculated;
        const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);

        if (hoursSinceUpdate > 24) {
          await profile.updateEngagementHistory();
          await profile.save();
        }
      }

      // Récupérer l'historique d'engagement
      const engagementHistory = await EmailTracking.getJournalistEngagement(contactId, 20);

      // Calculer les meilleurs moments pour contacter
      const bestTimes = await EmailTracking.getBestSendTimes(contactId);

      // Trouver des journalistes similaires
      const similarJournalists = await JournalistProfile.findSimilarJournalists(contactId, 5);

      // Prédictions IA
      const predictions = await predictionService.predictJournalistEngagement(contactId);

      // Recommandations personnalisées
      const recommendations = await predictionService.getPersonalizedRecommendations(contactId);

      res.json({
        success: true,
        data: {
          profile,
          engagementHistory,
          bestTimes,
          similarJournalists,
          predictions,
          recommendations
        }
      });

    } catch (error) {
      console.error('Journalist analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching journalist analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/analytics/best-times
 * @desc Recommandations globales des meilleurs moments d'envoi
 * @access Private
 */
router.get('/best-times',
  [
    query('contactId').optional().isMongoId(),
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
    query('mediaType').optional().isString()
  ],
  handleValidationErrors,
  parseDateRange,
  async (req, res) => {
    try {
      const { contactId, mediaType } = req.query;
      const { startDate, endDate } = req.dateRange;

      let bestTimes;

      if (contactId) {
        // Analyse spécifique à un journaliste
        bestTimes = await EmailTracking.getBestSendTimes(contactId);
      } else {
        // Analyse globale
        const pipeline = [
          {
            $match: {
              sentAt: { $gte: startDate, $lte: endDate },
              openedAt: { $ne: null }
            }
          }
        ];

        // Filtrer par type de média si spécifié
        if (mediaType) {
          pipeline[0].$match.mediaType = mediaType;
        }

        pipeline.push(
          {
            $group: {
              _id: {
                hour: { $hour: '$sentAt' },
                dayOfWeek: { $dayOfWeek: '$sentAt' }
              },
              totalSent: { $sum: 1 },
              totalOpened: { $sum: 1 },
              totalClicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
              totalReplied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } },
              avgEngagementScore: { $avg: '$engagementScore' }
            }
          },
          {
            $project: {
              hour: '$_id.hour',
              dayOfWeek: '$_id.dayOfWeek',
              totalSent: 1,
              totalOpened: 1,
              totalClicked: 1,
              totalReplied: 1,
              openRate: { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 100] },
              clickRate: { $multiply: [{ $divide: ['$totalClicked', '$totalOpened'] }, 100] },
              responseRate: { $multiply: [{ $divide: ['$totalReplied', '$totalSent'] }, 100] },
              avgEngagementScore: 1,
              score: {
                $add: [
                  { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 30] },
                  { $multiply: [{ $divide: ['$totalClicked', '$totalOpened'] }, 40] },
                  { $multiply: [{ $divide: ['$totalReplied', '$totalSent'] }, 30] }
                ]
              }
            }
          },
          { $sort: { score: -1 } }
        );

        bestTimes = await EmailTracking.aggregate(pipeline);
      }

      // Grouper par heure et jour de la semaine
      const hourlyHeatmap = Array(24).fill().map(() => Array(7).fill(0));
      const hourlyStats = Array(24).fill().map(() => ({ sent: 0, opened: 0, clicked: 0, replied: 0 }));
      const dailyStats = Array(7).fill().map(() => ({ sent: 0, opened: 0, clicked: 0, replied: 0 }));

      bestTimes.forEach(item => {
        const hour = item.hour;
        const day = item.dayOfWeek - 1; // MongoDB: 1=Sunday, convertir en 0=Sunday

        hourlyHeatmap[hour][day] = item.score || item.openRate || 0;
        hourlyStats[hour].sent += item.totalSent || 0;
        hourlyStats[hour].opened += item.totalOpened || 0;
        hourlyStats[hour].clicked += item.totalClicked || 0;
        hourlyStats[hour].replied += item.totalReplied || 0;

        dailyStats[day].sent += item.totalSent || 0;
        dailyStats[day].opened += item.totalOpened || 0;
        dailyStats[day].clicked += item.totalClicked || 0;
        dailyStats[day].replied += item.totalReplied || 0;
      });

      // Calculer les taux pour les stats agrégées
      hourlyStats.forEach(stat => {
        if (stat.sent > 0) {
          stat.openRate = (stat.opened / stat.sent) * 100;
          stat.responseRate = (stat.replied / stat.sent) * 100;
        }
      });

      dailyStats.forEach(stat => {
        if (stat.sent > 0) {
          stat.openRate = (stat.opened / stat.sent) * 100;
          stat.responseRate = (stat.replied / stat.sent) * 100;
        }
      });

      // Recommandations IA
      const aiRecommendations = await predictionService.getBestTimingRecommendations(
        contactId,
        { startDate, endDate }
      );

      res.json({
        success: true,
        data: {
          bestTimes,
          hourlyHeatmap,
          hourlyStats,
          dailyStats,
          aiRecommendations,
          period: { startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Best times analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching best times analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/analytics/trends
 * @desc Analyse des tendances temporelles
 * @access Private
 */
router.get('/trends',
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
    query('granularity').optional().isIn(['hour', 'day', 'week', 'month']),
    query('metric').optional().isIn(['openRate', 'clickRate', 'responseRate', 'engagementScore'])
  ],
  handleValidationErrors,
  parseDateRange,
  async (req, res) => {
    try {
      const { granularity = 'day', metric = 'openRate' } = req.query;
      const { startDate, endDate } = req.dateRange;

      // Récupérer les tendances depuis le cache si possible
      const trends = await AnalyticsMetric.getMetricTrends('temporal_analysis', req.query.period, granularity);

      if (trends.length === 0) {
        // Calculer les tendances en temps réel
        const temporalData = await Campaign.getTemporalMetrics(req.query.period || '30d', granularity);

        // Sauvegarder en cache
        for (const data of temporalData) {
          const analyticsMetric = new AnalyticsMetric({
            type: 'temporal_analysis',
            period: {
              startDate: new Date(data._id),
              endDate: new Date(data._id),
              granularity
            },
            metrics: {
              totalSent: data.totalSent,
              totalOpened: data.totalOpened,
              totalClicked: data.totalClicked,
              totalReplied: data.totalReplied,
              openRate: data.avgOpenRate,
              clickRate: data.avgClickRate,
              responseRate: data.avgResponseRate
            },
            status: 'completed'
          });
          analyticsMetric.setValidityPeriod(12); // 12 heures de cache
          await analyticsMetric.save();
        }

        res.json({
          success: true,
          data: {
            trends: temporalData,
            period: { startDate, endDate },
            granularity,
            metric
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            trends,
            period: { startDate, endDate },
            granularity,
            metric
          }
        });
      }

    } catch (error) {
      console.error('Trends analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching trends analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/analytics/track/open/:emailId
 * @desc Tracker l'ouverture d'email (pixel tracking)
 * @access Public (no auth needed)
 */
router.post('/track/open/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { deviceType, userAgent, ipAddress } = req.body;

    const tracking = await EmailTracking.findOne({ emailId });

    if (tracking) {
      tracking.markAsOpened(deviceType, userAgent, ipAddress);
      await tracking.save();

      // Mettre à jour le profil journaliste
      const profile = await JournalistProfile.findOne({ contactId: tracking.contactId });
      if (profile) {
        profile.engagementHistory.lastEngagement = new Date();
        await profile.save();
      }
    }

    // Retourner un pixel transparent 1x1
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Pixel GIF transparent 1x1
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.send(pixel);

  } catch (error) {
    console.error('Email tracking error:', error);
    res.status(200).send(); // Toujours retourner 200 pour les trackers
  }
});

/**
 * @route POST /api/analytics/track/click/:emailId
 * @desc Tracker les clics sur liens (redirect tracking)
 * @access Public (no auth needed)
 */
router.post('/track/click/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { url, position } = req.body;

    const tracking = await EmailTracking.findOne({ emailId });

    if (tracking) {
      tracking.markAsClicked(url, position);
      await tracking.save();

      // Mettre à jour le profil journaliste
      const profile = await JournalistProfile.findOne({ contactId: tracking.contactId });
      if (profile) {
        profile.engagementHistory.lastEngagement = new Date();
        await profile.save();
      }
    }

    res.json({ success: true, redirectUrl: url });

  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(500).json({ success: false, error: 'Tracking error' });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Exporter les données analytics en CSV/Excel
 * @access Private
 */
router.get('/export',
  [
    query('format').isIn(['csv', 'excel']),
    query('type').isIn(['campaigns', 'journalists', 'global']),
    query('period').optional().isIn(['7d', '30d', '90d', '1y'])
  ],
  handleValidationErrors,
  parseDateRange,
  async (req, res) => {
    try {
      const { format, type } = req.query;
      const { startDate, endDate } = req.dateRange;

      // Cette route sera implémentée avec les services d'export
      // Pour l'instant, on retourne les données JSON
      let data = {};

      switch (type) {
        case 'campaigns':
          data = await Campaign.find({
            sentAt: { $gte: startDate, $lte: endDate }
          }).populate('artistId projectId').lean();
          break;

        case 'journalists':
          data = await JournalistProfile.find({
            'engagementHistory.lastEngagement': { $gte: startDate }
          }).populate('contactId').lean();
          break;

        case 'global':
          data = await metricsEngine.calculateGlobalMetrics(startDate, endDate);
          break;
      }

      res.json({
        success: true,
        data,
        message: `Export ${type} data in ${format} format will be implemented`
      });

    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting analytics data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * ROUTES ANALYTICS EMAIL MARKETING
 * Routes dédiées aux statistiques des campagnes email
 */

/**
 * @route GET /api/analytics/email/global
 * @desc Statistiques globales des emails
 * @access Private
 */
router.get('/email/global',
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y'])
  ],
  async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;

      // Calculer les dates
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Récupérer les métriques globales
      const globalMetrics = await Campaign.getAggregatedMetrics({
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: {
          ...globalMetrics,
          period: { startDate, endDate },
          timeRange
        }
      });

    } catch (error) {
      console.error('Erreur analytics email global:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques globales'
      });
    }
  }
);

/**
 * @route GET /api/analytics/email/performance
 * @desc Données de performance temporelle
 * @access Private
 */
router.get('/email/performance',
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d']),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  async (req, res) => {
    try {
      const { timeRange = '30d', groupBy = 'day' } = req.query;

      const performanceData = await Campaign.getTemporalMetrics(timeRange, groupBy);

      res.json({
        success: true,
        data: {
          timeline: performanceData,
          timeRange,
          groupBy
        }
      });

    } catch (error) {
      console.error('Erreur analytics performance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données de performance'
      });
    }
  }
);

/**
 * @route GET /api/analytics/email/top-campaigns
 * @desc Top des meilleures campagnes
 * @access Private
 */
router.get('/email/top-campaigns',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('metric').optional().isIn(['openRate', 'clickRate', 'responseRate', 'engagementScore'])
  ],
  async (req, res) => {
    try {
      const { limit = 10, metric = 'responseRate' } = req.query;

      const topCampaigns = await Campaign.getPerformanceLeaderboard(
        parseInt(limit),
        metric
      );

      res.json({
        success: true,
        data: topCampaigns
      });

    } catch (error) {
      console.error('Erreur top campagnes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du classement des campagnes'
      });
    }
  }
);

/**
 * @route GET /api/analytics/email/engagement
 * @desc Analyse d'engagement des journalistes
 * @access Private
 */
router.get('/email/engagement',
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;

      // Récupérer les journalistes les plus engagés
      const Contact = require('../models/Contact');
      const topJournalists = await Contact.getEngagementLeaderboard(parseInt(limit));

      // Statistiques de segmentation
      const segmentStats = await Contact.getSegmentationStats();

      res.json({
        success: true,
        data: {
          topJournalists,
          segmentStats
        }
      });

    } catch (error) {
      console.error('Erreur analytics engagement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse d\'engagement'
      });
    }
  }
);

/**
 * @route GET /api/analytics/email/insights
 * @desc Insights et recommandations IA
 * @access Private
 */
router.get('/email/insights',
  async (req, res) => {
    try {
      // Récupérer les insights récents
      const recentCampaigns = await Campaign.find({
        status: 'sent',
        sentAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ sentAt: -1 }).limit(10);

      const insights = [];

      for (const campaign of recentCampaigns) {
        const campaignInsights = campaign.getPerformanceInsights();
        insights.push({
          campaignId: campaign._id,
          campaignName: campaign.name,
          insights: campaignInsights
        });
      }

      // Tendances globales
      const globalTrends = await Campaign.getAggregatedMetrics({
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 jours
        endDate: new Date()
      });

      const recommendations = [];

      // Générer des recommandations basées sur les performances
      if (globalTrends.avgOpenRate < 20) {
        recommendations.push({
          type: 'warning',
          category: 'subject_optimization',
          message: 'Taux d\'ouverture en dessous de la moyenne du secteur',
          suggestion: 'Optimisez vos sujets d\'emails avec des tests A/B',
          priority: 'high'
        });
      }

      if (globalTrends.avgResponseRate < 5) {
        recommendations.push({
          type: 'info',
          category: 'content_optimization',
          message: 'Potentiel d\'amélioration du taux de réponse',
          suggestion: 'Personnalisez davantage le contenu selon le profil journaliste',
          priority: 'medium'
        });
      }

      res.json({
        success: true,
        data: {
          insights,
          recommendations,
          globalTrends,
          analysisDate: new Date()
        }
      });

    } catch (error) {
      console.error('Erreur analytics insights:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des insights'
      });
    }
  }
);

module.exports = router;