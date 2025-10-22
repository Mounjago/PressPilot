const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CampaignSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Référence au projet et artiste
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Contenu de la campagne
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String
  },

  // Paramètres d'envoi
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft',
    index: true
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },

  // Liste des contacts ciblés
  targetContacts: [{
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    errorMessage: String
  }],

  // Pièces jointes
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],

  // Paramètres de tracking
  trackingEnabled: {
    type: Boolean,
    default: true
  },
  trackingPixelId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Métriques de performance en temps réel (cache)
  metrics: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalDelivered: {
      type: Number,
      default: 0
    },
    totalOpened: {
      type: Number,
      default: 0
    },
    totalClicked: {
      type: Number,
      default: 0
    },
    totalReplied: {
      type: Number,
      default: 0
    },
    totalBounced: {
      type: Number,
      default: 0
    },
    totalUnsubscribed: {
      type: Number,
      default: 0
    },

    // Taux calculés
    deliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // Métriques avancées
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageTimeToOpen: Number, // en minutes
    averageTimeToClick: Number, // en minutes
    averageTimeToReply: Number, // en heures

    // Dernière mise à jour des métriques
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Configuration A/B Testing
  abTesting: {
    enabled: {
      type: Boolean,
      default: false
    },
    variants: [{
      name: String,
      subject: String,
      content: String,
      percentage: Number, // % du traffic
      metrics: {
        sent: Number,
        opened: Number,
        clicked: Number,
        replied: Number,
        openRate: Number,
        clickRate: Number,
        responseRate: Number
      }
    }],
    winningVariant: String
  },

  // Objectifs et KPIs
  goals: {
    targetOpenRate: Number,
    targetClickRate: Number,
    targetResponseRate: Number,
    targetReplies: Number,
    budget: Number,
    costPerReply: Number
  },

  // Segmentation et ciblage
  targeting: {
    segments: [String], // Segments de journalistes ciblés
    mediaTypes: [String],
    regions: [String],
    excludedContacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }]
  },

  // Données pour l'optimisation IA
  aiOptimization: {
    enabled: {
      type: Boolean,
      default: false
    },
    optimizedSubject: String,
    optimizedSendTime: Date,
    optimizedContent: String,
    predictions: {
      expectedOpenRate: Number,
      expectedClickRate: Number,
      expectedResponseRate: Number,
      confidence: Number
    },
    recommendations: [{
      type: String, // 'subject', 'timing', 'content', 'targeting'
      suggestion: String,
      reasoning: String,
      expectedImprovement: Number
    }]
  },

  // Métadonnées
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Index pour optimiser les requêtes
CampaignSchema.index({ status: 1, scheduledAt: 1 });
CampaignSchema.index({ projectId: 1, createdAt: -1 });
CampaignSchema.index({ artistId: 1, createdAt: -1 });
CampaignSchema.index({ createdBy: 1, status: 1 });
CampaignSchema.index({ 'metrics.openRate': -1 });
CampaignSchema.index({ 'metrics.responseRate': -1 });

// Plugin de pagination
CampaignSchema.plugin(mongoosePaginate);

// Méthodes statiques
CampaignSchema.statics.getPerformanceLeaderboard = async function(limit = 10, metric = 'responseRate') {
  const sortField = {};
  sortField[`metrics.${metric}`] = -1;

  return this.find({
    status: 'sent',
    'metrics.totalSent': { $gt: 0 }
  })
    .sort(sortField)
    .limit(limit)
    .populate('artistId', 'name')
    .populate('projectId', 'title')
    .select('name metrics subject sentAt')
    .lean();
};

CampaignSchema.statics.getAggregatedMetrics = async function(filters = {}) {
  const matchStage = { status: 'sent' };

  // Ajouter les filtres
  if (filters.startDate || filters.endDate) {
    matchStage.sentAt = {};
    if (filters.startDate) matchStage.sentAt.$gte = filters.startDate;
    if (filters.endDate) matchStage.sentAt.$lte = filters.endDate;
  }

  if (filters.artistId) matchStage.artistId = filters.artistId;
  if (filters.projectId) matchStage.projectId = filters.projectId;

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        totalSent: { $sum: '$metrics.totalSent' },
        totalOpened: { $sum: '$metrics.totalOpened' },
        totalClicked: { $sum: '$metrics.totalClicked' },
        totalReplied: { $sum: '$metrics.totalReplied' },
        totalBounced: { $sum: '$metrics.totalBounced' },
        avgOpenRate: { $avg: '$metrics.openRate' },
        avgClickRate: { $avg: '$metrics.clickRate' },
        avgResponseRate: { $avg: '$metrics.responseRate' },
        avgEngagementScore: { $avg: '$metrics.engagementScore' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalCampaigns: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalBounced: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    avgResponseRate: 0,
    avgEngagementScore: 0
  };
};

