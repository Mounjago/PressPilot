const Message = require('../models/Message');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

/**
 * Messages Controller
 * Handles all message-related endpoints
 */
class MessagesController {
  /**
   * GET /api/messages
   * Get all messages for authenticated user
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { userId };

      // Add optional filters
      if (req.query.source) {
        filter.source = req.query.source;
      }
      if (req.query.type) {
        filter.type = req.query.type;
      }
      if (req.query.seen !== undefined) {
        filter.seen = req.query.seen === 'true';
      }
      if (req.query.flagged !== undefined) {
        filter.flagged = req.query.flagged === 'true';
      }
      if (req.query.archived !== undefined) {
        filter.archived = req.query.archived === 'true';
      }

      // Get messages with pagination
      const messages = await Message.find(filter)
        .sort('-receivedAt')
        .skip(skip)
        .limit(limit)
        .populate('configId', 'name email')
        .populate('campaignId', 'name');

      // Get total count for pagination
      const totalCount = await Message.countDocuments(filter);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching messages', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching messages'
      });
    }
  }

  /**
   * GET /api/messages/:id
   * Get single message by ID
   */
  async getById(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;

      const message = await Message.findOne({
        _id: messageId,
        userId
      })
        .populate('configId', 'name email')
        .populate('campaignId', 'name')
        .populate('contactId', 'email name organization');

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error fetching message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching message'
      });
    }
  }

  /**
   * GET /api/messages/search
   * Search messages
   */
  async search(req, res) {
    try {
      const userId = req.user.id;
      const query = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Build options for search
      const options = {
        page,
        limit,
        source: req.query.source,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        flagged: req.query.flagged,
        archived: req.query.archived
      };

      // Use Message.search static method
      const results = await Message.search(query, userId, options);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error searching messages', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error searching messages'
      });
    }
  }

  /**
   * PATCH /api/messages/:id/read
   * Mark message as read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;

      const message = await Message.findOne({
        _id: messageId,
        userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Call markAsRead method
      await message.markAsRead();

      res.json({
        success: true,
        data: {
          _id: message._id,
          seen: message.seen,
          seenAt: message.seenAt
        }
      });
    } catch (error) {
      logger.error('Error marking message as read', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error marking message as read'
      });
    }
  }

  /**
   * PATCH /api/messages/:id/flag
   * Toggle message flag
   */
  async markAsFlagged(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const flagged = req.body.flagged !== undefined ? req.body.flagged : true;

      const message = await Message.findOne({
        _id: messageId,
        userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Call markAsFlagged method
      await message.markAsFlagged(flagged);

      res.json({
        success: true,
        data: {
          _id: message._id,
          flagged: message.flagged,
          flaggedAt: message.flaggedAt
        }
      });
    } catch (error) {
      logger.error('Error flagging message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error flagging message'
      });
    }
  }

  /**
   * PATCH /api/messages/:id/archive
   * Archive message
   */
  async archive(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const archived = req.body.archived !== undefined ? req.body.archived : true;

      const message = await Message.findOne({
        _id: messageId,
        userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Call archive method
      await message.archive(archived);

      res.json({
        success: true,
        data: {
          _id: message._id,
          archived: message.archived,
          archivedAt: message.archivedAt
        }
      });
    } catch (error) {
      logger.error('Error archiving message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error archiving message'
      });
    }
  }

  /**
   * POST /api/messages/:id/tags
   * Add tag to message
   */
  async addTag(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const { tag } = req.body;

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: 'Tag is required'
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Call addTag method
      await message.addTag(tag);

      res.json({
        success: true,
        data: {
          _id: message._id,
          tags: message.tags
        }
      });
    } catch (error) {
      logger.error('Error adding tag to message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error adding tag to message'
      });
    }
  }

  /**
   * DELETE /api/messages/:id/tags/:tag
   * Remove tag from message
   */
  async removeTag(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const tag = req.params.tag;

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: 'Tag is required'
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Call removeTag method
      await message.removeTag(tag);

      res.json({
        success: true,
        data: {
          _id: message._id,
          tags: message.tags
        }
      });
    } catch (error) {
      logger.error('Error removing tag from message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error removing tag from message'
      });
    }
  }

  /**
   * GET /api/messages/stats
   * Get message statistics
   */
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Use Message.getStats static method
      const stats = await Message.getStats(userId, { startDate, endDate: now });

      res.json({
        success: true,
        data: {
          ...stats,
          period
        }
      });
    } catch (error) {
      logger.error('Error fetching message stats', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching message statistics'
      });
    }
  }

  /**
   * GET /api/messages/config/:configId
   * Get messages by IMAP configuration
   */
  async getByConfig(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.configId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Build options
      const options = {
        page,
        limit,
        seen: req.query.seen,
        flagged: req.query.flagged,
        archived: req.query.archived,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      // Use Message.findByConfig static method
      const results = await Message.findByConfig(configId, userId, options);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error fetching messages by config', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching messages by configuration'
      });
    }
  }

  /**
   * GET /api/messages/campaign/:campaignId
   * Get messages by campaign
   */
  async getByCampaign(req, res) {
    try {
      const userId = req.user.id;
      const campaignId = req.params.campaignId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Build options
      const options = {
        page,
        limit,
        type: req.query.type,
        seen: req.query.seen,
        flagged: req.query.flagged,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      // Use Message.findByCampaign static method
      const results = await Message.findByCampaign(campaignId, userId, options);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error fetching messages by campaign', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching messages by campaign'
      });
    }
  }

  /**
   * POST /api/messages/bulk/read
   * Mark multiple messages as read
   */
  async bulkMarkAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { messageIds } = req.body;

      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          message: 'Message IDs array is required'
        });
      }

      // Update multiple messages
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          userId,
          seen: false
        },
        {
          $set: {
            seen: true,
            seenAt: new Date()
          }
        }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      logger.error('Error bulk marking messages as read', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error bulk marking messages as read'
      });
    }
  }

  /**
   * POST /api/messages/bulk/archive
   * Archive multiple messages
   */
  async bulkArchive(req, res) {
    try {
      const userId = req.user.id;
      const { messageIds, archived = true } = req.body;

      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          message: 'Message IDs array is required'
        });
      }

      // Update multiple messages
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          userId
        },
        {
          $set: {
            archived,
            archivedAt: archived ? new Date() : null
          }
        }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      logger.error('Error bulk archiving messages', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error bulk archiving messages'
      });
    }
  }

  /**
   * DELETE /api/messages/:id
   * Delete a message
   */
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;

      const result = await Message.deleteOne({
        _id: messageId,
        userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting message', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error deleting message'
      });
    }
  }

  /**
   * POST /api/messages/bulk/delete
   * Delete multiple messages
   */
  async bulkDelete(req, res) {
    try {
      const userId = req.user.id;
      const { messageIds } = req.body;

      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          message: 'Message IDs array is required'
        });
      }

      const result = await Message.deleteMany({
        _id: { $in: messageIds },
        userId
      });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      logger.error('Error bulk deleting messages', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error bulk deleting messages'
      });
    }
  }
}

module.exports = new MessagesController();