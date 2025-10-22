const mongoose = require('mongoose');

const AnalyticsMetricSchema = new mongoose.Schema({
  // Contexte de la métrique
  type: {
    type: String,
    required: true,
    enum: [
      'campaign_performance',
      'journalist_engagement',
      'global_metrics',
      'temporal_analysis',
      'best_times',
      'sentiment_analysis',
      'roi_calculation',
      'ab_test_results'
    ],
    index: true
  },

  // Période de calcul
  period: {
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    granularity: {
      type: String,
      enum: ['hour', 'day', 'week', 'month', 'quarter', 'year'],
      default: 'day'
    }
  },

  // Références contextuelles
  references: {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      sparse: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      sparse: true,
      index: true
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      sparse: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      sparse: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true
    }
  },

  // Métriques principales
  metrics: {
    // Métriques de base
    totalSent: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    totalReplied: { type: Number, default: 0 },
    totalBounced: { type: Number, default: 0 },
    totalUnsubscribed: { type: Number, default: 0 },

    // Taux calculés
    openRate: { type: Number, default: 0, min: 0, max: 100 },
    clickRate: { type: Number, default: 0, min: 0, max: 100 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    bounceRate: { type: Number, default: 0, min: 0, max: 100 },
    unsubscribeRate: { type: Number, default: 0, min: 0, max: 100 },

    // Métriques temporelles
    averageTimeToOpen: Number, // en minutes
    averageTimeToClick: Number, // en minutes
    averageTimeToReply: Number, // en heures
    medianResponseTime: Number, // en heures

    // Scores d'engagement
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    influenceScore: { type: Number, default: 0, min: 0, max: 100 },

    // Métriques financières
    cost: Number,
    revenue: Number,
    roi: Number,
    costPerOpen: Number,
    costPerClick: Number,
    costPerReply: Number,

    // Métriques personnalisées
    customMetrics: mongoose.Schema.Types.Mixed
  },

  // Données détaillées pour visualisation
  breakdowns: {
    // Répartition par heure
    hourlyBreakdown: [{
      hour: { type: Number, min: 0, max: 23 },
      sent: Number,
      opened: Number,
      clicked: Number,
      replied: Number,
      openRate: Number,
      clickRate: Number,
      responseRate: Number
    }],

    // Répartition par jour de la semaine
    dailyBreakdown: [{
      dayOfWeek: { type: Number, min: 1, max: 7 }, // 1 = Lundi
      sent: Number,
      opened: Number,
      clicked: Number,
      replied: Number,
      openRate: Number,
      clickRate: Number,
      responseRate: Number
    }],

    // Répartition par type de média
    mediaBreakdown: [{
      mediaType: String,
      count: Number,
      openRate: Number,
      clickRate: Number,
      responseRate: Number,
      engagementScore: Number
    }],

    // Répartition géographique
    geographicBreakdown: [{
      country: String,
      region: String,
      count: Number,
      openRate: Number,
      clickRate: Number,
      responseRate: Number
    }],

    // Répartition par appareil
    deviceBreakdown: [{
      deviceType: String,
      count: Number,
      openRate: Number,
      clickRate: Number
    }]
  },

  // Comparaisons avec périodes précédentes
  comparisons: {
    previousPeriod: {
      startDate: Date,
      endDate: Date,
      metrics: mongoose.Schema.Types.Mixed,
      changes: {
        openRate: { absolute: Number, percentage: Number },
        clickRate: { absolute: Number, percentage: Number },
        responseRate: { absolute: Number, percentage: Number },
        engagementScore: { absolute: Number, percentage: Number }
      }
    },
    previousYear: {
      startDate: Date,
      endDate: Date,
      metrics: mongoose.Schema.Types.Mixed,
      changes: mongoose.Schema.Types.Mixed
    },
    benchmark: {
      industry: String,
      industryAverage: mongoose.Schema.Types.Mixed,
      performanceVsBenchmark: mongoose.Schema.Types.Mixed
    }
  },

  // Insights et recommandations automatiques
  insights: [{
    type: {
      type: String,
      enum: ['trend', 'anomaly', 'opportunity', 'warning', 'success'],
      required: true
    },
    title: String,
    description: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    actionable: Boolean,
    recommendations: [String],
    metadata: mongoose.Schema.Types.Mixed
  }],

  // Données pour machine learning
  mlData: {
    features: [Number], // Vecteur de features pour ML
    predictions: {
      nextPeriodOpenRate: Number,
      nextPeriodClickRate: Number,
      nextPeriodResponseRate: Number,
      confidence: Number
    },
    clusters: {
      segment: String,
      similarity: Number
    },
    anomalies: [{
      metric: String,
      value: Number,
      expected: Number,
      deviation: Number,
      severity: String
    }]
  },

  // Métadonnées de calcul
  calculation: {
    version: {
      type: String,
      default: '1.0'
    },
    algorithm: String,
    parameters: mongoose.Schema.Types.Mixed,
    computedAt: {
      type: Date,
      default: Date.now
    },
    computedBy: {
      type: String,
      default: 'system'
    },
    executionTime: Number, // en millisecondes
    dataQuality: {
      completeness: Number, // % de données complètes
      accuracy: Number, // % de données validées
      freshness: Number // âge des données en heures
    }
  },

  // Statut et validité
  status: {
    type: String,
    enum: ['calculating', 'completed', 'error', 'expired'],
    default: 'calculating',
    index: true
  },
  validUntil: {
    type: Date,
    index: true
  },
  errorMessage: String,

  // Tags et métadonnées
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private', 'team'],
    default: 'private'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'analytics_metrics'
});

