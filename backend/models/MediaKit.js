/**
 * MODELE MEDIA KIT - Dossiers de presse
 * Outil promo BandStream RP: compilation de documents, assets, infos pour les medias
 */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const crypto = require('crypto');

const MediaKitSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: [true, 'Le nom du media kit est obligatoire'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas depasser 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La description ne peut pas depasser 2000 caracteres']
  },

  // Contexte du media kit
  context: {
    type: String,
    enum: [
      'company',        // Dossier de presse entreprise
      'product',        // Lancement produit
      'event',          // Evenement specifique
      'campaign',       // Campagne RP
      'executive',      // Kit dirigeants / porte-paroles
      'crisis',         // Communication de crise
      'seasonal',       // Saisonnier (fin d'annee, etc.)
      'other'
    ],
    default: 'company',
    index: true
  },

  // Statut
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    index: true
  },

  // Assets / Fichiers
  assets: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: [
        'logo',           // Logos (PNG, SVG, etc.)
        'photo',          // Photos haute resolution
        'video',          // Videos
        'document',       // Documents (PDF, DOCX)
        'infographic',    // Infographies
        'presentation',   // Presentations
        'audio',          // Audio (interviews, jingles)
        'social_media',   // Assets pour reseaux sociaux
        'template',       // Templates editoriaux
        'other'
      ],
      default: 'document'
    },
    file: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,      // en bytes
      url: String,
      thumbnailUrl: String
    },
    // Metadonnees specifiques
    dimensions: {
      width: Number,
      height: Number
    },
    format: String,       // ex: "PNG", "SVG", "PDF"
    usage: String,        // Instructions d'utilisation
    credit: String,       // Credit photo/auteur
    isDownloadable: {
      type: Boolean,
      default: true
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  }],

  // Sections de contenu (pour organiser le kit)
  sections: [{
    title: String,
    content: String,
    htmlContent: String,
    sortOrder: {
      type: Number,
      default: 0
    }
  }],

  // Informations cles (faits et chiffres)
  keyFacts: [{
    label: String,
    value: String,
    icon: String
  }],

  // Porte-paroles / Contacts
  spokespeople: [{
    name: String,
    title: String,
    bio: String,
    photo: String,
    email: String,
    phone: String,
    availability: String
  }],

  // Branding
  branding: {
    primaryColor: String,
    secondaryColor: String,
    font: String,
    guidelines: String // URL vers le guide de marque
  },

  // Partage public
  publicAccess: {
    enabled: {
      type: Boolean,
      default: false
    },
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    password: String, // Hash du mot de passe si acces protege
    expiresAt: Date   // Date d'expiration du lien public
  },

  // Metriques
  metrics: {
    views: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    assetDownloads: { type: Number, default: 0 },
    averageTimeOnPage: { type: Number, default: 0 }, // en secondes
    lastViewedAt: Date,
    lastUpdated: Date
  },

  // Liens
  linkedPressReleases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PressRelease'
  }],
  linkedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
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
  collection: 'media_kits'
});

// Index
MediaKitSchema.index({ organizationId: 1, status: 1 });
MediaKitSchema.index({ organizationId: 1, context: 1 });
MediaKitSchema.index({ createdBy: 1, status: 1 });
MediaKitSchema.index({ 'publicAccess.slug': 1 });
MediaKitSchema.index({ name: 'text', description: 'text' });

MediaKitSchema.plugin(mongoosePaginate);

// Methodes d'instance

MediaKitSchema.methods.generatePublicSlug = function() {
  const slug = crypto.randomBytes(8).toString('hex');
  this.publicAccess.slug = slug;
  this.publicAccess.enabled = true;
  return slug;
};

MediaKitSchema.methods.disablePublicAccess = function() {
  this.publicAccess.enabled = false;
  return this.save();
};

MediaKitSchema.methods.addAsset = function(assetData) {
  const maxOrder = this.assets.reduce((max, a) => Math.max(max, a.sortOrder || 0), 0);
  this.assets.push({
    ...assetData,
    sortOrder: maxOrder + 1
  });
};

MediaKitSchema.methods.removeAsset = function(assetId) {
  this.assets = this.assets.filter(a => a._id.toString() !== assetId.toString());
};

MediaKitSchema.methods.incrementDownload = function(assetId) {
  const asset = this.assets.id(assetId);
  if (asset) {
    asset.downloadCount += 1;
    this.metrics.assetDownloads += 1;
    this.metrics.totalDownloads += 1;
    this.metrics.lastUpdated = new Date();
  }
};

MediaKitSchema.methods.recordView = function() {
  this.metrics.views += 1;
  this.metrics.lastViewedAt = new Date();
  this.metrics.lastUpdated = new Date();
};

MediaKitSchema.methods.getTotalSize = function() {
  return this.assets.reduce((total, asset) => {
    return total + (asset.file?.size || 0);
  }, 0);
};

MediaKitSchema.methods.getPublicInfo = function() {
  return {
    name: this.name,
    description: this.description,
    context: this.context,
    sections: this.sections,
    keyFacts: this.keyFacts,
    spokespeople: this.spokespeople.map(s => ({
      name: s.name,
      title: s.title,
      bio: s.bio,
      photo: s.photo
    })),
    assets: this.assets
      .filter(a => a.isDownloadable)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(a => ({
        name: a.name,
        description: a.description,
        category: a.category,
        format: a.format,
        dimensions: a.dimensions,
        usage: a.usage,
        credit: a.credit,
        url: a.file?.url
      })),
    branding: this.branding,
    language: this.language
  };
};

// Methodes statiques

MediaKitSchema.statics.findByPublicSlug = function(slug) {
  return this.findOne({
    'publicAccess.slug': slug,
    'publicAccess.enabled': true,
    status: 'active',
    $or: [
      { 'publicAccess.expiresAt': null },
      { 'publicAccess.expiresAt': { $gt: new Date() } }
    ]
  });
};

module.exports = mongoose.model('MediaKit', MediaKitSchema);
