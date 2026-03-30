/**
 * MODÈLE CONTACT - JOURNALISTES ET MÉDIAS
 * Gestion complète des contacts journalistiques avec historique d'engagement
 */

const mongoose = require('mongoose');
const { INTERFACES_LIST, CONTACT_VISIBILITY_LIST } = require('../constants/roles');

const ContactSchema = new mongoose.Schema({
  // Informations personnelles
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Format email invalide'
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },

  // Informations professionnelles
  jobTitle: {
    type: String,
    trim: true,
    maxlength: 200
  },
  media: {
    name: {
      type: String,
      trim: true,
      maxlength: 200
    },
    type: {
      type: String,
      enum: ['journal', 'magazine', 'radio', 'tv', 'web', 'blog', 'podcast', 'influencer', 'autre'],
      default: 'web'
    },
    reach: {
      type: String,
      enum: ['local', 'regional', 'national', 'international'],
      default: 'national'
    },
    website: {
      type: String,
      trim: true
    }
  },

  // Spécialisations et centres d'intérêt
  specializations: [{
    type: String,
    enum: [
      'pop', 'rock', 'rap', 'hip-hop', 'electro', 'jazz', 'classique',
      'reggae', 'blues', 'folk', 'metal', 'punk', 'indie', 'alternative',
      'world-music', 'chanson-francaise', 'variete', 'autre'
    ]
  }],

  interests: [{
    type: String,
    enum: [
      'nouveautes', 'interviews', 'chroniques', 'lives', 'festivals',
      'portraits', 'decouvertes', 'actualites', 'critiques', 'playlists'
    ]
  }],

  // Préférences de communication
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'social'],
    default: 'email'
  },
  bestTimeToContact: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'flexible'],
    default: 'flexible'
  },
  communicationFrequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'occasional'],
    default: 'monthly'
  },

  // Localisation
  location: {
    city: String,
    country: {
      type: String,
      default: 'France'
    },
    timezone: {
      type: String,
      default: 'Europe/Paris'
    }
  },

  // Réseaux sociaux
  socialMedia: {
    twitter: String,
    instagram: String,
    linkedin: String,
    facebook: String,
    youtube: String
  },

  // Statut et engagement
  status: {
    type: String,
    enum: ['active', 'inactive', 'unsubscribed', 'bounced'],
    default: 'active',
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastContactDate: {
    type: Date,
    index: true
  },

  // Score d'engagement (calculé automatiquement)
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },

  // Métriques d'historique
  emailMetrics: {
    totalReceived: {
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
    lastOpenedAt: Date,
    lastClickedAt: Date,
    lastRepliedAt: Date,

    // Taux calculés
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
    }
  },

  // Données pour l'optimisation IA
  aiInsights: {
    bestSendDay: {
      type: Number,
      min: 0,
      max: 6 // 0 = Dimanche, 6 = Samedi
    },
    bestSendHour: {
      type: Number,
      min: 0,
      max: 23
    },
    preferredContentType: String,
    engagement_pattern: String,
    lastAnalyzedAt: Date
  },

  // Notes et commentaires
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['general', 'preference', 'warning', 'success'],
      default: 'general'
    }
  }],

  // Tags personnalisables
  tags: [String],

  // Campagnes associées
  campaigns: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    participatedAt: Date,
    status: String
  }],

  // Workspace / Multi-interface
  visibility: {
    type: String,
    enum: CONTACT_VISIBILITY_LIST,
    default: 'private',
    index: true
  },
  interface: {
    type: String,
    enum: INTERFACES_LIST,
    default: 'press',
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    enum: ['manual', 'import', 'api', 'website', 'referral'],
    default: 'manual'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'contacts'
});

// Index composés pour optimiser les requêtes
ContactSchema.index({ email: 1, status: 1 });
ContactSchema.index({ 'media.type': 1, specializations: 1 });
ContactSchema.index({ engagementScore: -1, status: 1 });
ContactSchema.index({ lastContactDate: -1, status: 1 });
ContactSchema.index({ createdBy: 1, status: 1 });
ContactSchema.index({ visibility: 1, interface: 1 });
ContactSchema.index({ organizationId: 1, visibility: 1 });
ContactSchema.index({ interface: 1, createdBy: 1 });