// Index composés pour optimiser les requêtes
AnalyticsMetricSchema.index({ type: 1, 'period.startDate': -1 });
AnalyticsMetricSchema.index({ 'references.campaignId': 1, type: 1 });
AnalyticsMetricSchema.index({ 'references.contactId': 1, type: 1 });
AnalyticsMetricSchema.index({ status: 1, validUntil: 1 });
AnalyticsMetricSchema.index({ tags: 1 });
AnalyticsMetricSchema.index({ 'calculation.computedAt': -1 });

// Méthodes statiques
AnalyticsMetricSchema.statics.getCachedMetric = async function(type, filters = {}, maxAge = 3600000) {
  const query = {
    type,
    status: 'completed',
    validUntil: { $gt: new Date() }
  };

  // Ajouter les filtres de référence
  Object.keys(filters).forEach(key => {
    if (filters[key] && key.startsWith('references.')) {
      query[key] = filters[key];
    }
  });

  // Chercher une métrique récente
  if (filters.startDate && filters.endDate) {
    query['period.startDate'] = { $lte: filters.startDate };
    query['period.endDate'] = { $gte: filters.endDate };
  }

  return this.findOne(query)
    .sort({ 'calculation.computedAt': -1 })
    .lean();
};

AnalyticsMetricSchema.statics.getMetricTrends = async function(type, period = '30d', granularity = 'day') {
  const endDate = new Date();
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

  return this.find({
    type,
    status: 'completed',
    'period.granularity': granularity,
    'period.startDate': { $gte: startDate, $lte: endDate }
  })
    .sort({ 'period.startDate': 1 })
    .select('period metrics')
    .lean();
};

AnalyticsMetricSchema.statics.getTopPerformers = async function(metric = 'openRate', limit = 10, period = '30d') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period.replace('d', '')));

  return this.find({
    type: 'campaign_performance',
    status: 'completed',
    'period.startDate': { $gte: startDate },
    [`metrics.${metric}`]: { $gt: 0 }
  })
    .sort({ [`metrics.${metric}`]: -1 })
    .limit(limit)
    .populate('references.campaignId', 'name subject')
    .populate('references.artistId', 'name')
    .select('metrics references period')
    .lean();
};

