/**
 * MODÈLE MESSAGE - Schema pour stocker les emails reçus
 * Stockage des emails traités depuis le système IMAP avec association aux campagnes
 */

const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  contentId: String,
  path: String, // Chemin de stockage du fichier
  url: String   // URL publique si stocké dans le cloud
}, { _id: false });

const emailAddressSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }
}, { _id: false });

const flagsSchema = new mongoose.Schema({
  seen: {
    type: Boolean,
    default: false
  },
  flagged: {
    type: Boolean,
    default: false
  },
  answered: {
    type: Boolean,
    default: false
  },
  draft: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const headersSchema = new mongoose.Schema({
  inReplyTo: String,
  references: [String],
  messageId: String,
  returnPath: String,
  deliveredTo: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  // Identifiants uniques
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  threadId: {
    type: String,
    index: true
  },

  // Associations
  configId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IMAPConfiguration',
    required: true,
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Adresses email
  from: {
    type: emailAddressSchema,
    required: true
  },
  to: [emailAddressSchema],
  cc: [emailAddressSchema],
  bcc: [emailAddressSchema],
  replyTo: emailAddressSchema,

  // Contenu de l'email
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  text: {
    type: String,
    default: ''
  },
  html: {
    type: String,
    default: ''
  },

  // Métadonnées temporelles
  date: {
    type: Date,
    required: true,
    index: true
  },
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date,
    index: true
  },

  // Headers techniques
  headers: headersSchema,

  // Pièces jointes
  attachments: [attachmentSchema],

  // Flags et statuts
  flags: flagsSchema,

  // Statut de traitement
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processingError: String,

  // Source et type
  source: {
    type: String,
    enum: ['imap', 'webhook', 'manual', 'forward'],
    default: 'imap',
    index: true
  },
  type: {
    type: String,
    enum: ['email', 'reply', 'forward', 'bounce', 'auto-reply'],
    default: 'email',
    index: true
  },

  // Analyse et classification
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  category: {
    type: String,
    enum: ['response', 'inquiry', 'complaint', 'feedback', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },

  // Métadonnées de réponse
  isResponse: {
    type: Boolean,
    default: false,
    index: true
  },
  responseToMessageId: String,
  responseTime: Number, // Temps de réponse en minutes

  // Tags et labels personnalisés
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  labels: [{
    name: String,
    color: String
  }],

  // Données de tracking
  tracking: {
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String
    }
  },

  // Métadonnées d'archive
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: Date,
  deletedAt: Date,

  // Statistiques et engagement
  stats: {
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    forwardCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Index composites pour les requêtes fréquentes
messageSchema.index({ configId: 1, date: -1 });
messageSchema.index({ campaignId: 1, receivedAt: -1 });
messageSchema.index({ userId: 1, processed: 1, receivedAt: -1 });
messageSchema.index({ 'from.email': 1, date: -1 });
messageSchema.index({ threadId: 1, date: 1 });
messageSchema.index({ type: 1, isResponse: 1, date: -1 });
messageSchema.index({ source: 1, processed: 1 });

// Index de recherche textuelle
messageSchema.index({
  subject: 'text',
  text: 'text',
  'from.name': 'text',
  'from.email': 'text'
});

/**
 * MÉTHODES D'INSTANCE
 */

// Obtenir un résumé public du message (sans données sensibles)
messageSchema.methods.getPublicSummary = function() {
  return {
    _id: this._id,
    messageId: this.messageId,
    threadId: this.threadId,
    campaignId: this.campaignId,
    from: this.from,
    subject: this.subject,
    date: this.date,
    receivedAt: this.receivedAt,
    processed: this.processed,
    source: this.source,
    type: this.type,
    sentiment: this.sentiment,
    category: this.category,
    priority: this.priority,
    isResponse: this.isResponse,
    hasAttachments: this.attachments.length > 0,
    attachmentCount: this.attachments.length,
    flags: this.flags,
    tags: this.tags,
    labels: this.labels,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Obtenir le contenu complet (pour les utilisateurs autorisés)
messageSchema.methods.getFullContent = function() {
  return {
    ...this.getPublicSummary(),
    to: this.to,
    cc: this.cc,
    bcc: this.bcc,
    text: this.text,
    html: this.html,
    headers: this.headers,
    attachments: this.attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      contentId: att.contentId
    })),
    tracking: this.tracking
  };
};

// Marquer comme lu
messageSchema.methods.markAsRead = async function() {
  this.flags.seen = true;
  return this.save();
};

// Marquer comme important
messageSchema.methods.markAsFlagged = async function() {
  this.flags.flagged = true;
  return this.save();
};

// Ajouter un tag
messageSchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag.toLowerCase())) {
    this.tags.push(tag.toLowerCase());
    return this.save();
  }
  return this;
};

