/**
 * MODELE EVENT - Evenements et invitations
 * Outil promo BandStream RP: gestion d'evenements, invitations, RSVP
 */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const EventSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: [true, 'Le nom de l\'evenement est obligatoire'],
    trim: true,
    maxlength: [300, 'Le nom ne peut pas depasser 300 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'La description ne peut pas depasser 5000 caracteres']
  },
  htmlDescription: {
    type: String
  },

  // Type d'evenement
  type: {
    type: String,
    enum: [
      'press_conference',    // Conference de presse
      'product_launch',      // Lancement produit
      'networking',          // Networking / cocktail
      'workshop',            // Atelier / workshop
      'webinar',             // Webinaire
      'interview_session',   // Session d'interviews
      'exhibition',          // Exposition / salon
      'gala',                // Soiree gala
      'other'
    ],
    default: 'press_conference',
    index: true
  },

  // Statut
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'invitations_sent', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'planning',
    index: true
  },

  // Dates
  startDate: {
    type: Date,
    required: [true, 'La date de debut est obligatoire'],
    index: true
  },
  endDate: {
    type: Date
  },
  timezone: {
    type: String,
    default: 'Europe/Paris'
  },

  // Lieu
  location: {
    type: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical'
    },
    // Lieu physique
    venue: String,
    address: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'France'
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    // Lieu virtuel
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'meet', 'webex', 'custom', null],
      default: null
    },
    meetingUrl: String,
    meetingId: String,
    meetingPassword: String
  },

  // Capacite
  capacity: {
    max: {
      type: Number,
      default: 0 // 0 = illimite
    },
    reserved: {
      type: Number,
      default: 0
    }
  },

  // Contacts invites et RSVP
  invitedContacts: [{
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    rsvpStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative', 'no_response'],
      default: 'pending'
    },
    rsvpAt: Date,
    rsvpComment: String,
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    // Infos supplementaires par invite
    dietaryRestrictions: String,
    plusOne: {
      type: Boolean,
      default: false
    },
    specialRequests: String
  }],

  // Programme / Agenda
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String,
    duration: Number // en minutes
  }],

  // Communications
  invitation: {
    subject: String,
    content: String,
    htmlContent: String,
    sentAt: Date,
    reminderSentAt: Date
  },

  // Documents associes
  linkedPressReleases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PressRelease'
  }],
  mediaKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaKit'
  },

  // Medias
  featuredImage: {
    url: String,
    caption: String,
    credit: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    type: {
      type: String,
      enum: ['invitation', 'program', 'map', 'press_kit', 'photo', 'other'],
      default: 'other'
    }
  }],

  // Budget
  budget: {
    estimated: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    items: [{
      label: String,
      amount: Number,
      category: String
    }]
  },

  // Metriques
  metrics: {
    totalInvited: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    totalDeclined: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
    attendanceRate: { type: Number, default: 0, min: 0, max: 100 },
    mediaPickups: { type: Number, default: 0 },
    socialMentions: { type: Number, default: 0 },
    lastUpdated: Date
  },

  // Metadata
  tags: [String],
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
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'events'
});

// Index
EventSchema.index({ organizationId: 1, status: 1 });
EventSchema.index({ organizationId: 1, startDate: -1 });
EventSchema.index({ type: 1, startDate: -1 });
EventSchema.index({ createdBy: 1, status: 1 });
EventSchema.index({ 'invitedContacts.contactId': 1 });
EventSchema.index({ name: 'text', description: 'text' });

EventSchema.plugin(mongoosePaginate);

// Methodes d'instance

EventSchema.methods.updateMetrics = function() {
  const invited = this.invitedContacts || [];
  this.metrics.totalInvited = invited.length;
  this.metrics.totalAccepted = invited.filter(c => c.rsvpStatus === 'accepted').length;
  this.metrics.totalDeclined = invited.filter(c => c.rsvpStatus === 'declined').length;
  this.metrics.totalCheckedIn = invited.filter(c => c.checkedIn).length;

  if (this.metrics.totalInvited > 0) {
    this.metrics.acceptanceRate = (this.metrics.totalAccepted / this.metrics.totalInvited) * 100;
  }
  if (this.metrics.totalAccepted > 0) {
    this.metrics.attendanceRate = (this.metrics.totalCheckedIn / this.metrics.totalAccepted) * 100;
  }

  this.metrics.lastUpdated = new Date();
};

EventSchema.methods.addInvitee = function(contactId) {
  const existing = this.invitedContacts.find(
    c => c.contactId.toString() === contactId.toString()
  );
  if (existing) {
    throw new Error('Ce contact est deja invite');
  }

  // Verifier la capacite
  if (this.capacity.max > 0 && this.invitedContacts.length >= this.capacity.max) {
    throw new Error('Capacite maximale atteinte');
  }

  this.invitedContacts.push({ contactId });
  this.updateMetrics();
};

EventSchema.methods.updateRSVP = function(contactId, rsvpStatus, comment) {
  const invite = this.invitedContacts.find(
    c => c.contactId.toString() === contactId.toString()
  );
  if (!invite) {
    throw new Error('Contact non trouve dans la liste des invites');
  }

  invite.rsvpStatus = rsvpStatus;
  invite.rsvpAt = new Date();
  if (comment) invite.rsvpComment = comment;

  this.updateMetrics();
};

EventSchema.methods.checkIn = function(contactId) {
  const invite = this.invitedContacts.find(
    c => c.contactId.toString() === contactId.toString()
  );
  if (!invite) {
    throw new Error('Contact non trouve dans la liste des invites');
  }

  invite.checkedIn = true;
  invite.checkedInAt = new Date();
  this.updateMetrics();
};

EventSchema.methods.isUpcoming = function() {
  return this.startDate > new Date() && !['cancelled', 'postponed'].includes(this.status);
};

EventSchema.methods.isPast = function() {
  return this.endDate ? this.endDate < new Date() : this.startDate < new Date();
};

// Pre-save: recalculer les metriques
EventSchema.pre('save', function(next) {
  if (this.isModified('invitedContacts')) {
    this.updateMetrics();
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
