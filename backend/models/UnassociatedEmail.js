const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const UnassociatedEmailSchema = new mongoose.Schema({
  // Informations de l'email
  fromEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  toEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },

  // Contenu
  bodyText: {
    type: String,
    default: null
  },
  bodyHtml: {
    type: String,
    default: null
  },

  // Métadonnées
  messageId: {
    type: String,
    index: true
  },
  receivedAt: {
    type: Date,
    required: true,
    index: true
  },

  // Statut de traitement
  status: {
    type: String,
    enum: ['pending_review', 'associated', 'ignored', 'spam'],
    default: 'pending_review',
    index: true
  },

  // Association manuelle
  associatedCampaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  associatedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    default: null
  },

  // Utilisateur qui a traité
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },

  // Notes administratives
  adminNotes: {
    type: String,
    default: null
  },

  // Tentatives d'association automatique
  autoAssociationAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date,
    default: null
  },

  // Pièces jointes
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true,
  collection: 'unassociated_emails'
});

// Index composés pour optimiser les requêtes
UnassociatedEmailSchema.index({ status: 1, receivedAt: -1 });
UnassociatedEmailSchema.index({ fromEmail: 1, receivedAt: -1 });
UnassociatedEmailSchema.index({ receivedAt: -1, autoAssociationAttempts: 1 });

// Plugin de pagination
UnassociatedEmailSchema.plugin(mongoosePaginate);

// Méthodes statiques
UnassociatedEmailSchema.statics.getPendingCount = async function() {
  return this.countDocuments({ status: 'pending_review' });
};

UnassociatedEmailSchema.statics.getRecentUnassociated = async function(limit = 10) {
  return this.find({ status: 'pending_review' })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .lean();
};

// Méthodes d'instance
UnassociatedEmailSchema.methods.markAsProcessed = function(userId, status = 'associated', notes = null) {
  this.status = status;
  this.processedBy = userId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
};

UnassociatedEmailSchema.methods.incrementAttempts = function() {
  this.autoAssociationAttempts += 1;
  this.lastAttemptAt = new Date();
};

module.exports = mongoose.model('UnassociatedEmail', UnassociatedEmailSchema);