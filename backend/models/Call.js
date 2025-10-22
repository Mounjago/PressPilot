/**
 * CALL MODEL - Modèle de données pour les appels
 * Définition du schéma et des méthodes pour la gestion des appels
 */

// Si vous utilisez Sequelize (PostgreSQL/MySQL)
const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// Si vous utilisez Mongoose (MongoDB)
// const mongoose = require('mongoose');

/**
 * SEQUELIZE MODEL (PostgreSQL/MySQL)
 */
const CallSequelizeModel = (sequelize) => {
  const Call = sequelize.define('Call', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Contacts',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        is: /^[\+]?[0-9\s\-\(\)\.]{10,20}$/
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM(
        'connecting',
        'connected',
        'ended',
        'missed',
        'no-answer',
        'busy'
      ),
      allowNull: false,
      defaultValue: 'connecting'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    recordingUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    ringoverCallId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de l\'appel dans Ringover'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Métadonnées additionnelles (qualité, codec, etc.)'
    }
  }, {
    tableName: 'calls',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['contactId']
      },
      {
        fields: ['startedAt']
      },
      {
        fields: ['status']
      },
      {
        fields: ['phoneNumber']
      }
    ],
    hooks: {
      beforeCreate: (call) => {
        // Validation personnalisée avant création
        if (call.endedAt && call.startedAt && call.endedAt < call.startedAt) {
          throw new Error('La date de fin ne peut pas être antérieure à la date de début');
        }
      },
      beforeUpdate: (call) => {
        // Calcul automatique de la durée si les dates sont définies
        if (call.startedAt && call.endedAt) {
          const duration = Math.floor((new Date(call.endedAt) - new Date(call.startedAt)) / 1000);
          call.duration = Math.max(0, duration);
        }
      }
    }
  });

  // Associations
  Call.associate = (models) => {
    // Relation avec Contact
    Call.belongsTo(models.Contact, {
      foreignKey: 'contactId',
      as: 'contact',
      onDelete: 'SET NULL'
    });

    // Relation avec User
    Call.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Méthodes d'instance
  Call.prototype.getDurationFormatted = function() {
    const mins = Math.floor(this.duration / 60);
    const secs = this.duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  Call.prototype.isSuccessful = function() {
    return this.status === 'ended' && this.duration > 0;
  };

  // Méthodes de classe
  Call.getCallStats = async function(userId, filters = {}) {
    const whereClause = { userId };

    if (filters.startDate) {
      whereClause.startedAt = {
        [sequelize.Sequelize.Op.gte]: filters.startDate
      };
    }

    if (filters.endDate) {
      whereClause.startedAt = {
        ...whereClause.startedAt,
        [sequelize.Sequelize.Op.lte]: filters.endDate
      };
    }

    const [totalCalls, connectedCalls, totalDuration] = await Promise.all([
      Call.count({ where: whereClause }),
      Call.count({ where: { ...whereClause, status: 'ended' } }),
      Call.sum('duration', { where: { ...whereClause, status: 'ended' } })
    ]);

    return {
      totalCalls,
      connectedCalls,
      missedCalls: totalCalls - connectedCalls,
      totalDuration: totalDuration || 0,
      averageDuration: connectedCalls > 0 ? Math.round((totalDuration || 0) / connectedCalls) : 0
    };
  };

  return Call;
};

/**
 * MONGOOSE MODEL (MongoDB)
 */
const CallMongooseSchema = {
  contactId: {
    type: String,
    ref: 'Contact',
    default: null
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[0-9\s\-\(\)\.]{10,20}$/.test(v);
      },
      message: 'Format de numéro de téléphone invalide'
    },
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy'],
    default: 'connecting',
    index: true
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  recordingUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'URL d\'enregistrement invalide'
    }
  },
  ringoverCallId: {
    type: String,
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  }
};

// Schema avec middleware et méthodes
const CallMongooseModel = (mongoose) => {
  const callSchema = new mongoose.Schema(CallMongooseSchema, {
    timestamps: true
  });

  // Index composites
  callSchema.index({ userId: 1, startedAt: -1 });
  callSchema.index({ contactId: 1, startedAt: -1 });

  // Middleware pre-save
  callSchema.pre('save', function(next) {
    // Calcul automatique de la durée
    if (this.startedAt && this.endedAt) {
      this.duration = Math.max(0, Math.floor((this.endedAt - this.startedAt) / 1000));
    }

    // Validation des dates
    if (this.endedAt && this.startedAt && this.endedAt < this.startedAt) {
      return next(new Error('La date de fin ne peut pas être antérieure à la date de début'));
    }

    next();
  });

  // Méthodes d'instance
  callSchema.methods.getDurationFormatted = function() {
    const mins = Math.floor(this.duration / 60);
    const secs = this.duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  callSchema.methods.isSuccessful = function() {
    return this.status === 'ended' && this.duration > 0;
  };

  // Méthodes statiques
  callSchema.statics.getCallStats = async function(userId, filters = {}) {
    const matchStage = { userId };

    if (filters.startDate) {
      matchStage.startedAt = { $gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      matchStage.startedAt = { ...matchStage.startedAt, $lte: new Date(filters.endDate) };
    }

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          connectedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          },
          totalDuration: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, '$duration', 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalCalls: 0,
      connectedCalls: 0,
      totalDuration: 0
    };

    return {
      ...result,
      missedCalls: result.totalCalls - result.connectedCalls,
      averageDuration: result.connectedCalls > 0
        ? Math.round(result.totalDuration / result.connectedCalls)
        : 0
    };
  };

  return callSchema;
};

/**
 * MIGRATION SQL
 */
const createCallsTableSQL = `
-- Migration pour créer la table calls
CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP NULL,
  duration INTEGER NOT NULL DEFAULT 0 CHECK (duration >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'connecting'
    CHECK (status IN ('connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy')),
  notes TEXT,
  recording_url VARCHAR(500),
  ringover_call_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_user_started ON calls(user_id, started_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

module.exports = {
  CallSequelizeModel,
  CallMongooseModel,
  createCallsTableSQL
};