AnalyticsMetricSchema.statics.getBenchmarkData = async function(type, industry = 'music') {
  const pipeline = [
    {
      $match: {
        type,
        status: 'completed',
        'comparisons.benchmark.industry': industry,
        'period.startDate': { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: null,
        avgOpenRate: { $avg: '$metrics.openRate' },
        avgClickRate: { $avg: '$metrics.clickRate' },
        avgResponseRate: { $avg: '$metrics.responseRate' },
        avgEngagementScore: { $avg: '$metrics.engagementScore' },
        p25OpenRate: { $percentile: { input: '$metrics.openRate', p: [0.25], method: 'approximate' } },
        p50OpenRate: { $percentile: { input: '$metrics.openRate', p: [0.5], method: 'approximate' } },
        p75OpenRate: { $percentile: { input: '$metrics.openRate', p: [0.75], method: 'approximate' } },
        p90OpenRate: { $percentile: { input: '$metrics.openRate', p: [0.9], method: 'approximate' } }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

// Méthodes d'instance
AnalyticsMetricSchema.methods.generateInsights = function() {
  const insights = [];
  const { metrics, comparisons } = this;

  // Insight sur l'amélioration/dégradation vs période précédente
  if (comparisons.previousPeriod && comparisons.previousPeriod.changes) {
    const changes = comparisons.previousPeriod.changes;

    if (changes.openRate && Math.abs(changes.openRate.percentage) > 10) {
      insights.push({
        type: changes.openRate.percentage > 0 ? 'success' : 'warning',
        title: `Taux d'ouverture ${changes.openRate.percentage > 0 ? 'en hausse' : 'en baisse'}`,
        description: `${changes.openRate.percentage > 0 ? '+' : ''}${changes.openRate.percentage.toFixed(1)}% par rapport à la période précédente`,
        impact: Math.abs(changes.openRate.percentage) > 20 ? 'high' : 'medium',
        confidence: 85,
        actionable: changes.openRate.percentage < 0,
        recommendations: changes.openRate.percentage < 0 ? [
          'Optimiser les sujets d\'emails',
          'Tester différents horaires d\'envoi',
          'Segmenter davantage votre audience'
        ] : [
          'Reproduire cette approche',
          'Identifier les facteurs de succès'
        ]
      });
    }

    if (changes.responseRate && Math.abs(changes.responseRate.percentage) > 15) {
      insights.push({
        type: changes.responseRate.percentage > 0 ? 'success' : 'warning',
        title: `Taux de réponse ${changes.responseRate.percentage > 0 ? 'en progression' : 'en régression'}`,
        description: `${changes.responseRate.percentage > 0 ? '+' : ''}${changes.responseRate.percentage.toFixed(1)}% par rapport à la période précédente`,
        impact: 'high',
        confidence: 90,
        actionable: true,
        recommendations: changes.responseRate.percentage < 0 ? [
          'Personnaliser davantage le contenu',
          'Améliorer la pertinence du message',
          'Revoir le timing d\'envoi'
        ] : [
          'Analyser les facteurs de succès',
          'Appliquer la même stratégie',
          'Documenter les bonnes pratiques'
        ]
      });
    }
  }

  // Insight sur les performances exceptionnelles
  if (metrics.openRate > 30) {
    insights.push({
      type: 'success',
      title: 'Taux d\'ouverture exceptionnel',
      description: `${metrics.openRate.toFixed(1)}% d'ouverture, bien au-dessus de la moyenne`,
      impact: 'medium',
      confidence: 95,
      actionable: true,
      recommendations: [
        'Analyser les sujets qui fonctionnent',
        'Reproduire cette approche',
        'Partager avec l\'équipe'
      ]
    });
  }

  if (metrics.responseRate > 8) {
    insights.push({
      type: 'success',
      title: 'Excellent taux de réponse',
      description: `${metrics.responseRate.toFixed(1)}% de réponses, performance remarquable`,
      impact: 'high',
      confidence: 95,
      actionable: true,
      recommendations: [
        'Documenter cette approche',
        'Former l\'équipe sur ces techniques',
        'Créer un template basé sur ce succès'
      ]
    });
  }

  // Insight sur les anomalies ML
  if (this.mlData && this.mlData.anomalies && this.mlData.anomalies.length > 0) {
    this.mlData.anomalies.forEach(anomaly => {
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        insights.push({
          type: 'anomaly',
          title: `Anomalie détectée: ${anomaly.metric}`,
          description: `Valeur observée (${anomaly.value}) très différente de l'attendu (${anomaly.expected})`,
          impact: anomaly.severity === 'critical' ? 'critical' : 'high',
          confidence: 80,
          actionable: true,
          recommendations: [
            'Vérifier la qualité des données',
            'Analyser les facteurs externes',
            'Ajuster la stratégie si nécessaire'
          ],
          metadata: { anomaly }
        });
      }
    });
  }

  this.insights = insights;
  return insights;
};

AnalyticsMetricSchema.methods.calculateComparisons = async function(previousPeriod, previousYear) {
  if (previousPeriod) {
    const changes = {};
    ['openRate', 'clickRate', 'responseRate', 'engagementScore'].forEach(metric => {
      if (this.metrics[metric] !== undefined && previousPeriod.metrics[metric] !== undefined) {
        const current = this.metrics[metric];
        const previous = previousPeriod.metrics[metric];

        changes[metric] = {
          absolute: current - previous,
          percentage: previous !== 0 ? ((current - previous) / previous) * 100 : 0
        };
      }
    });

    this.comparisons.previousPeriod = {
      startDate: previousPeriod.period.startDate,
      endDate: previousPeriod.period.endDate,
      metrics: previousPeriod.metrics,
      changes
    };
  }

  if (previousYear) {
    const changes = {};
    ['openRate', 'clickRate', 'responseRate', 'engagementScore'].forEach(metric => {
      if (this.metrics[metric] !== undefined && previousYear.metrics[metric] !== undefined) {
        const current = this.metrics[metric];
        const previous = previousYear.metrics[metric];

        changes[metric] = {
          absolute: current - previous,
          percentage: previous !== 0 ? ((current - previous) / previous) * 100 : 0
        };
      }
    });

    this.comparisons.previousYear = {
      startDate: previousYear.period.startDate,
      endDate: previousYear.period.endDate,
      metrics: previousYear.metrics,
      changes
    };
  }
};

AnalyticsMetricSchema.methods.setValidityPeriod = function(hours = 24) {
  this.validUntil = new Date(Date.now() + (hours * 60 * 60 * 1000));
};

AnalyticsMetricSchema.methods.isExpired = function() {
  return this.validUntil && new Date() > this.validUntil;
};

module.exports = mongoose.model('AnalyticsMetric', AnalyticsMetricSchema);