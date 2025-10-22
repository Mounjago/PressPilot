const mongoose = require('mongoose');

const EmailTrackingSchema = new mongoose.Schema({
  // Références
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true
  },
  emailId: {
    type: String,
    required: true,
    unique: true
  },

  // Données d'envoi
  sentAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Tracking des interactions
  openedAt: {
    type: Date,
    default: null,
    index: true
  },
  firstOpenedAt: {
    type: Date,
    default: null
  },
  totalOpens: {
    type: Number,
    default: 0
  },

  clickedAt: {
    type: Date,
    default: null,
    index: true
  },
  firstClickedAt: {
    type: Date,
    default: null
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  clickedLinks: [{
    url: String,
    clickedAt: Date,
    position: Number // Position du lien dans l'email
  }],

  repliedAt: {
    type: Date,
    default: null,
    index: true
  },
  replyContent: {
    type: String,
    default: null
  },

  // Métadonnées techniques
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  location: {
    country: String,
    city: String,
    timezone: String
  },

  // Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'],
    default: 'sent',
    index: true
  },
  bounceReason: {
    type: String,
    default: null
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },

  // Scores calculés
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Données pour machine learning
  mlFeatures: {
    sendHour: Number,
    sendDayOfWeek: Number,
    subjectLength: Number,
    bodyLength: Number,
    hasAttachment: Boolean,
    previousEngagement: Number
  }
}, {
  timestamps: true,
  collection: 'email_tracking'
});

// Index composés pour optimiser les requêtes analytics
EmailTrackingSchema.index({ campaignId: 1, sentAt: -1 });
EmailTrackingSchema.index({ contactId: 1, sentAt: -1 });
EmailTrackingSchema.index({ sentAt: -1, status: 1 });
EmailTrackingSchema.index({ campaignId: 1, status: 1 });

// Méthodes statiques pour analytics
EmailTrackingSchema.statics.getCampaignMetrics = async function(campaignId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        campaignId: new mongoose.Types.ObjectId(campaignId),
        sentAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSent: { $sum: 1 },
        totalOpened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
        totalClicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
        totalReplied: { $sum: { $cond: [{ $ne: ['$repliedAt', null] }, 1, 0] } },
        totalBounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
        avgEngagementScore: { $avg: '$engagementScore' },
        totalClicks: { $sum: '$totalClicks' },
        totalOpens: { $sum: '$totalOpens' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalBounced: 0,
    avgEngagementScore: 0,
    totalClicks: 0,
    totalOpens: 0
  };
};

EmailTrackingSchema.statics.getJournalistEngagement = async function(contactId, limit = 10) {
  return this.find({ contactId })
    .sort({ sentAt: -1 })
    .limit(limit)
    .populate('campaignId', 'name subject')
    .lean();
};

EmailTrackingSchema.statics.getBestSendTimes = async function(contactId) {
  const pipeline = [
    {
      $match: {
        contactId: new mongoose.Types.ObjectId(contactId),
        openedAt: { $ne: null }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$sentAt' },
          dayOfWeek: { $dayOfWeek: '$sentAt' }
        },
        totalSent: { $sum: 1 },
        totalOpened: { $sum: 1 },
        avgEngagementScore: { $avg: '$engagementScore' }
      }
    },
    {
      $project: {
        hour: '$_id.hour',
        dayOfWeek: '$_id.dayOfWeek',
        openRate: { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 100] },
        avgEngagementScore: 1
      }
    },
    {
      $sort: { openRate: -1, avgEngagementScore: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Méthodes d'instance
EmailTrackingSchema.methods.calculateEngagementScore = function() {
  let score = 0;

  // Points pour ouverture
  if (this.openedAt) score += 20;

  // Points pour clics (plus de points pour plus de clics)
  if (this.totalClicks > 0) {
    score += Math.min(30, this.totalClicks * 10);
  }

  // Points pour réponse (très important)
  if (this.repliedAt) score += 50;

  // Bonus pour rapidité de réponse
  if (this.repliedAt && this.sentAt) {
    const responseTimeHours = (this.repliedAt - this.sentAt) / (1000 * 60 * 60);
    if (responseTimeHours < 1) score += 10;
    else if (responseTimeHours < 24) score += 5;
  }

  this.engagementScore = Math.min(100, score);
  return this.engagementScore;
};

EmailTrackingSchema.methods.markAsOpened = function(deviceType, userAgent, ipAddress) {
  const now = new Date();

  if (!this.firstOpenedAt) {
    this.firstOpenedAt = now;
  }

  this.openedAt = now;
  this.totalOpens += 1;
  this.status = 'opened';

  if (deviceType) this.deviceType = deviceType;
  if (userAgent) this.userAgent = userAgent;
  if (ipAddress) this.ipAddress = ipAddress;

  this.calculateEngagementScore();
};

EmailTrackingSchema.methods.markAsClicked = function(url, position) {
  const now = new Date();

  if (!this.firstClickedAt) {
    this.firstClickedAt = now;
  }

  this.clickedAt = now;
  this.totalClicks += 1;
  this.status = 'clicked';

  this.clickedLinks.push({
    url,
    clickedAt: now,
    position
  });

  this.calculateEngagementScore();
};

EmailTrackingSchema.methods.markAsReplied = function(replyContent) {
  this.repliedAt = new Date();
  this.replyContent = replyContent;
  this.status = 'replied';
  this.calculateEngagementScore();
};

module.exports = mongoose.model('EmailTracking', EmailTrackingSchema);