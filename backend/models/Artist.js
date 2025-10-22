/**
 * MODÈLE ARTIST - Gestion des artistes
 * Modèle Mongoose pour la gestion des artistes/musiciens
 */

const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  genre: {
    type: String,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  profileImage: {
    type: String,
    trim: true
  },
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String,
    youtube: String,
    spotify: String,
    deezer: String,
    appleMusic: String
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche et performance
artistSchema.index({ name: 1, createdBy: 1 });
artistSchema.index({ genre: 1 });

module.exports = mongoose.model('Artist', artistSchema);