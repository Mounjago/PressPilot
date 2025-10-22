const mongoose = require('mongoose');
const EmailTracking = require('../models/EmailTracking');
const JournalistProfile = require('../models/JournalistProfile');
const Campaign = require('../models/Campaign');

/**
 * Service de prédictions et recommandations IA
 * Utilise des algorithmes de machine learning pour optimiser les envois
 */
class PredictionService {

  /**
   * Prédit l'engagement d'un journaliste pour une future campagne
   */
  async predictJournalistEngagement(contactId, campaignFeatures = {}) {
    try {
      // Récupérer l'historique du journaliste
      const profile = await JournalistProfile.findOne({ contactId })
        .populate('contactId', 'firstName lastName email media');

      if (!profile) {
        return this.getDefaultPrediction();
      }

      const recentHistory = await EmailTracking.find({ contactId })
        .sort({ sentAt: -1 })
        .limit(20)
        .lean();

      if (recentHistory.length === 0) {
        return this.getDefaultPrediction();
      }

      // Extraire les features pour le modèle
      const features = this.extractEngagementFeatures(profile, recentHistory, campaignFeatures);

      // Appliquer le modèle de prédiction (simplifié pour cette démo)
      const predictions = this.applyEngagementModel(features);

      // Calculer la confiance basée sur l'historique
      const confidence = this.calculatePredictionConfidence(recentHistory);

      return {
        contactId,
        predictions: {
          openProbability: predictions.openProbability,
          clickProbability: predictions.clickProbability,
          replyProbability: predictions.replyProbability,
          engagementScore: predictions.engagementScore
        },
        confidence,
        factors: features.dominantFactors,
        recommendedTime: await this.predictOptimalSendTime(contactId),
        risks: this.identifyRisks(features, recentHistory),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error predicting journalist engagement:', error);
      throw error;
    }
  }

  /**
   * Prédit le meilleur moment pour contacter un journaliste
   */
  async predictOptimalSendTime(contactId) {
    try {
      const bestTimes = await EmailTracking.getBestSendTimes(contactId);

      if (!bestTimes || bestTimes.length === 0) {
        // Retourner les valeurs par défaut basées sur les tendances générales
        return {
          hour: 10,
          dayOfWeek: 2, // Mardi
          confidence: 30,
          reason: 'Basé sur les tendances générales de l\'industrie'
        };
      }

      // Analyser les patterns temporels
      const timePatterns = this.analyzeTimePatterns(bestTimes);

      // Trouver le créneau optimal
      const optimal = bestTimes.reduce((best, current) => {
        const currentScore = (current.openRate * 0.4) + (current.avgEngagementScore * 0.6);
        const bestScore = (best.openRate * 0.4) + (best.avgEngagementScore * 0.6);
        return currentScore > bestScore ? current : best;
      });

      return {
        hour: optimal.hour,
        dayOfWeek: optimal.dayOfWeek,
        confidence: Math.min(95, optimal.openRate + 20),
        reason: `Basé sur ${bestTimes.length} interactions précédentes`,
        alternativeSlots: this.getAlternativeTimeSlots(bestTimes),
        patterns: timePatterns
      };

    } catch (error) {
      console.error('Error predicting optimal send time:', error);
      return this.getDefaultTiming();
    }
  }

  /**
   * Génère des recommandations personnalisées pour améliorer l'engagement
   */
  async getPersonalizedRecommendations(contactId) {
    try {
      const profile = await JournalistProfile.findOne({ contactId })
        .populate('contactId');

      if (!profile) {
        return this.getGenericRecommendations();
      }

      const recommendations = [];

      // Recommandations basées sur l'historique d'engagement
      if (profile.affinityScore < 30) {
        recommendations.push({
          category: 'engagement',
          priority: 'high',
          title: 'Améliorer l\'engagement',
          description: 'Score d\'affinité faible détecté',
          actions: [
            'Personnaliser davantage le message',
            'Vérifier la pertinence du contenu',
            'Tester différents formats d\'email'
          ],
          expectedImprovement: '15-25%'
        });
      }

      // Recommandations de timing
      const bestTime = profile.getBestContactTime();
      if (bestTime && bestTime.confidence > 60) {
        recommendations.push({
          category: 'timing',
          priority: 'medium',
          title: 'Optimiser le timing',
          description: `Meilleur créneau identifié: ${this.getDayName(bestTime.dayOfWeek)} à ${bestTime.hour}h`,
          actions: [
            `Programmer les envois le ${this.getDayName(bestTime.dayOfWeek)}`,
            `Viser la tranche ${bestTime.hour}h-${bestTime.hour + 1}h`,
            'Éviter les créneaux à faible engagement'
          ],
          expectedImprovement: '10-20%'
        });
      }

      // Recommandations de contenu basées sur les préférences
      if (profile.topicPreferences && profile.topicPreferences.length > 0) {
        const topTopics = profile.topicPreferences
          .sort((a, b) => b.engagementScore - a.engagementScore)
          .slice(0, 3);

        recommendations.push({
          category: 'content',
          priority: 'medium',
          title: 'Optimiser le contenu',
          description: 'Sujets préférés identifiés',
          actions: [
            `Mettre l'accent sur: ${topTopics.map(t => t.topic).join(', ')}`,
            'Utiliser un vocabulaire adapté',
            'Inclure des éléments multimédias'
          ],
          expectedImprovement: '8-15%'
        });
      }

      // Recommandations de fréquence
      const frequencyRec = this.getFrequencyRecommendation(profile);
      if (frequencyRec) {
        recommendations.push(frequencyRec);
      }

      // Recommandations basées sur les journalistes similaires
      const similarJournalists = await JournalistProfile.findSimilarJournalists(contactId, 3);
      if (similarJournalists.length > 0) {
        const bestPractices = this.extractBestPracticesFromSimilar(similarJournalists);
        if (bestPractices.length > 0) {
          recommendations.push({
            category: 'strategy',
            priority: 'low',
            title: 'Stratégies éprouvées',
            description: 'Basé sur des journalistes aux profils similaires',
            actions: bestPractices,
            expectedImprovement: '5-12%'
          });
        }
      }

      return {
        contactId,
        totalRecommendations: recommendations.length,
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
        nextReviewDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 jours
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Recommandations globales pour les meilleurs créneaux d'envoi
   */
  async getBestTimingRecommendations(contactId = null, dateRange = {}) {
    try {
      const startDate = dateRange.startDate || new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
      const endDate = dateRange.endDate || new Date();

      // Pipeline d'analyse des patterns temporels
      const pipeline = [
        {
          $match: {
            sentAt: { $gte: startDate, $lte: endDate },
            ...(contactId && { contactId: new mongoose.Types.ObjectId(contactId) })
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$sentAt' },
              dayOfWeek: { $dayOfWeek: '$sentAt' }
            },
            totalSent: { $sum: 1 },
            totalOpened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
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
            openRate: { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 100] },
            clickRate: { $multiply: [{ $divide: ['$totalClicked', '$totalOpened'] }, 100] },
            responseRate: { $multiply: [{ $divide: ['$totalReplied', '$totalSent'] }, 100] },
            avgEngagementScore: 1,
            score: {
              $add: [
                { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 30] },
                { $multiply: [{ $divide: ['$totalClicked', '$totalOpened'] }, 25] },
                { $multiply: [{ $divide: ['$totalReplied', '$totalSent'] }, 35] },
                { $multiply: ['$avgEngagementScore', 0.1] }
              ]
            }
          }
        },
        { $sort: { score: -1 } }
      ];

      const results = await EmailTracking.aggregate(pipeline);

      // Analyser les patterns
      const patterns = this.analyzeGlobalTimePatterns(results);

      // Générer des recommandations basées sur l'IA
      const aiRecommendations = this.generateAITimingRecommendations(patterns);

      return {
        scope: contactId ? 'individual' : 'global',
        analysisPeriod: { startDate, endDate },
        topSlots: results.slice(0, 10),
        patterns,
        recommendations: aiRecommendations,
        confidence: this.calculateTimingConfidence(results),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting timing recommendations:', error);
      throw error;
    }
  }

  /**
   * Prédit les performances d'une campagne avant envoi
   */
  async predictCampaignPerformance(campaignData) {
    try {
      const {
        targetContacts,
        subject,
        content,
        scheduledTime,
        artistId,
        projectId
      } = campaignData;

      // Analyser l'historique des campagnes similaires
      const similarCampaigns = await Campaign.find({
        artistId,
        status: 'sent',
        'metrics.totalSent': { $gt: 0 }
      }).sort({ sentAt: -1 }).limit(10).lean();

      // Calculer les métriques de base prévisionnelles
      const basePrediction = this.calculateBasePrediction(similarCampaigns);

      // Analyser les facteurs de la campagne actuelle
      const subjectScore = this.analyzeSubjectLine(subject);
      const contentScore = this.analyzeEmailContent(content);
      const timingScore = await this.analyzeScheduledTiming(scheduledTime);
      const audienceScore = await this.analyzeTargetAudience(targetContacts);

      // Appliquer les ajustements
      const adjustedPrediction = this.applyPredictionAdjustments(
        basePrediction,
        { subjectScore, contentScore, timingScore, audienceScore }
      );

      // Calculer les intervalles de confiance
      const confidence = this.calculateCampaignPredictionConfidence(similarCampaigns, adjustedPrediction);

      return {
        predictions: {
          expectedOpenRate: adjustedPrediction.openRate,
          expectedClickRate: adjustedPrediction.clickRate,
          expectedResponseRate: adjustedPrediction.responseRate,
          expectedEngagementScore: adjustedPrediction.engagementScore,
          expectedReplies: Math.round(adjustedPrediction.responseRate * targetContacts.length / 100)
        },
        confidence,
        factors: {
          subject: subjectScore,
          content: contentScore,
          timing: timingScore,
          audience: audienceScore
        },
        recommendations: this.generateCampaignOptimizationTips(
          { subjectScore, contentScore, timingScore, audienceScore }
        ),
        benchmarks: basePrediction,
        riskFactors: this.identifyCampaignRisks(campaignData, adjustedPrediction),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error predicting campaign performance:', error);
      throw error;
    }
  }

  // === Méthodes utilitaires ===

  extractEngagementFeatures(profile, recentHistory, campaignFeatures) {
    const features = {
      // Features historiques
      historicalOpenRate: profile.engagementHistory.averageOpenRate || 0,
      historicalClickRate: profile.engagementHistory.averageClickRate || 0,
      historicalResponseRate: profile.engagementHistory.averageResponseRate || 0,
      affinityScore: profile.affinityScore || 0,
      influenceScore: profile.influenceScore || 0,
      consistencyScore: profile.calculateConsistencyBonus(),
      recencyScore: profile.calculateRecencyBonus(),

      // Features comportementales
      averageEngagement: recentHistory.reduce((sum, h) => sum + (h.engagementScore || 0), 0) / recentHistory.length,
      responseSpeed: this.calculateAverageResponseSpeed(recentHistory),
      preferredHours: this.extractPreferredHours(recentHistory),
      devicePreference: this.extractDevicePreference(recentHistory),

      // Features contextuelles
      relationshipDuration: profile.engagementHistory.firstContact ?
        (Date.now() - profile.engagementHistory.firstContact) / (1000 * 60 * 60 * 24) : 0,
      totalInteractions: profile.engagementHistory.totalEmailsSent || 0,

      // Features de campagne (si fournies)
      ...campaignFeatures
    };

    // Identifier les facteurs dominants
    features.dominantFactors = this.identifyDominantFactors(features);

    return features;
  }

  applyEngagementModel(features) {
    // Modèle simplifié basé sur des règles pondérées
    // Dans un vrai système, ceci serait un modèle ML entraîné

    let openProbability = 0.15; // Base 15%
    let clickProbability = 0.08; // Base 8%
    let replyProbability = 0.03; // Base 3%

    // Ajustements basés sur l'historique
    openProbability += (features.historicalOpenRate / 100) * 0.6;
    clickProbability += (features.historicalClickRate / 100) * 0.6;
    replyProbability += (features.historicalResponseRate / 100) * 0.6;

    // Ajustements basés sur l'affinité
    const affinityMultiplier = 1 + (features.affinityScore / 100);
    openProbability *= affinityMultiplier;
    clickProbability *= affinityMultiplier;
    replyProbability *= affinityMultiplier;

    // Ajustements basés sur la récence
    const recencyMultiplier = 0.5 + (features.recencyScore / 100) * 0.5;
    openProbability *= recencyMultiplier;
    clickProbability *= recencyMultiplier;
    replyProbability *= recencyMultiplier;

    // Normaliser les probabilités
    openProbability = Math.min(0.8, Math.max(0.02, openProbability));
    clickProbability = Math.min(0.5, Math.max(0.01, clickProbability));
    replyProbability = Math.min(0.3, Math.max(0.005, replyProbability));

    // Calculer le score d'engagement prévu
    const engagementScore = (openProbability * 20) + (clickProbability * 30) + (replyProbability * 50);

    return {
      openProbability: Math.round(openProbability * 100),
      clickProbability: Math.round(clickProbability * 100),
      replyProbability: Math.round(replyProbability * 100),
      engagementScore: Math.round(engagementScore)
    };
  }

  calculatePredictionConfidence(recentHistory) {
    if (recentHistory.length === 0) return 20;

    // Confiance basée sur:
    // - Volume d'historique (plus = mieux)
    // - Récence des données
    // - Consistance des patterns

    const volumeScore = Math.min(40, recentHistory.length * 2);

    const recencyScore = recentHistory.length > 0 ?
      Math.max(0, 30 - ((Date.now() - new Date(recentHistory[0].sentAt)) / (1000 * 60 * 60 * 24))) :
      0;

    const consistencyScore = this.calculateHistoryConsistency(recentHistory);

    return Math.min(95, Math.max(20, volumeScore + recencyScore + consistencyScore));
  }

  identifyRisks(features, recentHistory) {
    const risks = [];

    if (features.recencyScore < 40) {
      risks.push({
        type: 'engagement_decline',
        severity: 'medium',
        description: 'Aucune interaction récente détectée',
        mitigation: 'Considérer un message de re-engagement'
      });
    }

    if (features.affinityScore < 25) {
      risks.push({
        type: 'low_affinity',
        severity: 'high',
        description: 'Score d\'affinité faible',
        mitigation: 'Personnaliser fortement le message'
      });
    }

    const bounceRate = recentHistory.filter(h => h.status === 'bounced').length / recentHistory.length;
    if (bounceRate > 0.1) {
      risks.push({
        type: 'delivery_issues',
        severity: 'high',
        description: 'Taux de bounce élevé détecté',
        mitigation: 'Vérifier la validité de l\'email'
      });
    }

    return risks;
  }

  getDefaultPrediction() {
    return {
      predictions: {
        openProbability: 15,
        clickProbability: 8,
        replyProbability: 3,
        engagementScore: 25
      },
      confidence: 30,
      factors: ['Aucun historique disponible'],
      recommendedTime: this.getDefaultTiming(),
      risks: [],
      lastUpdated: new Date()
    };
  }

  getDefaultTiming() {
    return {
      hour: 10,
      dayOfWeek: 2,
      confidence: 30,
      reason: 'Tendances générales de l\'industrie'
    };
  }

  analyzeTimePatterns(bestTimes) {
    const hourCounts = {};
    const dayCounts = {};

    bestTimes.forEach(time => {
      hourCounts[time.hour] = (hourCounts[time.hour] || 0) + 1;
      dayCounts[time.dayOfWeek] = (dayCounts[time.dayOfWeek] || 0) + 1;
    });

    return {
      preferredHours: Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: parseInt(hour), frequency: count })),
      preferredDays: Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day, count]) => ({ dayOfWeek: parseInt(day), frequency: count }))
    };
  }

  getAlternativeTimeSlots(bestTimes) {
    return bestTimes
      .slice(1, 4)
      .map(time => ({
        hour: time.hour,
        dayOfWeek: time.dayOfWeek,
        score: time.openRate,
        confidence: Math.min(90, time.openRate + 10)
      }));
  }

  getDayName(dayOfWeek) {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek - 1] || 'Inconnu';
  }

  getGenericRecommendations() {
    return {
      totalRecommendations: 3,
      recommendations: [
        {
          category: 'engagement',
          priority: 'high',
          title: 'Construire l\'historique',
          description: 'Aucun historique d\'engagement disponible',
          actions: [
            'Commencer par des messages courts et personnalisés',
            'Éviter les envois en masse initialement',
            'Suivre attentivement les premières interactions'
          ],
          expectedImprovement: 'Établir une baseline'
        }
      ],
      lastUpdated: new Date()
    };
  }

  // Méthodes utilitaires supplémentaires...

  calculateAverageResponseSpeed(history) {
    const responseTimes = history
      .filter(h => h.repliedAt && h.sentAt)
      .map(h => (new Date(h.repliedAt) - new Date(h.sentAt)) / (1000 * 60 * 60));

    return responseTimes.length > 0 ?
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length :
      0;
  }

  extractPreferredHours(history) {
    const hourCounts = {};
    history.forEach(h => {
      if (h.openedAt) {
        const hour = new Date(h.sentAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  extractDevicePreference(history) {
    const deviceCounts = {};
    history.forEach(h => {
      if (h.deviceType && h.openedAt) {
        deviceCounts[h.deviceType] = (deviceCounts[h.deviceType] || 0) + 1;
      }
    });

    const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, percentage: (count / total) * 100 }))
      .sort((a, b) => b.percentage - a.percentage)[0];
  }

  identifyDominantFactors(features) {
    const factors = [];

    if (features.affinityScore > 70) factors.push('Forte affinité');
    if (features.recencyScore > 80) factors.push('Engagement récent');
    if (features.responseSpeed < 6) factors.push('Réponses rapides');
    if (features.totalInteractions > 10) factors.push('Relation établie');

    return factors.length > 0 ? factors : ['Profil en développement'];
  }

  calculateHistoryConsistency(history) {
    if (history.length < 3) return 10;

    const scores = history.map(h => h.engagementScore || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;

    // Consistance inversement proportionnelle à la variance
    return Math.max(0, 30 - Math.sqrt(variance));
  }

  getFrequencyRecommendation(profile) {
    const totalSent = profile.engagementHistory.totalEmailsSent;
    const relationshipDays = profile.engagementHistory.firstContact ?
      (Date.now() - profile.engagementHistory.firstContact) / (1000 * 60 * 60 * 24) : 0;

    if (relationshipDays === 0) return null;

    const currentFrequency = totalSent / (relationshipDays / 7); // emails par semaine

    let recommendation = null;

    if (profile.affinityScore > 60 && currentFrequency < 1) {
      recommendation = {
        category: 'frequency',
        priority: 'medium',
        title: 'Augmenter la fréquence',
        description: 'Journaliste engagé, peut recevoir plus de contenu',
        actions: [
          'Passer à 1-2 emails par semaine',
          'Varier les types de contenus',
          'Surveiller les signaux de fatigue'
        ],
        expectedImprovement: '10-15%'
      };
    } else if (profile.affinityScore < 30 && currentFrequency > 0.5) {
      recommendation = {
        category: 'frequency',
        priority: 'high',
        title: 'Réduire la fréquence',
        description: 'Engagement faible, risque de spam',
        actions: [
          'Passer à 1 email par mois maximum',
          'Se concentrer sur la qualité',
          'Attendre des signaux d\'intérêt'
        ],
        expectedImprovement: '20-30%'
      };
    }

    return recommendation;
  }

  extractBestPracticesFromSimilar(similarJournalists) {
    const practices = [];

    // Analyser les patterns communs
    const avgAffinityScore = similarJournalists.reduce((sum, j) => sum + j.affinityScore, 0) / similarJournalists.length;

    if (avgAffinityScore > 50) {
      practices.push('Maintenir une communication régulière mais espacée');
      practices.push('Privilégier le contenu personnalisé et pertinent');
    }

    // Analyser les horaires préférés
    const commonHours = this.findCommonPreferredHours(similarJournalists);
    if (commonHours.length > 0) {
      practices.push(`Envoyer entre ${commonHours[0]}h et ${commonHours[0] + 2}h`);
    }

    return practices;
  }

  findCommonPreferredHours(journalists) {
    const hourCounts = {};

    journalists.forEach(journalist => {
      if (journalist.bestTimeToContact && journalist.bestTimeToContact.preferredHours) {
        journalist.bestTimeToContact.preferredHours.forEach(hourData => {
          hourCounts[hourData.hour] = (hourCounts[hourData.hour] || 0) + 1;
        });
      }
    });

    return Object.entries(hourCounts)
      .filter(([hour, count]) => count >= Math.ceil(journalists.length * 0.6))
      .map(([hour]) => parseInt(hour))
      .sort();
  }

  analyzeGlobalTimePatterns(results) {
    // Analyser les patterns globaux des créneaux
    const hourlyPattern = Array(24).fill(0);
    const dailyPattern = Array(7).fill(0);

    results.forEach(result => {
      hourlyPattern[result.hour] += result.score || 0;
      dailyPattern[result.dayOfWeek - 1] += result.score || 0;
    });

    return {
      bestHours: hourlyPattern
        .map((score, hour) => ({ hour, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
      bestDays: dailyPattern
        .map((score, day) => ({ dayOfWeek: day + 1, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
      patterns: {
        morningTrend: hourlyPattern.slice(8, 12).reduce((a, b) => a + b, 0),
        afternoonTrend: hourlyPattern.slice(14, 18).reduce((a, b) => a + b, 0),
        weekdayTrend: dailyPattern.slice(1, 6).reduce((a, b) => a + b, 0),
        weekendTrend: [dailyPattern[0], dailyPattern[6]].reduce((a, b) => a + b, 0)
      }
    };
  }

  generateAITimingRecommendations(patterns) {
    const recommendations = [];

    // Recommandation principale
    if (patterns.bestHours.length > 0) {
      const bestHour = patterns.bestHours[0];
      recommendations.push({
        type: 'primary',
        title: 'Heure optimale globale',
        description: `${bestHour.hour}h présente le meilleur taux d'engagement`,
        confidence: 85,
        impact: 'high'
      });
    }

    // Recommandations secondaires
    if (patterns.patterns.morningTrend > patterns.patterns.afternoonTrend) {
      recommendations.push({
        type: 'trend',
        title: 'Préférence matinale',
        description: 'Les créneaux matinaux (8h-12h) montrent de meilleurs résultats',
        confidence: 70,
        impact: 'medium'
      });
    }

    if (patterns.patterns.weekdayTrend > patterns.patterns.weekendTrend * 2) {
      recommendations.push({
        type: 'trend',
        title: 'Éviter les week-ends',
        description: 'Les jours de semaine sont significativement plus efficaces',
        confidence: 80,
        impact: 'medium'
      });
    }

    return recommendations;
  }

  calculateTimingConfidence(results) {
    if (results.length === 0) return 20;

    // Confiance basée sur le volume de données et la consistance
    const dataVolumeScore = Math.min(40, results.length * 2);
    const totalEmails = results.reduce((sum, r) => sum + r.totalSent, 0);
    const volumeScore = Math.min(30, totalEmails / 100);

    // Mesurer la consistance des scores
    const scores = results.map(r => r.score || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const consistencyScore = Math.max(0, 30 - Math.sqrt(variance));

    return Math.min(95, dataVolumeScore + volumeScore + consistencyScore);
  }

  // Méthodes pour la prédiction de campagne

  calculateBasePrediction(similarCampaigns) {
    if (similarCampaigns.length === 0) {
      return {
        openRate: 18,
        clickRate: 12,
        responseRate: 4,
        engagementScore: 30
      };
    }

    const metrics = similarCampaigns.map(c => c.metrics);

    return {
      openRate: metrics.reduce((sum, m) => sum + (m.openRate || 0), 0) / metrics.length,
      clickRate: metrics.reduce((sum, m) => sum + (m.clickRate || 0), 0) / metrics.length,
      responseRate: metrics.reduce((sum, m) => sum + (m.responseRate || 0), 0) / metrics.length,
      engagementScore: metrics.reduce((sum, m) => sum + (m.engagementScore || 0), 0) / metrics.length
    };
  }

  analyzeSubjectLine(subject) {
    let score = 50; // Score de base

    // Longueur optimale (30-50 caractères)
    const length = subject.length;
    if (length >= 30 && length <= 50) score += 20;
    else if (length < 20 || length > 70) score -= 15;

    // Présence de mots d'action
    const actionWords = ['exclusif', 'nouveau', 'sortie', 'annonce', 'première', 'révélation'];
    if (actionWords.some(word => subject.toLowerCase().includes(word))) score += 15;

    // Éviter les mots spam
    const spamWords = ['gratuit', 'urgent', '!!!', 'promo', 'offre'];
    if (spamWords.some(word => subject.toLowerCase().includes(word))) score -= 20;

    // Personnalisation
    if (subject.includes('[') || subject.includes('{{')) score += 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        length: length >= 30 && length <= 50 ? 'optimal' : 'suboptimal',
        hasActionWords: actionWords.some(word => subject.toLowerCase().includes(word)),
        hasSpamWords: spamWords.some(word => subject.toLowerCase().includes(word)),
        isPersonalized: subject.includes('[') || subject.includes('{{')
      }
    };
  }

  analyzeEmailContent(content) {
    let score = 50;

    // Longueur (150-300 mots optimal)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 150 && wordCount <= 300) score += 15;
    else if (wordCount < 50 || wordCount > 500) score -= 10;

    // Structure (paragraphes courts)
    const paragraphs = content.split('\n\n').length;
    if (paragraphs >= 3 && paragraphs <= 6) score += 10;

    // Appel à l'action clair
    const ctaWords = ['cliquez', 'découvrez', 'écoutez', 'regardez', 'téléchargez'];
    if (ctaWords.some(word => content.toLowerCase().includes(word))) score += 15;

    // Liens inclus
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount >= 1 && linkCount <= 3) score += 10;
    else if (linkCount > 5) score -= 15;

    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        wordCount,
        paragraphs,
        hasCallToAction: ctaWords.some(word => content.toLowerCase().includes(word)),
        linkCount
      }
    };
  }

  async analyzeScheduledTiming(scheduledTime) {
    const hour = new Date(scheduledTime).getHours();
    const dayOfWeek = new Date(scheduledTime).getDay();

    let score = 50;

    // Heures optimales (9h-11h et 14h-16h)
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) score += 25;
    else if (hour < 8 || hour > 18) score -= 20;

    // Jours optimaux (Mardi-Jeudi)
    if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 20;
    else if (dayOfWeek === 0 || dayOfWeek === 6) score -= 25; // Week-end

    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        hour,
        dayOfWeek,
        isOptimalHour: (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16),
        isOptimalDay: dayOfWeek >= 2 && dayOfWeek <= 4
      }
    };
  }

  async analyzeTargetAudience(targetContacts) {
    if (!targetContacts || targetContacts.length === 0) {
      return { score: 20, factors: { size: 0, engagement: 0 } };
    }

    // Récupérer les profils d'engagement
    const contactIds = targetContacts.map(c => c.contactId);
    const profiles = await JournalistProfile.find({
      contactId: { $in: contactIds }
    });

    if (profiles.length === 0) {
      return { score: 40, factors: { size: targetContacts.length, engagement: 0 } };
    }

    // Calculer l'engagement moyen
    const avgAffinity = profiles.reduce((sum, p) => sum + (p.affinityScore || 0), 0) / profiles.length;
    const highEngagementCount = profiles.filter(p => (p.affinityScore || 0) > 50).length;

    let score = 30;

    // Taille optimale (20-100 contacts)
    if (targetContacts.length >= 20 && targetContacts.length <= 100) score += 20;
    else if (targetContacts.length > 200) score -= 15;

    // Engagement de l'audience
    score += Math.min(30, avgAffinity * 0.4);

    // Proportion d'audience engagée
    const engagementRatio = highEngagementCount / profiles.length;
    score += engagementRatio * 20;

    return {
      score: Math.max(0, Math.min(100, score)),
      factors: {
        size: targetContacts.length,
        avgAffinity,
        highEngagementRatio: engagementRatio,
        profilesAvailable: profiles.length
      }
    };
  }

  applyPredictionAdjustments(basePrediction, factors) {
    const adjustments = {
      openRate: 0,
      clickRate: 0,
      responseRate: 0,
      engagementScore: 0
    };

    // Ajustements basés sur le sujet
    const subjectMultiplier = factors.subjectScore.score / 100;
    adjustments.openRate += basePrediction.openRate * (subjectMultiplier - 1) * 0.3;

    // Ajustements basés sur le contenu
    const contentMultiplier = factors.contentScore.score / 100;
    adjustments.clickRate += basePrediction.clickRate * (contentMultiplier - 1) * 0.4;
    adjustments.responseRate += basePrediction.responseRate * (contentMultiplier - 1) * 0.3;

    // Ajustements basés sur le timing
    const timingMultiplier = factors.timingScore.score / 100;
    Object.keys(adjustments).forEach(key => {
      adjustments[key] += basePrediction[key] * (timingMultiplier - 1) * 0.2;
    });

    // Ajustements basés sur l'audience
    const audienceMultiplier = factors.audienceScore.score / 100;
    Object.keys(adjustments).forEach(key => {
      adjustments[key] += basePrediction[key] * (audienceMultiplier - 1) * 0.4;
    });

    // Appliquer les ajustements
    return {
      openRate: Math.max(5, Math.min(60, basePrediction.openRate + adjustments.openRate)),
      clickRate: Math.max(2, Math.min(40, basePrediction.clickRate + adjustments.clickRate)),
      responseRate: Math.max(1, Math.min(25, basePrediction.responseRate + adjustments.responseRate)),
      engagementScore: Math.max(10, Math.min(90, basePrediction.engagementScore + adjustments.engagementScore))
    };
  }

  calculateCampaignPredictionConfidence(similarCampaigns, prediction) {
    let confidence = 50;

    // Plus d'historique = plus de confiance
    confidence += Math.min(30, similarCampaigns.length * 3);

    // Consistance des campagnes précédentes
    if (similarCampaigns.length > 1) {
      const openRates = similarCampaigns.map(c => c.metrics.openRate || 0);
      const variance = this.calculateVariance(openRates);
      confidence += Math.max(0, 20 - variance);
    }

    return Math.min(95, Math.max(30, confidence));
  }

  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  generateCampaignOptimizationTips(factors) {
    const tips = [];

    if (factors.subjectScore.score < 70) {
      tips.push({
        category: 'subject',
        tip: 'Optimiser le sujet',
        details: factors.subjectScore.factors.length === 'suboptimal' ?
          'Viser 30-50 caractères pour le sujet' :
          'Ajouter des mots d\'action et personnaliser'
      });
    }

    if (factors.contentScore.score < 70) {
      tips.push({
        category: 'content',
        tip: 'Améliorer le contenu',
        details: 'Structurer en paragraphes courts avec un appel à l\'action clair'
      });
    }

    if (factors.timingScore.score < 70) {
      tips.push({
        category: 'timing',
        tip: 'Optimiser le timing',
        details: 'Programmer entre 9h-11h ou 14h-16h, du mardi au jeudi'
      });
    }

    if (factors.audienceScore.score < 60) {
      tips.push({
        category: 'audience',
        tip: 'Affiner l\'audience',
        details: 'Cibler des journalistes avec un meilleur historique d\'engagement'
      });
    }

    return tips;
  }

  identifyCampaignRisks(campaignData, prediction) {
    const risks = [];

    if (prediction.responseRate < 2) {
      risks.push({
        type: 'low_engagement',
        severity: 'high',
        description: 'Taux de réponse prévu très faible',
        mitigation: 'Revoir la stratégie de ciblage et personnalisation'
      });
    }

    if (campaignData.targetContacts.length > 500) {
      risks.push({
        type: 'mass_mailing',
        severity: 'medium',
        description: 'Volume d\'envoi élevé',
        mitigation: 'Segmenter en plusieurs campagnes plus petites'
      });
    }

    return risks;
  }
}

module.exports = new PredictionService();