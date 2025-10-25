/**
 * MODÈLE USER - Gestion des utilisateurs avec sécurité
 * Modèle Mongoose pour l'authentification et la gestion des utilisateurs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    minLength: [8, 'Le mot de passe doit contenir au moins 8 caractères']
  },
  company: {
    type: String,
    trim: true,
    maxLength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
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
userSchema.index({ email: 1 });
userSchema.index({ company: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

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
    role: this.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'presspilot',
    audience: 'presspilot-users'
  });
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

// Méthode pour obtenir les données publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    company: this.company,
    role: this.role,
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
    console.log(`Nettoyage des données pour l'utilisateur: ${this.email}`);
    next();
  } catch (error) {
    next(error);
  }
});

// Créer le modèle
const User = mongoose.model('User', userSchema);

module.exports = User;