CampaignSchema.statics.getTemporalMetrics = async function(period = '30d', groupBy = 'day') {
  const startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  let groupFormat;
  switch (groupBy) {
    case 'hour':
      groupFormat = { $dateToString: { format: '%Y-%m-%d-%H', date: '$sentAt' } };
      break;
    case 'day':
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } };
      break;
    case 'week':
      groupFormat = { $dateToString: { format: '%Y-W%U', date: '$sentAt' } };
      break;
    case 'month':
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$sentAt' } };
      break;
  }

  const pipeline = [
    {
      $match: {
        status: 'sent',
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupFormat,
        campaigns: { $sum: 1 },
        totalSent: { $sum: '$metrics.totalSent' },
        totalOpened: { $sum: '$metrics.totalOpened' },
        totalClicked: { $sum: '$metrics.totalClicked' },
        totalReplied: { $sum: '$metrics.totalReplied' },
        avgOpenRate: { $avg: '$metrics.openRate' },
        avgClickRate: { $avg: '$metrics.clickRate' },
        avgResponseRate: { $avg: '$metrics.responseRate' }
      }
    },
    { $sort: { _id: 1 } }
  ];

  return this.aggregate(pipeline);
};

// Méthodes d'instance
CampaignSchema.methods.updateMetrics = async function() {
  const EmailTracking = mongoose.model('EmailTracking');

  const metrics = await EmailTracking.getCampaignMetrics(
    this._id,
    this.sentAt || new Date(0),
    new Date()
  );

  // Mise à jour des compteurs
  this.metrics.totalSent = metrics.totalSent;
  this.metrics.totalOpened = metrics.totalOpened;
  this.metrics.totalClicked = metrics.totalClicked;
  this.metrics.totalReplied = metrics.totalReplied;
  this.metrics.totalBounced = metrics.totalBounced;

  // Calcul des taux
  if (this.metrics.totalSent > 0) {
    this.metrics.deliveryRate = ((this.metrics.totalSent - this.metrics.totalBounced) / this.metrics.totalSent) * 100;
    this.metrics.openRate = (this.metrics.totalOpened / this.metrics.totalSent) * 100;
    this.metrics.responseRate = (this.metrics.totalReplied / this.metrics.totalSent) * 100;
  }

  if (this.metrics.totalOpened > 0) {
    this.metrics.clickRate = (this.metrics.totalClicked / this.metrics.totalOpened) * 100;
  }

  // Score d'engagement
  this.metrics.engagementScore = this.calculateEngagementScore();

  this.metrics.lastUpdated = new Date();
  return this.metrics;
};

CampaignSchema.methods.calculateEngagementScore = function() {
  const { metrics } = this;

  if (metrics.totalSent === 0) return 0;

  let score = 0;

  // Poids des différentes métriques
  score += (metrics.openRate * 0.3);      // 30% pour les ouvertures
  score += (metrics.clickRate * 0.3);     // 30% pour les clics
  score += (metrics.responseRate * 0.4);  // 40% pour les réponses

  return Math.min(100, Math.max(0, score));
};

CampaignSchema.methods.getROI = function() {
  const { goals, metrics } = this;

  if (!goals.budget || goals.budget === 0) {
    return null;
  }

  // ROI basé sur le coût par réponse
  const actualCostPerReply = metrics.totalReplied > 0 ? goals.budget / metrics.totalReplied : goals.budget;
  const targetCostPerReply = goals.costPerReply || 50; // Valeur par défaut

  const roi = ((targetCostPerReply - actualCostPerReply) / actualCostPerReply) * 100;

  return {
    roi,
    actualCostPerReply,
    targetCostPerReply,
    totalInvestment: goals.budget,
    totalReplies: metrics.totalReplied
  };
};

CampaignSchema.methods.addAIRecommendation = function(type, suggestion, reasoning, expectedImprovement) {
  if (!this.aiOptimization.recommendations) {
    this.aiOptimization.recommendations = [];
  }

  this.aiOptimization.recommendations.push({
    type,
    suggestion,
    reasoning,
    expectedImprovement
  });

  // Garder seulement les 5 dernières recommandations
  if (this.aiOptimization.recommendations.length > 5) {
    this.aiOptimization.recommendations = this.aiOptimization.recommendations.slice(-5);
  }
};

CampaignSchema.methods.getPerformanceInsights = function() {
  const { metrics, goals } = this;
  const insights = [];

  // Comparaison avec les objectifs
  if (goals.targetOpenRate && metrics.openRate < goals.targetOpenRate) {
    insights.push({
      type: 'warning',
      metric: 'openRate',
      message: `Taux d'ouverture en dessous de l'objectif (${metrics.openRate.toFixed(1)}% vs ${goals.targetOpenRate}%)`,
      suggestion: 'Optimisez le sujet de vos emails pour améliorer le taux d\'ouverture'
    });
  }

  if (goals.targetResponseRate && metrics.responseRate < goals.targetResponseRate) {
    insights.push({
      type: 'warning',
      metric: 'responseRate',
      message: `Taux de réponse en dessous de l'objectif (${metrics.responseRate.toFixed(1)}% vs ${goals.targetResponseRate}%)`,
      suggestion: 'Personnalisez davantage le contenu pour améliorer l\'engagement'
    });
  }

  // Insights positifs
  if (metrics.openRate > 25) {
    insights.push({
      type: 'success',
      metric: 'openRate',
      message: `Excellent taux d'ouverture (${metrics.openRate.toFixed(1)}%)`,
      suggestion: 'Continuez avec ce type de sujet'
    });
  }

  if (metrics.responseRate > 10) {
    insights.push({
      type: 'success',
      metric: 'responseRate',
      message: `Très bon taux de réponse (${metrics.responseRate.toFixed(1)}%)`,
      suggestion: 'Reproduisez cette approche dans vos prochaines campagnes'
    });
  }

  return insights;
};

module.exports = mongoose.model('Campaign', CampaignSchema);