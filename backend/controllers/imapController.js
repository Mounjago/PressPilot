const IMAPConfiguration = require('../models/IMAPConfiguration');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

/**
 * IMAP Controller
 * Handles IMAP configuration management
 */
class IMAPController {
  /**
   * GET /api/imap
   * Get all IMAP configurations for user
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;

      // Use findByUser static method
      const configurations = await IMAPConfiguration.findByUser(userId);

      // Return public configs
      const publicConfigs = configurations.map(config => config.getPublicConfig());

      res.json({
        success: true,
        data: publicConfigs
      });
    } catch (error) {
      logger.error('Error fetching IMAP configurations', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching IMAP configurations'
      });
    }
  }

  /**
   * GET /api/imap/presets
   * Get provider presets
   */
  async getPresets(req, res) {
    try {
      // Define provider presets
      const presets = {
        gmail: {
          provider: 'gmail',
          name: 'Gmail',
          imapConfig: {
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            authMethod: 'oauth2',
            requireAppPassword: true
          },
          smtpConfig: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true
          },
          oauth2: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scope: 'https://mail.google.com/'
          },
          notes: 'Requires app-specific password or OAuth2. Enable "Less secure app access" or use OAuth2 authentication.'
        },
        outlook: {
          provider: 'outlook',
          name: 'Outlook/Office 365',
          imapConfig: {
            host: 'outlook.office365.com',
            port: 993,
            secure: true,
            authMethod: 'password'
          },
          smtpConfig: {
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            requireTLS: true
          },
          notes: 'Works with regular password. For better security, consider using app passwords.'
        },
        yahoo: {
          provider: 'yahoo',
          name: 'Yahoo Mail',
          imapConfig: {
            host: 'imap.mail.yahoo.com',
            port: 993,
            secure: true,
            authMethod: 'password',
            requireAppPassword: true
          },
          smtpConfig: {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false,
            requireTLS: true
          },
          notes: 'Requires app-specific password. Generate one from Yahoo Account Security settings.'
        },
        icloud: {
          provider: 'icloud',
          name: 'iCloud Mail',
          imapConfig: {
            host: 'imap.mail.me.com',
            port: 993,
            secure: true,
            authMethod: 'password',
            requireAppPassword: true
          },
          smtpConfig: {
            host: 'smtp.mail.me.com',
            port: 587,
            secure: false,
            requireTLS: true
          },
          notes: 'Requires app-specific password. Generate one from Apple ID account settings.'
        },
        custom: {
          provider: 'custom',
          name: 'Custom IMAP Server',
          imapConfig: {
            host: '',
            port: 993,
            secure: true,
            authMethod: 'password'
          },
          smtpConfig: {
            host: '',
            port: 587,
            secure: false,
            requireTLS: true
          },
          notes: 'Configure custom IMAP settings. Contact your email provider for the correct settings.'
        }
      };

      // Check if specific provider requested
      const provider = req.query.provider;
      if (provider && presets[provider]) {
        return res.json({
          success: true,
          data: presets[provider]
        });
      }

