/**
 * MODÈLE PROJECT - Gestion des projets musicaux
 * Modèle Mongoose pour la gestion des projets (albums, singles, EPs, etc.)
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  type: {
    type: String,
    enum: ['album', 'single', 'ep', 'tour', 'video', 'other'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  releaseDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'recording', 'mixing', 'mastering', 'ready', 'released'],
    default: 'draft'
  },
  coverImage: {
    type: String,
    trim: true
  },
  tracks: [{
    title: String,
    duration: String,
    isrc: String
  }],
  credits: {
    producer: String,
    mixer: String,
    masterer: String,
    composer: [String],
    lyricist: [String]
  },
  distributionLinks: {
    spotify: String,
    appleMusic: String,
    deezer: String,
    youtube: String,
    bandcamp: String,
    soundcloud: String
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
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
projectSchema.index({ name: 1, artistId: 1 });
projectSchema.index({ type: 1, status: 1 });
projectSchema.index({ releaseDate: -1 });

module.exports = mongoose.model('Project', projectSchema);