// Index de recherche textuelle
ContactSchema.index({
  firstName: 'text',
  lastName: 'text',
  'media.name': 'text',
  jobTitle: 'text'
});

// Méthodes statiques
ContactSchema.statics.searchContacts = async function(query, filters = {}, options = {}) {
  const pipeline = [];

  // Filtre de recherche textuelle
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { 'media.name': { $regex: query, $options: 'i' } },
          { jobTitle: { $regex: query, $options: 'i' } }
        ]
      }
    });
  }

  // Filtres additionnels
  const matchFilters = { status: { $ne: 'unsubscribed' } };
  if (filters.mediaType) matchFilters['media.type'] = filters.mediaType;
  if (filters.specializations) matchFilters.specializations = { $in: filters.specializations };
  if (filters.location) matchFilters['location.city'] = filters.location;
  if (filters.minEngagementScore) matchFilters.engagementScore = { $gte: filters.minEngagementScore };

  pipeline.push({ $match: matchFilters });

  // Tri
  const sortField = options.sortBy || 'engagementScore';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortOrder } });

  // Pagination
  if (options.skip) pipeline.push({ $skip: options.skip });
  if (options.limit) pipeline.push({ $limit: options.limit });

  return this.aggregate(pipeline);
};

ContactSchema.statics.getEngagementLeaderboard = async function(limit = 20) {
  return this.find({ status: 'active' })
    .sort({ engagementScore: -1 })
    .limit(limit)
    .select('firstName lastName email media.name engagementScore emailMetrics')
    .lean();
};

ContactSchema.statics.getSegmentationStats = async function() {
  const pipeline = [
    {
      $group: {
        _id: {
          mediaType: '$media.type',
          status: '$status'
        },
        count: { $sum: 1 },
        avgEngagement: { $avg: '$engagementScore' }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Méthodes d'instance
ContactSchema.methods.updateEngagementScore = function() {
  const { emailMetrics } = this;

  if (emailMetrics.totalReceived === 0) {
    this.engagementScore = 0;
    return;
  }

  let score = 0;

  // Calcul basé sur les taux d'engagement
  score += (emailMetrics.openRate * 0.3);      // 30% pour les ouvertures
  score += (emailMetrics.clickRate * 0.4);     // 40% pour les clics
  score += (emailMetrics.responseRate * 0.3);  // 30% pour les réponses

  // Bonus pour l'activité récente
  const daysSinceLastActivity = Math.min(365, Math.floor(
    (Date.now() - (emailMetrics.lastOpenedAt || this.lastContactDate || this.createdAt)) / (1000 * 60 * 60 * 24)
  ));

  const recencyBonus = Math.max(0, (365 - daysSinceLastActivity) / 365 * 10);
  score += recencyBonus;

  this.engagementScore = Math.min(100, Math.max(0, score));
};

ContactSchema.methods.updateEmailMetrics = function() {
  const { emailMetrics } = this;

  if (emailMetrics.totalReceived > 0) {
    emailMetrics.openRate = (emailMetrics.totalOpened / emailMetrics.totalReceived) * 100;
    emailMetrics.responseRate = (emailMetrics.totalReplied / emailMetrics.totalReceived) * 100;
  }

  if (emailMetrics.totalOpened > 0) {
    emailMetrics.clickRate = (emailMetrics.totalClicked / emailMetrics.totalOpened) * 100;
  }

  this.updateEngagementScore();
};

ContactSchema.methods.addNote = function(content, type = 'general', createdBy) {
  this.notes.push({
    content,
    type,
    createdBy,
    createdAt: new Date()
  });

  // Garder seulement les 20 dernières notes
  if (this.notes.length > 20) {
    this.notes = this.notes.slice(-20);
  }
};

ContactSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

ContactSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    name: this.getFullName(),
    email: this.email,
    media: this.media.name,
    jobTitle: this.jobTitle,
    engagementScore: this.engagementScore,
    status: this.status
  };
};

// Middleware pre-save
ContactSchema.pre('save', function(next) {
  // Calculer automatiquement les métriques avant sauvegarde
  if (this.isModified('emailMetrics')) {
    this.updateEmailMetrics();
  }

  next();
});

module.exports = mongoose.model('Contact', ContactSchema);