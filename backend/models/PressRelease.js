/**
 * MODELE PRESS RELEASE - Communiques de presse
 * Outil promo BandStream RP: creation, workflow d'approbation, distribution
 */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const PressReleaseSchema = new mongoose.Schema({
  // Contenu principal
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [300, 'Le titre ne peut pas depasser 300 caracteres']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [500, 'Le sous-titre ne peut pas depasser 500 caracteres']
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [1000, 'Le resume ne peut pas depasser 1000 caracteres']
  },
  content: {
    type: String,
    required: [true, 'Le contenu est obligatoire']
  },
  htmlContent: {
    type: String
  },

  // Blocs de contenu structures (pour editeur riche)
  contentBlocks: [{
    type: {
      type: String,
      enum: ['paragraph', 'heading', 'quote', 'image', 'video', 'embed', 'divider'],
      default: 'paragraph'
    },
    content: String,
    metadata: mongoose.Schema.Types.Mixed // url, alt, caption, etc.
  }],

  // Workflow de publication
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft',
    index: true
  },

  // Historique du workflow
  statusHistory: [{
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'published', 'archived']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],

  // Approbation
  approval: {
    requiredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String
  },

  // Categorisation
  category: {
    type: String,
    enum: [
      'corporate',       // Actualites entreprise
      'product',         // Lancement produit/service
      'partnership',     // Partenariats
      'event',           // Evenements
      'financial',       // Resultats financiers
      'talent',          // Recrutement, nominations
      'crisis',          // Communication de crise
      'industry',        // Analyse sectorielle
      'other'
    ],
    default: 'corporate',
    index: true
  },

  // Distribution
  distribution: {
    channels: [{
      type: String,
      enum: ['email', 'website', 'social', 'wire_service', 'direct']
    }],
    targetAudience: [{
      type: String,
      enum: ['press', 'industry', 'public', 'investors', 'partners']
    }],
    embargoDate: Date,     // Ne pas publier avant cette date
    releaseDate: Date,     // Date de publication prevue
    distributedAt: Date    // Date de distribution effective
  },

  // Medias associes
  featuredImage: {
    url: String,
    caption: String,
    credit: String,
    altText: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],

  // Contact presse (personne a contacter pour plus d'info)
  pressContact: {
    name: String,
    email: String,
    phone: String,
    title: String
  },

  // Boilerplate (texte standard en fin de communique)
  boilerplate: {
    type: String,
    trim: true,
    maxlength: [2000, 'Le boilerplate ne peut pas depasser 2000 caracteres']
  },

  // SEO / Partage
  seo: {
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    metaTitle: {
      type: String,
      maxlength: 70
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [String]
  },

  // Metriques
  metrics: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    mediaPickups: { type: Number, default: 0 },
    lastUpdated: Date
  },

  // Campagnes liees
  linkedCampaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }],

  // Metadata
  tags: [String],
  language: {
    type: String,
    enum: ['fr', 'en', 'es', 'de'],
    default: 'fr'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'press_releases'
});

// Index
PressReleaseSchema.index({ organizationId: 1, status: 1 });
PressReleaseSchema.index({ organizationId: 1, category: 1 });
PressReleaseSchema.index({ createdBy: 1, status: 1 });
PressReleaseSchema.index({ 'distribution.releaseDate': -1 });
PressReleaseSchema.index({ title: 'text', summary: 'text', content: 'text' });

PressReleaseSchema.plugin(mongoosePaginate);

// Methodes d'instance

PressReleaseSchema.methods.submitForReview = function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Seuls les brouillons peuvent etre soumis pour relecture');
  }
  this.status = 'review';
  this.statusHistory.push({ status: 'review', changedBy: userId });
  return this.save();
};

PressReleaseSchema.methods.approve = function(userId) {
  if (this.status !== 'review') {
    throw new Error('Seuls les communiques en relecture peuvent etre approuves');
  }
  this.status = 'approved';
  this.approval.approvedBy = userId;
  this.approval.approvedAt = new Date();
  this.statusHistory.push({ status: 'approved', changedBy: userId });
  return this.save();
};

PressReleaseSchema.methods.reject = function(userId, reason) {
  if (this.status !== 'review') {
    throw new Error('Seuls les communiques en relecture peuvent etre rejetes');
  }
  this.status = 'draft';
  this.approval.rejectedBy = userId;
  this.approval.rejectedAt = new Date();
  this.approval.rejectionReason = reason;
  this.statusHistory.push({ status: 'draft', changedBy: userId, comment: `Rejete: ${reason}` });
  return this.save();
};

PressReleaseSchema.methods.publish = function(userId) {
  if (this.status !== 'approved') {
    throw new Error('Seuls les communiques approuves peuvent etre publies');
  }
  this.status = 'published';
  this.distribution.distributedAt = new Date();
  this.statusHistory.push({ status: 'published', changedBy: userId });
  return this.save();
};

// Pre-save: generer le slug SEO
PressReleaseSchema.pre('save', function(next) {
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
  next();
});

module.exports = mongoose.model('PressRelease', PressReleaseSchema);
