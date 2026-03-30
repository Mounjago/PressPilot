/**
 * MODÈLE USER - Gestion des utilisateurs avec sécurité
 * Modèle Mongoose pour l'authentification et la gestion des utilisateurs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ROLES_LIST, INTERFACES_LIST, ROLE_INTERFACE_ACCESS, isAdminRole, getInterfacesForRole } = require('../constants/roles');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez entrer un email valide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minLength: [12, 'Le mot de passe doit contenir au moins 12 caracteres'],
    validate: {
      validator: function(value) {
        // Skip validation if password is already hashed (bcrypt hash starts with $2)
        if (value.startsWith('$2')) return true;
        // Require uppercase, lowercase, number, and special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/.test(value);
      },
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special'
    }
  },
  company: {
    type: String,
    trim: true,
    maxLength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères']
  },
  role: {
    type: String,
    enum: [...ROLES_LIST, 'user', 'admin', 'moderator'], // Legacy roles kept for migration compatibility
    default: 'press_agent'
  },

  // Interfaces auxquelles l'utilisateur a acces (derive du role, surcharge possible)
  interfaces: [{
    type: String,
    enum: INTERFACES_LIST
  }],

  // Organisation rattachee (obligatoire pour bandstream_rp)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },

  // Traçabilite de la migration depuis l'ancien systeme de roles
  _migratedFrom: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    language: {
      type: String,
      default: 'fr',
      enum: ['fr', 'en', 'es']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    timezone: {
      type: String,
      default: 'Europe/Paris'
    }
  },
  emailSettings: {
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: function() { return this.email; }
    },
    senderName: {
      type: String,
      trim: true,
      default: function() { return this.name; }
    },
    replyToEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    signature: {
      type: String,
      trim: true,
      maxLength: [1000, 'La signature ne peut pas dépasser 1000 caractères']
    },
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    },
    unsubscribeLink: {
      type: Boolean,
      default: true
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    }
  },
  aiSettings: {
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'gemini'],
      default: 'anthropic'
    },
    apiKey: {
      type: String,
      default: null
    },
    model: {
      type: String,
      default: null
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
// Note: email already has unique: true on the schema field (creates an index)
userSchema.index({ company: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });

// Virtual pour le statut de verrouillage
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware de pré-sauvegarde pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  // Seulement hasher si le mot de passe a été modifié
  if (!this.isModified('password')) return next();

  try {
    // Générer un salt et hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) return false;

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

// Méthode pour générer un JWT
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    interfaces: this.getAccessibleInterfaces(),
    organizationId: this.organizationId || null
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'presspilot',
    audience: 'presspilot-users'
  });
};

// Retourne les interfaces accessibles (surcharge ou derive du role)
userSchema.methods.getAccessibleInterfaces = function() {
  // Si des interfaces sont explicitement definies, les utiliser
  if (this.interfaces && this.interfaces.length > 0) {
    return this.interfaces;
  }
  // Sinon, deriver du role
  return getInterfacesForRole(this.role);
};

// Verifie si l'utilisateur peut acceder a une interface
userSchema.methods.canAccessInterface = function(interfaceName) {
  return this.getAccessibleInterfaces().includes(interfaceName);
};

// Verifie si l'utilisateur est admin
userSchema.methods.isAdmin = function() {
  return isAdminRole(this.role);
};

// Verifie si l'utilisateur est super admin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// Méthode pour incrémenter les tentatives de connexion
userSchema.methods.incLoginAttempts = function() {
  // Si nous avons une date de verrouillage et qu'elle est expirée, recommencer
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Verrouiller le compte après 5 tentatives échouées
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Verrouiller pendant 2 heures
    };
  }

  return this.updateOne(updates);
};

// Méthode pour réinitialiser les tentatives de connexion
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Méthode pour mettre à jour la dernière connexion
userSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() }
  });
};

// Méthode pour générer un token de vérification email
userSchema.methods.generateEmailVerificationToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  return token;
};

// Méthode pour générer un token de réinitialisation de mot de passe
userSchema.methods.generatePasswordResetToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Expire dans 10 minutes
  return token;
};

// Pre-save: encrypt AI API key
userSchema.pre('save', async function(next) {
  if (!this.isModified('aiSettings.apiKey') || !this.aiSettings?.apiKey) return next();
  // Skip if already encrypted (contains ':' separator from iv:encrypted format)
  if (this.aiSettings.apiKey.includes(':')) return next();
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      return next(new Error('ENCRYPTION_KEY must be defined (min 32 chars)'));
    }
    const key = crypto.scryptSync(encryptionKey, 'presspilot-ai-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(this.aiSettings.apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.aiSettings.apiKey = iv.toString('hex') + ':' + encrypted;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to decrypt AI API key
userSchema.methods.getDecryptedAiApiKey = function() {
  if (!this.aiSettings?.apiKey) return null;
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be defined (min 32 chars)');
    }
    const key = crypto.scryptSync(encryptionKey, 'presspilot-ai-salt', 32);
    const parts = this.aiSettings.apiKey.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted API key format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Error decrypting AI API key: ' + error.message);
  }
};

// Méthode pour obtenir les données publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    company: this.company,
    role: this.role,
    interfaces: this.getAccessibleInterfaces(),
    organizationId: this.organizationId,
    avatar: this.avatar,
    emailVerified: this.emailVerified,
    subscription: this.subscription,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

// Méthode statique pour trouver un utilisateur par email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Méthode statique pour trouver les utilisateurs actifs
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true }).sort({ lastLogin: -1 });
};

// Middleware pour nettoyer les données avant la suppression
userSchema.pre('remove', async function(next) {
  try {
    // Ici vous pouvez ajouter la logique pour nettoyer les données associées
    // Par exemple, supprimer les projets, campagnes, etc. de l'utilisateur
    // Cleanup associated data on user removal (projects, campaigns, etc.)
    next();
  } catch (error) {
    next(error);
  }
});

// Créer le modèle
const User = mongoose.model('User', userSchema);

module.exports = User;