// Supprimer un tag
messageSchema.methods.removeTag = async function(tag) {
  this.tags = this.tags.filter(t => t !== tag.toLowerCase());
  return this.save();
};

// Archiver le message
messageSchema.methods.archive = async function() {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Calculer le temps de réponse
messageSchema.methods.calculateResponseTime = function(originalDate) {
  if (!originalDate) return null;
  const diff = this.date.getTime() - originalDate.getTime();
  return Math.round(diff / (1000 * 60)); // En minutes
};

/**
 * MÉTHODES STATIQUES
 */

// Trouver les messages par configuration IMAP
messageSchema.statics.findByConfig = function(configId, options = {}) {
  const query = { configId };

  if (options.processed !== undefined) {
    query.processed = options.processed;
  }

  if (options.campaignId) {
    query.campaignId = options.campaignId;
  }

  return this.find(query)
    .sort({ receivedAt: -1 })
    .limit(options.limit || 50)
    .populate('campaignId', 'title status');
};

// Trouver les messages d'une campagne
messageSchema.statics.findByCampaign = function(campaignId, options = {}) {
  const query = { campaignId };

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ receivedAt: -1 })
    .limit(options.limit || 100);
};

// Rechercher des messages
messageSchema.statics.search = function(userId, searchQuery, filters = {}) {
  const query = { userId };

  // Recherche textuelle
  if (searchQuery) {
    query.$text = { $search: searchQuery };
  }

  // Filtres
  if (filters.from) {
    query['from.email'] = new RegExp(filters.from, 'i');
  }

  if (filters.subject) {
    query.subject = new RegExp(filters.subject, 'i');
  }

  if (filters.dateFrom) {
    query.date = query.date || {};
    query.date.$gte = new Date(filters.dateFrom);
  }

  if (filters.dateTo) {
    query.date = query.date || {};
    query.date.$lte = new Date(filters.dateTo);
  }

  if (filters.campaignId) {
    query.campaignId = filters.campaignId;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.processed !== undefined) {
    query.processed = filters.processed;
  }

  return this.find(query)
    .sort({ receivedAt: -1 })
    .populate('campaignId', 'title status')
    .populate('configId', 'name email');
};

// Obtenir les statistiques des messages
messageSchema.statics.getStats = async function(userId, period = 30) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - period);

  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        receivedAt: { $gte: dateLimit }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        processed: { $sum: { $cond: ['$processed', 1, 0] } },
        responses: { $sum: { $cond: ['$isResponse', 1, 0] } },
        withAttachments: { $sum: { $cond: [{ $gt: [{ $size: '$attachments' }, 0] }, 1, 0] } },
        byType: {
          $push: {
            type: '$type',
            sentiment: '$sentiment',
            priority: '$priority'
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      processed: 0,
      responses: 0,
      withAttachments: 0,
      byType: {},
      bySentiment: {},
      byPriority: {}
    };
  }

  const result = stats[0];

  // Regrouper par type, sentiment et priorité
  const byType = {};
  const bySentiment = {};
  const byPriority = {};

  result.byType.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;
    bySentiment[item.sentiment] = (bySentiment[item.sentiment] || 0) + 1;
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  });

  return {
    total: result.total,
    processed: result.processed,
    responses: result.responses,
    withAttachments: result.withAttachments,
    byType,
    bySentiment,
    byPriority
  };
};

/**
 * MIDDLEWARE
 */

// Pré-middleware pour définir l'userId basé sur la configId
messageSchema.pre('save', async function(next) {
  if (this.isNew && this.configId && !this.userId) {
    try {
      const IMAPConfiguration = require('./IMAPConfiguration');
      const config = await IMAPConfiguration.findById(this.configId);
      if (config) {
        this.userId = config.userId;
      }
    } catch (error) {
      console.error('Erreur récupération userId:', error);
    }
  }
  next();
});

// Post-middleware pour nettoyer les données sensibles
messageSchema.post('find', function(docs) {
  // Logique de nettoyage si nécessaire
});

module.exports = mongoose.model('Message', messageSchema);