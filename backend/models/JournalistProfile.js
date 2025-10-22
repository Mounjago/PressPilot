const mongoose = require('mongoose');

const JournalistProfileSchema = new mongoose.Schema({
  // Référence au contact
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    unique: true,
    index: true
  },

  // Scores d'engagement
  affinityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  influenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  reliabilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  globalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Meilleurs moments pour contacter
  bestTimeToContact: {
    preferredHours: [{
      hour: { type: Number, min: 0, max: 23 },
      score: { type: Number, min: 0, max: 100 }
    }],
    preferredDays: [{
      dayOfWeek: { type: Number, min: 1, max: 7 }, // 1 = Lundi
      score: { type: Number, min: 0, max: 100 }
    }],
    timezone: {
      type: String,
      default: 'Europe/Paris'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Historique d'engagement
  engagementHistory: {
    totalEmailsSent: { type: Number, default: 0 },
    totalEmailsOpened: { type: Number, default: 0 },
    totalEmailsClicked: { type: Number, default: 0 },
    totalEmailsReplied: { type: Number, default: 0 },

    averageOpenRate: { type: Number, default: 0 },
    averageClickRate: { type: Number, default: 0 },
    averageResponseRate: { type: Number, default: 0 },

    lastEngagement: Date,
    firstContact: Date,

    // Évolution mensuelle
    monthlyMetrics: [{
      month: String, // Format: 'YYYY-MM'
      sent: Number,
      opened: Number,
      clicked: Number,
      replied: Number,
      openRate: Number,
      clickRate: Number,
      responseRate: Number
    }]
  },

  // Préférences et patterns
  topicPreferences: [{
    topic: String,
    engagementScore: Number,
    frequency: Number, // Nombre de fois mentionné
    lastMentioned: Date
  }],

  // Patterns de réponse
  responsePatterns: {
    averageResponseTime: Number, // en heures
    fastestResponse: Number, // en minutes
    slowestResponse: Number, // en heures
    responseTimeDistribution: [{
      range: String, // '0-1h', '1-6h', '6-24h', '1-7d', '>7d'
      count: Number,
      percentage: Number
    }],
    commonResponseWords: [{
      word: String,
      frequency: Number
    }],
    sentimentAnalysis: {
      positive: Number,
      neutral: Number,
      negative: Number
    }
  },

  // Métriques d'influence
  influenceMetrics: {
    estimatedReach: Number, // Audience estimée
    socialMediaFollowers: {
      twitter: Number,
      linkedin: Number,
      instagram: Number,
      total: Number
    },
    publicationFrequency: Number, // Articles par mois
    averageShares: Number,
    kloutScore: Number,
    mediaAuthority: {
      type: String,
      enum: ['low', 'medium', 'high', 'expert'],
      default: 'medium'
    }
  },

  // Préférences de communication
  communicationPreferences: {
    preferredChannel: {
      type: String,
      enum: ['email', 'phone', 'social', 'in-person'],
      default: 'email'
    },
    formatPreference: {
      type: String,
      enum: ['short', 'detailed', 'bullet-points', 'multimedia'],
      default: 'detailed'
    },
    followUpTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    exclusionPeriods: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },

  // Données pour ML
  mlFeatures: {
    engagementVector: [Number], // Vecteur d'engagement pour clustering
    similarityCluster: String, // ID du cluster de similarité
    predictionConfidence: Number,
    lastModelUpdate: Date,
    customSegments: [String] // Segments personnalisés
  },

  // Métadonnées
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  calculationVersion: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'journalist_profiles'
});

// Index pour optimiser les requêtes
JournalistProfileSchema.index({ affinityScore: -1 });
JournalistProfileSchema.index({ influenceScore: -1 });
JournalistProfileSchema.index({ globalScore: -1 });
JournalistProfileSchema.index({ 'engagementHistory.lastEngagement': -1 });
JournalistProfileSchema.index({ 'mlFeatures.similarityCluster': 1 });

// Méthodes statiques
JournalistProfileSchema.statics.getTopPerformers = async function(limit = 10, scoreType = 'globalScore') {
  const sortField = {};
  sortField[scoreType] = -1;

  return this.find({ isActive: true })
    .sort(sortField)
    .limit(limit)
    .populate('contactId', 'firstName lastName email media position')
    .lean();
};

JournalistProfileSchema.statics.findSimilarJournalists = async function(contactId, limit = 5) {
  const profile = await this.findOne({ contactId });
  if (!profile || !profile.mlFeatures.similarityCluster) {
    return [];
  }

  return this.find({
    'mlFeatures.similarityCluster': profile.mlFeatures.similarityCluster,
    contactId: { $ne: contactId },
    isActive: true
  })
    .sort({ globalScore: -1 })
    .limit(limit)
    .populate('contactId', 'firstName lastName email media')
    .lean();
};

JournalistProfileSchema.statics.getEngagementTrends = async function(period = '6months') {
  const startDate = new Date();

  switch (period) {
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const monthsToInclude = [];
  const current = new Date(startDate);
  while (current <= new Date()) {
    monthsToInclude.push(current.toISOString().substring(0, 7));
    current.setMonth(current.getMonth() + 1);
  }

  const pipeline = [
    { $match: { isActive: true } },
    { $unwind: '$engagementHistory.monthlyMetrics' },
    {
      $match: {
        'engagementHistory.monthlyMetrics.month': { $in: monthsToInclude }
      }
    },
    {
      $group: {
        _id: '$engagementHistory.monthlyMetrics.month',
        avgOpenRate: { $avg: '$engagementHistory.monthlyMetrics.openRate' },
        avgClickRate: { $avg: '$engagementHistory.monthlyMetrics.clickRate' },
        avgResponseRate: { $avg: '$engagementHistory.monthlyMetrics.responseRate' },
        totalSent: { $sum: '$engagementHistory.monthlyMetrics.sent' },
        totalOpened: { $sum: '$engagementHistory.monthlyMetrics.opened' },
        totalClicked: { $sum: '$engagementHistory.monthlyMetrics.clicked' },
        totalReplied: { $sum: '$engagementHistory.monthlyMetrics.replied' },
        journalistCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];

  return this.aggregate(pipeline);
};

// Méthodes d'instance
JournalistProfileSchema.methods.calculateAffinityScore = function() {
  const { engagementHistory } = this;

  if (engagementHistory.totalEmailsSent === 0) {
    this.affinityScore = 0;
    return 0;
  }

  let score = 0;

  // Score basé sur les taux d'engagement (70% du score)
  const openWeight = 0.3;
  const clickWeight = 0.4;
  const responseWeight = 0.3;

  score += (engagementHistory.averageOpenRate * openWeight);
  score += (engagementHistory.averageClickRate * clickWeight);
  score += (engagementHistory.averageResponseRate * responseWeight);

  // Bonus pour la consistance (15% du score)
  const consistencyBonus = this.calculateConsistencyBonus();
  score += (consistencyBonus * 0.15);

  // Bonus pour la récence (15% du score)
  const recencyBonus = this.calculateRecencyBonus();
  score += (recencyBonus * 0.15);

  this.affinityScore = Math.min(100, Math.max(0, score));
  return this.affinityScore;
};

JournalistProfileSchema.methods.calculateInfluenceScore = function() {
  const { influenceMetrics } = this;
  let score = 0;

  // Score basé sur la portée (40%)
  if (influenceMetrics.estimatedReach) {
    score += Math.min(40, (influenceMetrics.estimatedReach / 100000) * 40);
  }

  // Score basé sur les réseaux sociaux (30%)
  if (influenceMetrics.socialMediaFollowers.total) {
    score += Math.min(30, (influenceMetrics.socialMediaFollowers.total / 50000) * 30);
  }

  // Score basé sur l'autorité du média (30%)
  switch (influenceMetrics.mediaAuthority) {
    case 'expert':
      score += 30;
      break;
    case 'high':
      score += 22;
      break;
    case 'medium':
      score += 15;
      break;
    case 'low':
      score += 8;
      break;
  }

  this.influenceScore = Math.min(100, score);
  return this.influenceScore;
};

JournalistProfileSchema.methods.calculateGlobalScore = function() {
  // Pondération : 50% affinité, 30% influence, 20% fiabilité
  this.globalScore = (
    (this.affinityScore * 0.5) +
    (this.influenceScore * 0.3) +
    (this.reliabilityScore * 0.2)
  );

  return this.globalScore;
};

JournalistProfileSchema.methods.calculateConsistencyBonus = function() {
  const { monthlyMetrics } = this.engagementHistory;

  if (monthlyMetrics.length < 3) return 0;

  // Calculer la variance des taux d'engagement
  const responsRates = monthlyMetrics.map(m => m.responseRate || 0);
  const mean = responsRates.reduce((a, b) => a + b, 0) / responsRates.length;
  const variance = responsRates.reduce((acc, rate) => acc + Math.pow(rate - mean, 2), 0) / responsRates.length;

  // Moins de variance = plus de consistance = plus de points
  return Math.max(0, 100 - (variance * 2));
};

JournalistProfileSchema.methods.calculateRecencyBonus = function() {
  if (!this.engagementHistory.lastEngagement) return 0;

  const daysSinceLastEngagement = (Date.now() - this.engagementHistory.lastEngagement) / (1000 * 60 * 60 * 24);

  if (daysSinceLastEngagement < 7) return 100;
  if (daysSinceLastEngagement < 30) return 80;
  if (daysSinceLastEngagement < 90) return 60;
  if (daysSinceLastEngagement < 180) return 40;
  return 20;
};

JournalistProfileSchema.methods.updateEngagementHistory = async function() {
  const EmailTracking = mongoose.model('EmailTracking');

  // Récupérer les données d'engagement
  const engagementData = await EmailTracking.aggregate([
    { $match: { contactId: this.contactId } },
    {
      $group: {
        _id: null,
        totalSent: { $sum: 1 },
        totalOpened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
        totalClicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
        totalReplied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } },
        firstContact: { $min: '$sentAt' },
        lastEngagement: { $max: {
          $cond: [
            { $ne: ['$repliedAt', null] }, '$repliedAt',
            { $cond: [
              { $ne: ['$clickedAt', null] }, '$clickedAt',
              { $cond: [{ $ne: ['$openedAt', null] }, '$openedAt', '$sentAt'] }
            ]}
          ]
        }}
      }
    }
  ]);

  if (engagementData.length > 0) {
    const data = engagementData[0];

    this.engagementHistory.totalEmailsSent = data.totalSent;
    this.engagementHistory.totalEmailsOpened = data.totalOpened;
    this.engagementHistory.totalEmailsClicked = data.totalClicked;
    this.engagementHistory.totalEmailsReplied = data.totalReplied;

    this.engagementHistory.averageOpenRate = data.totalSent > 0 ? (data.totalOpened / data.totalSent) * 100 : 0;
    this.engagementHistory.averageClickRate = data.totalOpened > 0 ? (data.totalClicked / data.totalOpened) * 100 : 0;
    this.engagementHistory.averageResponseRate = data.totalSent > 0 ? (data.totalReplied / data.totalSent) * 100 : 0;

    this.engagementHistory.firstContact = data.firstContact;
    this.engagementHistory.lastEngagement = data.lastEngagement;
  }

  // Recalculer les scores
  this.calculateAffinityScore();
  this.calculateInfluenceScore();
  this.calculateGlobalScore();

  this.lastCalculated = new Date();
};

JournalistProfileSchema.methods.getBestContactTime = function() {
  const { bestTimeToContact } = this;

  if (!bestTimeToContact.preferredHours.length || !bestTimeToContact.preferredDays.length) {
    return null;
  }

  // Trouver la meilleure heure et le meilleur jour
  const bestHour = bestTimeToContact.preferredHours.reduce((max, current) =>
    current.score > max.score ? current : max
  );

  const bestDay = bestTimeToContact.preferredDays.reduce((max, current) =>
    current.score > max.score ? current : max
  );

  return {
    hour: bestHour.hour,
    dayOfWeek: bestDay.dayOfWeek,
    confidence: (bestHour.score + bestDay.score) / 2,
    timezone: bestTimeToContact.timezone
  };
};

module.exports = mongoose.model('JournalistProfile', JournalistProfileSchema);