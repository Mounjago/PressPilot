const mongoose = require('mongoose');
const EmailTracking = require('../models/EmailTracking');
const JournalistProfile = require('../models/JournalistProfile');
const Campaign = require('../models/Campaign');
const AnalyticsMetric = require('../models/AnalyticsMetric');

/**
 * Service de calcul des métriques analytics
 * Centralise tous les calculs de performance et d'engagement
 */
class MetricsEngine {

  /**
   * Calcule les métriques globales pour le dashboard
   */
  async calculateGlobalMetrics(startDate, endDate, filters = {}) {
    try {
      // Construction de la requête de base
      const baseMatch = {
        sentAt: { $gte: startDate, $lte: endDate }
      };

      // Ajouter les filtres
      if (filters.artistId) {
        const campaigns = await Campaign.find({ artistId: filters.artistId }).select('_id');
        const campaignIds = campaigns.map(c => c._id);
        baseMatch.campaignId = { $in: campaignIds };
      }

      if (filters.projectId) {
        const campaigns = await Campaign.find({ projectId: filters.projectId }).select('_id');
        const campaignIds = campaigns.map(c => c._id);
        baseMatch.campaignId = { $in: campaignIds };
      }

      // Pipeline d'agrégation principal
      const pipeline = [
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            totalOpened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
            totalClicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
            totalReplied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } },
            totalBounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
            totalUnsubscribed: { $sum: { $cond: [{ $eq: ['$status', 'unsubscribed'] }, 1, 0] } },

            // Sommes pour calculs avancés
            totalEngagementScore: { $sum: '$engagementScore' },
            totalClicks: { $sum: '$totalClicks' },
            totalOpens: { $sum: '$totalOpens' },

            // Temps de réponse
            avgTimeToOpen: { $avg: {
              $cond: [
                { $ne: ['$openedAt', null] },
                { $divide: [{ $subtract: ['$openedAt', '$sentAt'] }, 1000 * 60] }, // minutes
                null
              ]
            }},
            avgTimeToClick: { $avg: {
              $cond: [
                { $ne: ['$clickedAt', null] },
                { $divide: [{ $subtract: ['$clickedAt', '$sentAt'] }, 1000 * 60] }, // minutes
                null
              ]
            }},
            avgTimeToReply: { $avg: {
              $cond: [
                { $ne: ['$repliedAt', null] },
                { $divide: [{ $subtract: ['$repliedAt', '$sentAt'] }, 1000 * 60 * 60] }, // heures
                null
              ]
            }}
          }
        }
      ];

      const result = await EmailTracking.aggregate(pipeline);
      const data = result[0] || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        totalBounced: 0,
        totalUnsubscribed: 0,
        totalEngagementScore: 0,
        totalClicks: 0,
        totalOpens: 0,
        avgTimeToOpen: 0,
        avgTimeToClick: 0,
        avgTimeToReply: 0
      };

      // Calcul des taux
      const metrics = {
        // Compteurs bruts
        totalSent: data.totalSent,
        totalOpened: data.totalOpened,
        totalClicked: data.totalClicked,
        totalReplied: data.totalReplied,
        totalBounced: data.totalBounced,
        totalUnsubscribed: data.totalUnsubscribed,

        // Taux principaux
        deliveryRate: data.totalSent > 0 ? ((data.totalSent - data.totalBounced) / data.totalSent) * 100 : 0,
        openRate: data.totalSent > 0 ? (data.totalOpened / data.totalSent) * 100 : 0,
        clickRate: data.totalOpened > 0 ? (data.totalClicked / data.totalOpened) * 100 : 0,
        responseRate: data.totalSent > 0 ? (data.totalReplied / data.totalSent) * 100 : 0,
        bounceRate: data.totalSent > 0 ? (data.totalBounced / data.totalSent) * 100 : 0,
        unsubscribeRate: data.totalSent > 0 ? (data.totalUnsubscribed / data.totalSent) * 100 : 0,

        // Métriques d'engagement avancées
        engagementScore: data.totalSent > 0 ? data.totalEngagementScore / data.totalSent : 0,
        clickThroughRate: data.totalSent > 0 ? (data.totalClicked / data.totalSent) * 100 : 0,
        multipleOpensRate: data.totalOpened > 0 ? ((data.totalOpens - data.totalOpened) / data.totalOpened) * 100 : 0,
        multipleClicksRate: data.totalClicked > 0 ? ((data.totalClicks - data.totalClicked) / data.totalClicked) * 100 : 0,

        // Temps moyens
        averageTimeToOpen: Math.round(data.avgTimeToOpen || 0),
        averageTimeToClick: Math.round(data.avgTimeToClick || 0),
        averageTimeToReply: Math.round(data.avgTimeToReply || 0),

        // Période d'analyse
        analysisStartDate: startDate,
        analysisEndDate: endDate,
        analysisPeriodDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      };

      // Ajouter des métriques dérivées
      metrics.qualityScore = this.calculateQualityScore(metrics);
      metrics.performanceIndex = this.calculatePerformanceIndex(metrics);

      return metrics;

    } catch (error) {
      console.error('Error calculating global metrics:', error);
      throw error;
    }
  }

  /**
   * Calcule les métriques détaillées d'une campagne
   */
  async calculateCampaignMetrics(campaignId, includeDetailed = true) {
    try {
      const basicMetrics = await EmailTracking.getCampaignMetrics(
        campaignId,
        new Date(0),
        new Date()
      );

      if (!includeDetailed) {
        return basicMetrics;
      }

      // Métriques détaillées
      const pipeline = [
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        {
          $group: {
            _id: null,
            // Distributions temporelles
            hourDistribution: {
              $push: {
                hour: { $hour: '$sentAt' },
                opened: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] },
                clicked: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] },
                replied: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] }
              }
            },

            // Distribution des appareils
            deviceDistribution: {
              $push: {
                device: '$deviceType',
                opened: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] },
                clicked: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] }
              }
            },

            // Temps de réaction
            reactionTimes: {
              $push: {
                timeToOpen: {
                  $cond: [
                    { $ne: ['$openedAt', null] },
                    { $divide: [{ $subtract: ['$openedAt', '$sentAt'] }, 1000 * 60] },
                    null
                  ]
                },
                timeToClick: {
                  $cond: [
                    { $ne: ['$clickedAt', null] },
                    { $divide: [{ $subtract: ['$clickedAt', '$sentAt'] }, 1000 * 60] },
                    null
                  ]
                },
                timeToReply: {
                  $cond: [
                    { $ne: ['$repliedAt', null] },
                    { $divide: [{ $subtract: ['$repliedAt', '$sentAt'] }, 1000 * 60 * 60] },
                    null
                  ]
                }
              }
            }
          }
        }
      ];

      const detailedResult = await EmailTracking.aggregate(pipeline);
      const detailed = detailedResult[0] || { hourDistribution: [], deviceDistribution: [], reactionTimes: [] };

      // Analyser les distributions
      const hourlyAnalysis = this.analyzeHourlyDistribution(detailed.hourDistribution);
      const deviceAnalysis = this.analyzeDeviceDistribution(detailed.deviceDistribution);
      const timingAnalysis = this.analyzeReactionTimes(detailed.reactionTimes);

      return {
        ...basicMetrics,
        hourlyAnalysis,
        deviceAnalysis,
        timingAnalysis,
        insights: this.generateCampaignInsights(basicMetrics, hourlyAnalysis, deviceAnalysis, timingAnalysis)
      };

    } catch (error) {
      console.error('Error calculating campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Calcule le score d'affinité d'un journaliste
   */
  async calculateJournalistAffinity(contactId) {
    try {
      const pipeline = [
        { $match: { contactId: new mongoose.Types.ObjectId(contactId) } },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            totalOpened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
            totalClicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
            totalReplied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } },

            avgEngagementScore: { $avg: '$engagementScore' },

            // Consistance dans le temps
            engagementByMonth: {
              $push: {
                month: { $dateToString: { format: '%Y-%m', date: '$sentAt' } },
                engagement: '$engagementScore'
              }
            },

            // Temps de réponse
            responseTimes: {
              $push: {
                $cond: [
                  { $ne: ['$repliedAt', null] },
                  { $divide: [{ $subtract: ['$repliedAt', '$sentAt'] }, 1000 * 60 * 60] },
                  null
                ]
              }
            },

            // Dernière activité
            lastEngagement: {
              $max: {
                $cond: [
                  { $ne: ['$repliedAt', null] }, '$repliedAt',
                  { $cond: [
                    { $ne: ['$clickedAt', null] }, '$clickedAt',
                    { $cond: [{ $ne: ['$openedAt', null] }, '$openedAt', '$sentAt'] }
                  ]}
                ]
              }
            },
            firstContact: { $min: '$sentAt' }
          }
        }
      ];

      const result = await EmailTracking.aggregate(pipeline);
      const data = result[0];

      if (!data || data.totalSent === 0) {
        return {
          affinityScore: 0,
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
          avgEngagementScore: 0,
          consistencyScore: 0,
          recencyScore: 0,
          reliabilityScore: 0
        };
      }

      // Calculs de base
      const openRate = (data.totalOpened / data.totalSent) * 100;
      const clickRate = data.totalOpened > 0 ? (data.totalClicked / data.totalOpened) * 100 : 0;
      const responseRate = (data.totalReplied / data.totalSent) * 100;

      // Score de consistance
      const consistencyScore = this.calculateConsistencyScore(data.engagementByMonth);

      // Score de récence
      const recencyScore = this.calculateRecencyScore(data.lastEngagement);

      // Score de fiabilité (basé sur temps de réponse)
      const reliabilityScore = this.calculateReliabilityScore(data.responseTimes);

      // Score d'affinité global (pondéré)
      const affinityScore = (
        (openRate * 0.25) +
        (clickRate * 0.25) +
        (responseRate * 0.3) +
        (consistencyScore * 0.1) +
        (recencyScore * 0.1)
      );

      return {
        affinityScore: Math.min(100, Math.max(0, affinityScore)),
        openRate,
        clickRate,
        responseRate,
        avgEngagementScore: data.avgEngagementScore || 0,
        consistencyScore,
        recencyScore,
        reliabilityScore,
        totalInteractions: data.totalSent,
        relationshipDuration: data.firstContact ? Math.ceil((Date.now() - data.firstContact) / (1000 * 60 * 60 * 24)) : 0
      };

    } catch (error) {
      console.error('Error calculating journalist affinity:', error);
      throw error;
    }
  }

  /**
   * Analyse les meilleurs moments d'envoi
   */
  async analyzeBestSendingTimes(filters = {}) {
    try {
      const baseMatch = {
        openedAt: { $ne: null } // Seulement les emails ouverts
      };

      // Ajouter les filtres temporels
      if (filters.startDate && filters.endDate) {
        baseMatch.sentAt = { $gte: filters.startDate, $lte: filters.endDate };
      }

      // Filtrer par journaliste spécifique
      if (filters.contactId) {
        baseMatch.contactId = new mongoose.Types.ObjectId(filters.contactId);
      }

      const pipeline = [
        { $match: baseMatch },
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
            avgEngagementScore: { $avg: '$engagementScore' },
            avgTimeToOpen: {
              $avg: {
                $divide: [{ $subtract: ['$openedAt', '$sentAt'] }, 1000 * 60]
              }
            }
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
            avgTimeToOpen: 1,
            // Score composite pour classer les meilleurs moments
            compositeScore: {
              $add: [
                { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 30] }, // 30% ouverture
                { $multiply: [{ $divide: ['$totalClicked', '$totalOpened'] }, 25] }, // 25% clic
                { $multiply: [{ $divide: ['$totalReplied', '$totalSent'] }, 35] }, // 35% réponse
                { $multiply: ['$avgEngagementScore', 0.1] } // 10% engagement
              ]
            }
          }
        },
        { $sort: { compositeScore: -1 } }
      ];

      const results = await EmailTracking.aggregate(pipeline);

      // Organiser les données pour la heatmap
      const heatmapData = Array(24).fill().map(() => Array(7).fill(0));
      const hourlyStats = Array(24).fill(0);
      const dailyStats = Array(7).fill(0);

      results.forEach(item => {
        const hour = item.hour;
        const day = item.dayOfWeek - 1; // Convertir 1-7 en 0-6

        heatmapData[hour][day] = item.compositeScore;
        hourlyStats[hour] = Math.max(hourlyStats[hour], item.compositeScore);
        dailyStats[day] = Math.max(dailyStats[day], item.compositeScore);
      });

      // Trouver les tops créneaux
      const topTimeSlots = results.slice(0, 10).map(item => ({
        hour: item.hour,
        dayOfWeek: item.dayOfWeek,
        score: item.compositeScore,
        openRate: item.openRate,
        clickRate: item.clickRate,
        responseRate: item.responseRate,
        sampleSize: item.totalSent
      }));

      return {
        heatmapData,
        hourlyStats,
        dailyStats,
        topTimeSlots,
        totalAnalyzedEmails: results.reduce((sum, item) => sum + item.totalSent, 0),
        recommendations: this.generateTimingRecommendations(topTimeSlots)
      };

    } catch (error) {
      console.error('Error analyzing best sending times:', error);
      throw error;
    }
  }

  /**
   * Calcule les métriques de ROI
   */
  calculateROI(campaignMetrics, campaignGoals) {
    if (!campaignGoals.budget || campaignGoals.budget === 0) {
      return null;
    }

    const totalInvestment = campaignGoals.budget;
    const totalReplies = campaignMetrics.totalReplied || 0;
    const targetCostPerReply = campaignGoals.costPerReply || 50;

    const actualCostPerReply = totalReplies > 0 ? totalInvestment / totalReplies : totalInvestment;

    // ROI basé sur l'efficacité vs objectif
    const roi = totalReplies > 0 ?
      ((targetCostPerReply - actualCostPerReply) / actualCostPerReply) * 100 :
      -100;

    // Valeur générée (estimation)
    const estimatedValuePerReply = campaignGoals.valuePerReply || 100;
    const totalValue = totalReplies * estimatedValuePerReply;
    const netValue = totalValue - totalInvestment;
    const valueROI = ((totalValue - totalInvestment) / totalInvestment) * 100;

    return {
      roi,
      valueROI,
      totalInvestment,
      totalValue,
      netValue,
      totalReplies,
      actualCostPerReply,
      targetCostPerReply,
      efficiency: roi > 0 ? 'profitable' : roi > -50 ? 'acceptable' : 'poor',
      breakEvenPoint: targetCostPerReply > 0 ? Math.ceil(totalInvestment / targetCostPerReply) : null
    };
  }

  // === Méthodes utilitaires ===

  calculateQualityScore(metrics) {
    // Score de qualité basé sur l'équilibre des métriques
    const openWeight = 0.3;
    const clickWeight = 0.3;
    const responseWeight = 0.4;

    let qualityScore = 0;

    // Normaliser les scores (optimum à 25% open, 15% click, 8% response)
    qualityScore += Math.min(100, (metrics.openRate / 25) * 100) * openWeight;
    qualityScore += Math.min(100, (metrics.clickRate / 15) * 100) * clickWeight;
    qualityScore += Math.min(100, (metrics.responseRate / 8) * 100) * responseWeight;

    return Math.round(qualityScore);
  }

  calculatePerformanceIndex(metrics) {
    // Index de performance global (0-1000)
    const baseScore = (metrics.openRate * 2) + (metrics.clickRate * 5) + (metrics.responseRate * 10);

    // Bonus pour volume
    const volumeBonus = Math.min(100, metrics.totalSent / 100);

    // Malus pour bounces
    const bouncemalus = metrics.bounceRate * 2;

    return Math.max(0, Math.round(baseScore + volumeBonus - bouncemalus));
  }

  calculateConsistencyScore(engagementByMonth) {
    if (!engagementByMonth || engagementByMonth.length < 2) return 50;

    const scores = engagementByMonth
      .filter(item => item.engagement !== null)
      .map(item => item.engagement);

    if (scores.length < 2) return 50;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Plus la variance est faible, plus la consistance est élevée
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 2));

    return Math.round(consistencyScore);
  }

  calculateRecencyScore(lastEngagement) {
    if (!lastEngagement) return 0;

    const daysSinceLastEngagement = (Date.now() - new Date(lastEngagement)) / (1000 * 60 * 60 * 24);

    if (daysSinceLastEngagement < 7) return 100;
    if (daysSinceLastEngagement < 30) return 80;
    if (daysSinceLastEngagement < 90) return 60;
    if (daysSinceLastEngagement < 180) return 40;
    if (daysSinceLastEngagement < 365) return 20;
    return 10;
  }

  calculateReliabilityScore(responseTimes) {
    const validTimes = responseTimes.filter(time => time !== null && time > 0);

    if (validTimes.length === 0) return 0;

    const avgResponseTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;

    // Score basé sur rapidité de réponse (heures)
    if (avgResponseTime < 1) return 100;      // < 1h
    if (avgResponseTime < 6) return 90;       // < 6h
    if (avgResponseTime < 24) return 80;      // < 1 jour
    if (avgResponseTime < 72) return 70;      // < 3 jours
    if (avgResponseTime < 168) return 60;     // < 1 semaine
    return 40;
  }

  analyzeHourlyDistribution(hourDistribution) {
    const hourlyStats = Array(24).fill(0).map(() => ({
      sent: 0, opened: 0, clicked: 0, replied: 0
    }));

    hourDistribution.forEach(item => {
      const hour = item.hour;
      hourlyStats[hour].sent += 1;
      hourlyStats[hour].opened += item.opened;
      hourlyStats[hour].clicked += item.clicked;
      hourlyStats[hour].replied += item.replied;
    });

    // Calculer les taux
    hourlyStats.forEach(stat => {
      if (stat.sent > 0) {
        stat.openRate = (stat.opened / stat.sent) * 100;
        stat.clickRate = stat.opened > 0 ? (stat.clicked / stat.opened) * 100 : 0;
        stat.responseRate = (stat.replied / stat.sent) * 100;
      }
    });

    // Trouver les meilleures heures
    const bestHours = hourlyStats
      .map((stat, hour) => ({ hour, ...stat }))
      .filter(stat => stat.sent > 0)
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3);

    return {
      hourlyStats,
      bestHours,
      peakHour: bestHours[0]?.hour || 10
    };
  }

  analyzeDeviceDistribution(deviceDistribution) {
    const deviceStats = {};

    deviceDistribution.forEach(item => {
      const device = item.device || 'unknown';
      if (!deviceStats[device]) {
        deviceStats[device] = { sent: 0, opened: 0, clicked: 0 };
      }
      deviceStats[device].sent += 1;
      deviceStats[device].opened += item.opened;
      deviceStats[device].clicked += item.clicked;
    });

    // Calculer les taux par appareil
    Object.keys(deviceStats).forEach(device => {
      const stats = deviceStats[device];
      stats.openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
      stats.clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
    });

    return deviceStats;
  }

  analyzeReactionTimes(reactionTimes) {
    const validOpenTimes = reactionTimes
      .map(rt => rt.timeToOpen)
      .filter(time => time !== null && time > 0);

    const validClickTimes = reactionTimes
      .map(rt => rt.timeToClick)
      .filter(time => time !== null && time > 0);

    const validReplyTimes = reactionTimes
      .map(rt => rt.timeToReply)
      .filter(time => time !== null && time > 0);

    return {
      averageTimeToOpen: validOpenTimes.length > 0 ?
        validOpenTimes.reduce((a, b) => a + b, 0) / validOpenTimes.length : 0,
      averageTimeToClick: validClickTimes.length > 0 ?
        validClickTimes.reduce((a, b) => a + b, 0) / validClickTimes.length : 0,
      averageTimeToReply: validReplyTimes.length > 0 ?
        validReplyTimes.reduce((a, b) => a + b, 0) / validReplyTimes.length : 0,
      medianTimeToOpen: this.calculateMedian(validOpenTimes),
      medianTimeToClick: this.calculateMedian(validClickTimes),
      medianTimeToReply: this.calculateMedian(validReplyTimes)
    };
  }

  calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ?
      (sorted[mid - 1] + sorted[mid]) / 2 :
      sorted[mid];
  }

  generateCampaignInsights(basicMetrics, hourlyAnalysis, deviceAnalysis, timingAnalysis) {
    const insights = [];

    // Performance insights
    if (basicMetrics.openRate > 25) {
      insights.push({
        type: 'success',
        title: 'Excellent taux d\'ouverture',
        description: `${basicMetrics.openRate.toFixed(1)}% d'ouverture`,
        recommendation: 'Reproduisez ce type de sujet dans vos prochaines campagnes'
      });
    } else if (basicMetrics.openRate < 15) {
      insights.push({
        type: 'warning',
        title: 'Taux d\'ouverture faible',
        description: `${basicMetrics.openRate.toFixed(1)}% d'ouverture`,
        recommendation: 'Optimisez vos sujets d\'email et testez différents horaires'
      });
    }

    // Timing insights
    if (hourlyAnalysis.bestHours.length > 0) {
      const bestHour = hourlyAnalysis.bestHours[0];
      insights.push({
        type: 'info',
        title: 'Meilleure heure d\'envoi',
        description: `${bestHour.hour}h avec ${bestHour.responseRate.toFixed(1)}% de réponses`,
        recommendation: `Programmez vos futurs envois vers ${bestHour.hour}h`
      });
    }

    // Device insights
    const mobileStats = deviceAnalysis.mobile;
    if (mobileStats && mobileStats.openRate > deviceAnalysis.desktop?.openRate) {
      insights.push({
        type: 'info',
        title: 'Préférence mobile',
        description: 'Taux d\'ouverture plus élevé sur mobile',
        recommendation: 'Optimisez vos emails pour mobile'
      });
    }

    return insights;
  }

  generateTimingRecommendations(topTimeSlots) {
    const recommendations = [];

    if (topTimeSlots.length > 0) {
      const best = topTimeSlots[0];
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

      recommendations.push({
        type: 'optimal',
        title: 'Créneau optimal',
        time: `${dayNames[best.dayOfWeek - 1]} à ${best.hour}h`,
        score: best.score,
        description: `Meilleur taux de réponse: ${best.responseRate.toFixed(1)}%`
      });

      // Recommandations secondaires
      if (topTimeSlots.length > 1) {
        const alternatives = topTimeSlots.slice(1, 4).map(slot => ({
          time: `${dayNames[slot.dayOfWeek - 1]} à ${slot.hour}h`,
          score: slot.score,
          responseRate: slot.responseRate
        }));

        recommendations.push({
          type: 'alternatives',
          title: 'Créneaux alternatifs',
          alternatives
        });
      }
    }

    return recommendations;
  }
}

module.exports = new MetricsEngine();