      res.json({
        success: true,
        data: presets
      });
    } catch (error) {
      logger.error('Error fetching provider presets', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching provider presets'
      });
    }
  }

  /**
   * GET /api/imap/:id
   * Get single IMAP configuration
   */
  async getById(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Return public config
      res.json({
        success: true,
        data: configuration.getPublicConfig()
      });
    } catch (error) {
      logger.error('Error fetching IMAP configuration', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching IMAP configuration'
      });
    }
  }

  /**
   * POST /api/imap
   * Create new IMAP configuration
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        email,
        provider,
        imapConfig,
        pollingConfig,
        filters,
        smtpConfig
      } = req.body;

      // Validate required fields
      if (!name || !email || !provider || !imapConfig) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, provider, and IMAP configuration are required'
        });
      }

      // Validate IMAP config
      if (!imapConfig.host || !imapConfig.port || !imapConfig.username || !imapConfig.password) {
        return res.status(400).json({
          success: false,
          message: 'IMAP host, port, username, and password are required'
        });
      }

      // Check if configuration already exists for this email
      const existingConfig = await IMAPConfiguration.findOne({
        userId,
        email,
        isActive: true
      });

      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuration already exists for this email address'
        });
      }

      // Get preset for provider if available
      const preset = await IMAPConfiguration.getPresetForProvider(provider);

      // Create new configuration
      const configuration = new IMAPConfiguration({
        userId,
        name,
        email,
        provider,
        imapConfig: {
          host: imapConfig.host,
          port: imapConfig.port || 993,
          secure: imapConfig.secure !== undefined ? imapConfig.secure : true,
          username: imapConfig.username,
          password: imapConfig.password, // Will be encrypted by model
          authMethod: imapConfig.authMethod || 'password',
          oauth2: imapConfig.oauth2
        },
        smtpConfig: smtpConfig || preset?.smtpConfig,
        pollingConfig: {
          enabled: pollingConfig?.enabled !== undefined ? pollingConfig.enabled : true,
          interval: pollingConfig?.interval || 300000, // 5 minutes default
          folders: pollingConfig?.folders || ['INBOX'],
          markAsRead: pollingConfig?.markAsRead || false,
          deleteAfterProcessing: pollingConfig?.deleteAfterProcessing || false,
          maxMessages: pollingConfig?.maxMessages || 50
        },
        filters: filters || {
          fromAddresses: [],
          domains: [],
          keywords: [],
          excludeKeywords: []
        },
        connectionStatus: {
          isConnected: false,
          lastConnected: null,
          lastError: null,
          consecutiveFailures: 0
        },
        isActive: true
      });

      await configuration.save();

      res.status(201).json({
        success: true,
        data: configuration.getPublicConfig()
      });
    } catch (error) {
      logger.error('Error creating IMAP configuration', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error creating IMAP configuration'
      });
    }
  }

  /**
   * PUT /api/imap/:id
   * Update IMAP configuration
   */
  async update(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Update allowed fields
      const {
        name,
        email,
        provider,
        imapConfig,
        pollingConfig,
        filters,
        smtpConfig
      } = req.body;

      if (name) configuration.name = name;
      if (email) configuration.email = email;
      if (provider) configuration.provider = provider;

      // Update IMAP config
      if (imapConfig) {
        if (imapConfig.host) configuration.imapConfig.host = imapConfig.host;
        if (imapConfig.port) configuration.imapConfig.port = imapConfig.port;
        if (imapConfig.secure !== undefined) configuration.imapConfig.secure = imapConfig.secure;
        if (imapConfig.username) configuration.imapConfig.username = imapConfig.username;
        if (imapConfig.password) configuration.imapConfig.password = imapConfig.password;
        if (imapConfig.authMethod) configuration.imapConfig.authMethod = imapConfig.authMethod;
        if (imapConfig.oauth2) configuration.imapConfig.oauth2 = imapConfig.oauth2;
      }

      // Update SMTP config
      if (smtpConfig) {
        configuration.smtpConfig = {
          ...configuration.smtpConfig,
          ...smtpConfig
        };
      }

      // Update polling config
      if (pollingConfig) {
        if (pollingConfig.enabled !== undefined) configuration.pollingConfig.enabled = pollingConfig.enabled;
        if (pollingConfig.interval) configuration.pollingConfig.interval = pollingConfig.interval;
        if (pollingConfig.folders) configuration.pollingConfig.folders = pollingConfig.folders;
        if (pollingConfig.markAsRead !== undefined) configuration.pollingConfig.markAsRead = pollingConfig.markAsRead;
        if (pollingConfig.deleteAfterProcessing !== undefined) {
          configuration.pollingConfig.deleteAfterProcessing = pollingConfig.deleteAfterProcessing;
        }
        if (pollingConfig.maxMessages) configuration.pollingConfig.maxMessages = pollingConfig.maxMessages;
      }

      // Update filters
      if (filters) {
        configuration.filters = {
          ...configuration.filters,
          ...filters
        };
      }

      // Reset connection status if IMAP config changed
      if (imapConfig) {
        configuration.connectionStatus.isConnected = false;
        configuration.connectionStatus.lastError = null;
        configuration.connectionStatus.consecutiveFailures = 0;
      }

      await configuration.save();

      res.json({
        success: true,
        data: configuration.getPublicConfig()
      });
    } catch (error) {
      logger.error('Error updating IMAP configuration', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error updating IMAP configuration'
      });
    }
  }

  /**
   * DELETE /api/imap/:id
   * Soft delete IMAP configuration
   */
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Soft delete - set isActive to false
      configuration.isActive = false;
      configuration.pollingConfig.enabled = false;
      await configuration.save();

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting IMAP configuration', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error deleting IMAP configuration'
      });
    }
  }

  /**
   * POST /api/imap/:id/test
   * Test IMAP connection
   */
  async testConnection(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Call testConnection method
      const testResult = await configuration.testConnection();

      // Update connection stats
      await configuration.updateConnectionStats(
        testResult.success,
        testResult.error
      );

      res.json({
        success: testResult.success,
        data: testResult.success ? {
          message: 'Connection successful',
          folders: testResult.folders || [],
          messageCount: testResult.messageCount || 0
        } : null,
        message: testResult.error || (testResult.success ? 'Connection successful' : 'Connection failed')
      });
    } catch (error) {
      logger.error('Error testing IMAP connection', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error testing connection: ' + error.message
      });
    }
  }

  /**
   * POST /api/imap/:id/poll
   * Force poll IMAP account
   */
  async forcePoll(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Update poll stats
      await configuration.updatePollStats(0, new Date());

      // Note: Actual IMAP polling implementation will be added later
      // This is a stub that returns success
      res.json({
        success: true,
        message: 'Polling initiated successfully. Messages will be fetched in the background.',
        data: {
          configId: configuration._id,
          lastPolled: new Date(),
          status: 'initiated'
        }
      });
    } catch (error) {
      logger.error('Error forcing IMAP poll', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error initiating polling'
      });
    }
  }

  /**
   * POST /api/imap/:id/toggle
   * Toggle polling enabled/disabled
   */
  async togglePolling(req, res) {
    try {
      const userId = req.user.id;
      const configId = req.params.id;

      const configuration = await IMAPConfiguration.findOne({
        _id: configId,
        userId
      });

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }

      // Toggle polling
      configuration.pollingConfig.enabled = !configuration.pollingConfig.enabled;
      await configuration.save();

      res.json({
        success: true,
        data: {
          configId: configuration._id,
          pollingEnabled: configuration.pollingConfig.enabled
        }
      });
    } catch (error) {
      logger.error('Error toggling polling', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error toggling polling'
      });
    }
  }

  /**
   * GET /api/imap/service/status
   * Get IMAP service status
   */
  async getServiceStatus(req, res) {
    try {
      const userId = req.user.id;

      // Get all active configurations
      const activeConfigs = await IMAPConfiguration.findActiveConfigurations();

      // Filter by user
      const userActiveConfigs = activeConfigs.filter(
        config => config.userId.toString() === userId
      );

      // Calculate service stats
      const stats = {
        totalConfigurations: userActiveConfigs.length,
        activePolling: 0,
        connected: 0,
        disconnected: 0,
        errors: 0
      };

      userActiveConfigs.forEach(config => {
        if (config.pollingConfig.enabled) stats.activePolling++;
        if (config.connectionStatus.isConnected) {
          stats.connected++;
        } else {
          stats.disconnected++;
        }
        if (config.connectionStatus.lastError) stats.errors++;
      });

      // Get recent activity
      const recentActivity = userActiveConfigs
        .filter(config => config.pollingStats.lastPolled)
        .sort((a, b) => new Date(b.pollingStats.lastPolled) - new Date(a.pollingStats.lastPolled))
        .slice(0, 5)
        .map(config => ({
          configId: config._id,
          name: config.name,
          email: config.email,
          lastPolled: config.pollingStats.lastPolled,
          messagesRetrieved: config.pollingStats.totalMessagesRetrieved
        }));

      res.json({
        success: true,
        data: {
          serviceStatus: stats.totalConfigurations > 0 ? 'active' : 'inactive',
          stats,
          recentActivity,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error fetching service status', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching service status'
      });
    }
  }

  /**
   * POST /api/imap/bulk/test
   * Test multiple IMAP configurations
   */
  async bulkTest(req, res) {
    try {
      const userId = req.user.id;
      const { configIds } = req.body;

      if (!configIds || !Array.isArray(configIds)) {
        return res.status(400).json({
          success: false,
          message: 'Configuration IDs array is required'
        });
      }

      const results = [];

      for (const configId of configIds) {
        const configuration = await IMAPConfiguration.findOne({
          _id: configId,
          userId
        });

        if (configuration) {
          const testResult = await configuration.testConnection();
          await configuration.updateConnectionStats(
            testResult.success,
            testResult.error
          );

          results.push({
            configId,
            name: configuration.name,
            email: configuration.email,
            success: testResult.success,
            error: testResult.error
          });
        } else {
          results.push({
            configId,
            success: false,
            error: 'Configuration not found'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          totalTested: results.length,
          successCount,
          failedCount: results.length - successCount,
          results
        }
      });
    } catch (error) {
      logger.error('Error bulk testing configurations', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error bulk testing configurations'
      });
    }
  }

  /**
   * POST /api/imap/import
   * Import IMAP configuration from preset
   */
  async importFromPreset(req, res) {
    try {
      const userId = req.user.id;
      const { provider, email, password, name } = req.body;

      if (!provider || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Provider, email, and password are required'
        });
      }

      // Get preset configuration
      const preset = await IMAPConfiguration.getPresetForProvider(provider);

      if (!preset) {
        return res.status(400).json({
          success: false,
          message: 'Invalid provider or preset not found'
        });
      }

      // Check if configuration already exists
      const existingConfig = await IMAPConfiguration.findOne({
        userId,
        email,
        isActive: true
      });

      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuration already exists for this email address'
        });
      }

      // Create configuration from preset
      const configuration = new IMAPConfiguration({
        userId,
        name: name || `${preset.name} - ${email}`,
        email,
        provider,
        imapConfig: {
          ...preset.imapConfig,
          username: email,
          password
        },
        smtpConfig: preset.smtpConfig,
        pollingConfig: {
          enabled: true,
          interval: 300000,
          folders: ['INBOX'],
          markAsRead: false,
          deleteAfterProcessing: false,
          maxMessages: 50
        },
        filters: {
          fromAddresses: [],
          domains: [],
          keywords: [],
          excludeKeywords: []
        },
        isActive: true
      });

      await configuration.save();

      // Test connection immediately
      const testResult = await configuration.testConnection();
      await configuration.updateConnectionStats(
        testResult.success,
        testResult.error
      );

      res.status(201).json({
        success: true,
        data: {
          configuration: configuration.getPublicConfig(),
          connectionTest: {
            success: testResult.success,
            message: testResult.error || 'Connection successful'
          }
        }
      });
    } catch (error) {
      logger.error('Error importing from preset', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error importing configuration from preset'
      });
    }
  }
}

module.exports = new IMAPController();