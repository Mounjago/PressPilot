/**
 * MODELE ORGANIZATION
 * Represente une organisation (ex: BandStream) pour le multi-workspace
 * Les utilisateurs bandstream_rp sont rattaches a une organisation
 */

const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'organisation est obligatoire'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas depasser 200 caracteres']
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets']
  },

  type: {
    type: String,
    enum: ['label', 'agency', 'corporate', 'independent'],
    default: 'corporate'
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas depasser 500 caracteres']
  },

  logo: {
    type: String,
    default: null
  },

  website: {
    type: String,
    trim: true
  },

  // Contact principal de l'organisation
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Adresse
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'France'
    }
  },

  // Parametres specifiques a l'organisation
  settings: {
    // Nombre max d'utilisateurs autorises
    maxUsers: {
      type: Number,
      default: 50
    },
    // Fonctionnalites activees
    features: {
      pressReleases: {
        type: Boolean,
        default: true
      },
      events: {
        type: Boolean,
        default: true
      },
      mediaKits: {
        type: Boolean,
        default: true
      },
      aiOptimization: {
        type: Boolean,
        default: false
      },
      sharedContactPool: {
        type: Boolean,
        default: true
      }
    },
    // Branding personnalise
    branding: {
      primaryColor: {
        type: String,
        default: '#10b981' // emerald-500
      },
      secondaryColor: {
        type: String,
        default: '#059669' // emerald-600
      }
    }
  },

  // Abonnement de l'organisation
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'professional'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'suspended', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date
  },

  // Statistiques (cache, mises a jour periodiquement)
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalContacts: {
      type: Number,
      default: 0
    },
    totalCampaigns: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'organizations'
});

// Index
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ type: 1, isActive: 1 });

// Methodes d'instance

/**
 * Verifie si l'organisation peut accueillir un nouveau membre
 */
OrganizationSchema.methods.canAddMember = function() {
  return this.stats.totalMembers < this.settings.maxUsers;
};

/**
 * Verifie si une fonctionnalite est activee
 */
OrganizationSchema.methods.hasFeature = function(featureName) {
  return this.settings.features[featureName] === true;
};

/**
 * Retourne les infos publiques de l'organisation
 */
OrganizationSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    type: this.type,
    logo: this.logo,
    website: this.website,
    subscription: {
      plan: this.subscription.plan,
      status: this.subscription.status
    }
  };
};

// Methodes statiques

/**
 * Trouve une organisation par son slug
 */
OrganizationSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

/**
 * Met a jour les stats de l'organisation
 */
OrganizationSchema.statics.updateStats = async function(orgId) {
  const User = mongoose.model('User');
  const Contact = mongoose.model('Contact');
  const Campaign = mongoose.model('Campaign');

  const [memberCount, contactCount, campaignCount] = await Promise.all([
    User.countDocuments({ organizationId: orgId, isActive: true }),
    Contact.countDocuments({ organizationId: orgId, isArchived: false }),
    Campaign.countDocuments({ organizationId: orgId, isArchived: false })
  ]);

  return this.findByIdAndUpdate(orgId, {
    $set: {
      'stats.totalMembers': memberCount,
      'stats.totalContacts': contactCount,
      'stats.totalCampaigns': campaignCount,
      'stats.lastUpdated': new Date()
    }
  }, { new: true });
};

// Pre-save: generer le slug si absent
OrganizationSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
