/**
 * MODÈLE IMAP CONFIGURATION - Gestion des configurations email IMAP
 * Modèle Mongoose pour stocker les paramètres IMAP des utilisateurs
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const imapConfigurationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est obligatoire'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de la configuration est obligatoire'],
    trim: true,
    maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez entrer un email valide']
  },
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom'],
    required: [true, 'Le provider est obligatoire']
  },
  imapConfig: {
    host: {
      type: String,
      required: [true, 'Le serveur IMAP est obligatoire'],
      trim: true
    },
    port: {
      type: Number,
      required: [true, 'Le port IMAP est obligatoire'],
      min: [1, 'Le port doit être supérieur à 0'],
      max: [65535, 'Le port doit être inférieur à 65536']
    },
    secure: {
      type: Boolean,
      default: true
    },
    username: {
      type: String,
      required: [true, 'Le nom d\'utilisateur est obligatoire'],
      trim: true
    },
    passwordEncrypted: {
      type: String,
      required: [true, 'Le mot de passe chiffré est obligatoire']
    },
    authMethod: {
      type: String,
      enum: ['plain', 'login', 'oauth2'],
      default: 'plain'
    }
  },
  oauth2Config: {
    clientId: String,
    clientSecret: String,
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date
  },
  pollingConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    intervalMinutes: {
      type: Number,
      default: 5,
      min: [1, 'L\'intervalle minimum est de 1 minute'],
      max: [60, 'L\'intervalle maximum est de 60 minutes']
    },
    mailbox: {
      type: String,
      default: 'INBOX'
    },
    markAsRead: {
      type: Boolean,
      default: false
    },
    onlyUnread: {
      type: Boolean,
      default: true
    },
    maxMessages: {
      type: Number,
      default: 50,
      min: [1, 'Minimum 1 message'],
      max: [500, 'Maximum 500 messages']
    }
  },
  filters: {
    dateFilter: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBack: {
        type: Number,
        default: 7,
        min: [1, 'Minimum 1 jour'],
        max: [90, 'Maximum 90 jours']
      }
    },
    subjectFilters: [{
      type: String,
      trim: true
    }],
    senderFilters: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    excludeAutoReply: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'testing'],
    default: 'inactive'
  },
  lastConnection: {
    successful: {
      type: Date
    },
    lastError: {
      message: String,
      date: Date,
      code: String
    },
    totalConnections: {
      type: Number,
      default: 0
    },
    successfulConnections: {
      type: Number,
      default: 0
    }
  },
  lastPoll: {
    date: Date,
    messagesFound: {
      type: Number,
      default: 0
    },
    messagesProcessed: {
      type: Number,
      default: 0
    },
    errors: [{
      message: String,
      date: Date
    }]
  },
  statistics: {
    totalEmailsProcessed: {
      type: Number,
      default: 0
    },
    campaignsMatched: {
      type: Number,
      default: 0
    },
    unassociatedEmails: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
imapConfigurationSchema.index({ userId: 1 });
imapConfigurationSchema.index({ email: 1 });
imapConfigurationSchema.index({ status: 1 });
imapConfigurationSchema.index({ 'pollingConfig.enabled': 1 });
imapConfigurationSchema.index({ createdAt: -1 });
imapConfigurationSchema.index({ 'lastConnection.successful': -1 });

// Virtuals
imapConfigurationSchema.virtual('isConnected').get(function() {
  return this.status === 'active' && this.lastConnection.successful &&
         (Date.now() - this.lastConnection.successful.getTime()) < 15 * 60 * 1000; // 15 minutes
});

imapConfigurationSchema.virtual('connectionHealth').get(function() {
  if (this.lastConnection.totalConnections === 0) return 'unknown';

  const successRate = this.lastConnection.successfulConnections / this.lastConnection.totalConnections;
  if (successRate >= 0.9) return 'excellent';
  if (successRate >= 0.7) return 'good';
  if (successRate >= 0.5) return 'poor';
  return 'critical';
});

imapConfigurationSchema.virtual('nextPollTime').get(function() {
  if (!this.lastPoll.date || !this.pollingConfig.enabled) return null;

  return new Date(this.lastPoll.date.getTime() + (this.pollingConfig.intervalMinutes * 60 * 1000));
});

// Middleware de pré-sauvegarde pour chiffrer le mot de passe
imapConfigurationSchema.pre('save', async function(next) {
  // Chiffrer le mot de passe seulement s'il a été modifié
  if (!this.isModified('imapConfig.passwordEncrypted')) return next();

  try {
    // Utiliser une clé de chiffrement depuis les variables d'environnement
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);

    let encrypted = cipher.update(this.imapConfig.passwordEncrypted, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    this.imapConfig.passwordEncrypted = encrypted;
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour déchiffrer le mot de passe
imapConfigurationSchema.methods.getDecryptedPassword = function() {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);

    let decrypted = decipher.update(this.imapConfig.passwordEncrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Erreur lors du déchiffrement du mot de passe');
  }
};

// Méthode pour obtenir la configuration IMAP complète
imapConfigurationSchema.methods.getIMAPConnectionConfig = function() {
  return {
    host: this.imapConfig.host,
    port: this.imapConfig.port,
    secure: this.imapConfig.secure,
    auth: {
      user: this.imapConfig.username,
      pass: this.getDecryptedPassword()
    },
    tls: {
      rejectUnauthorized: false // Pour les certificats auto-signés
    }
  };
};

// Méthode pour tester la connexion IMAP
imapConfigurationSchema.methods.testConnection = async function() {
  const Imap = require('imap');

  return new Promise((resolve, reject) => {
    const imap = new Imap(this.getIMAPConnectionConfig());

    const timeout = setTimeout(() => {
      imap.destroy();
      reject(new Error('Timeout de connexion'));
    }, 10000); // 10 secondes timeout

    imap.once('ready', () => {
      clearTimeout(timeout);
      imap.end();
      resolve({ success: true, message: 'Connexion réussie' });
    });

    imap.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    try {
      imap.connect();
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
};

// Méthode pour mettre à jour les statistiques de connexion
imapConfigurationSchema.methods.updateConnectionStats = function(success, error = null) {
  this.lastConnection.totalConnections += 1;

  if (success) {
    this.lastConnection.successful = new Date();
    this.lastConnection.successfulConnections += 1;
    this.status = 'active';
  } else {
    this.lastConnection.lastError = {
      message: error?.message || 'Erreur inconnue',
      date: new Date(),
      code: error?.code || 'UNKNOWN'
    };
    this.status = 'error';
  }

  return this.save();
};

// Méthode pour mettre à jour les statistiques de polling
imapConfigurationSchema.methods.updatePollStats = function(messagesFound, messagesProcessed, errors = []) {
  this.lastPoll = {
    date: new Date(),
    messagesFound,
    messagesProcessed,
    errors: errors.map(err => ({
      message: err.message,
      date: new Date()
    }))
  };

  this.statistics.totalEmailsProcessed += messagesProcessed;

  return this.save();
};

// Méthode pour obtenir la configuration publique (sans mot de passe)
imapConfigurationSchema.methods.getPublicConfig = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    provider: this.provider,
    status: this.status,
    pollingConfig: this.pollingConfig,
    filters: this.filters,
    lastConnection: {
      successful: this.lastConnection.successful,
      lastError: this.lastConnection.lastError
    },
    lastPoll: this.lastPoll,
    statistics: this.statistics,
    isConnected: this.isConnected,
    connectionHealth: this.connectionHealth,
    nextPollTime: this.nextPollTime,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Méthodes statiques
imapConfigurationSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

imapConfigurationSchema.statics.findActiveConfigurations = function() {
  return this.find({
    isActive: true,
    'pollingConfig.enabled': true,
    status: { $in: ['active', 'testing'] }
  });
};

imapConfigurationSchema.statics.getPresetForProvider = function(provider) {
  const presets = {
    gmail: {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      authMethod: 'oauth2'
    },
    outlook: {
      host: 'outlook.office365.com',
      port: 993,
      secure: true,
      authMethod: 'plain'
    },
    yahoo: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      secure: true,
      authMethod: 'plain'
    }
  };

  return presets[provider] || null;
};

// Créer le modèle
const IMAPConfiguration = mongoose.model('IMAPConfiguration', imapConfigurationSchema);

module.exports = IMAPConfiguration;