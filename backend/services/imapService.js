/**
 * SERVICE IMAP - Gestion du polling et traitement des emails entrants
 * Service pour connecter aux boîtes IMAP des utilisateurs et récupérer les réponses
 * Intégré avec Bull Queue pour la scalabilité
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const IMAPConfiguration = require('../models/IMAPConfiguration');
const EmailTracking = require('../models/EmailTracking');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const UnassociatedEmail = require('../models/UnassociatedEmail');
const queueService = require('./queueService');

class IMAPService {
  constructor() {
    this.activeConnections = new Map();
    this.isRunning = false;
  }

  /**
   * Démarrer le service de polling IMAP
   */
  async start() {
    if (this.isRunning) {
      console.log('📧 Service IMAP déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 Démarrage du service IMAP');
    this.isRunning = true;

    // Initialiser le service de queue
    if (!queueService.isInitialized) {
      await queueService.initialize();
    }

    // Charger toutes les configurations actives et les programmer dans la queue
    await this.loadActiveConfigurations();

    // Démarrer le monitoring des configurations
    this.startConfigurationMonitoring();

    console.log('✅ Service IMAP démarré avec système de queue');
  }

  /**
   * Arrêter le service de polling IMAP
   */
  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Arrêt du service IMAP');
    this.isRunning = false;

    // Fermer toutes les connexions actives
    for (const [configId, connection] of this.activeConnections) {
      if (connection.imap) {
        connection.imap.end();
      }
    }
    this.activeConnections.clear();

    // Fermer le service de queue si nécessaire
    // Note: on ne ferme pas la queue ici car elle peut être utilisée par d'autres services

    console.log('✅ Service IMAP arrêté');
  }

  /**
   * Charger les configurations actives et programmer le polling dans la queue
   */
  async loadActiveConfigurations() {
    try {
      const configurations = await IMAPConfiguration.findActiveConfigurations();
      console.log(`📋 ${configurations.length} configuration(s) IMAP active(s) trouvée(s)`);

      for (const config of configurations) {
        await this.startPollingForConfiguration(config);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des configurations:', error);
    }
  }

  /**
   * Démarrer le polling pour une configuration spécifique avec queue
   */
  async startPollingForConfiguration(config) {
    try {
      // Tester la connexion d'abord
      await this.testConnection(config);

      // Programmer le polling récurrent dans la queue
      await queueService.scheduleImapPolling(
        config._id.toString(),
        config.pollingConfig.intervalMinutes
      );

      // Premier poll immédiat
      await queueService.forceImapPolling(config._id.toString());

      console.log(`🔄 Polling programmé pour ${config.name} (${config.email}) - Intervalle: ${config.pollingConfig.intervalMinutes}min`);

    } catch (error) {
      console.error(`❌ Impossible de démarrer le polling pour ${config.name}:`, error);
      await config.updateConnectionStats(false, error);
    }
  }

  /**
   * Arrêter le polling pour une configuration
   */
  async stopPollingForConfiguration(configId) {
    try {
      await queueService.cancelImapPolling(configId.toString());

      const connection = this.activeConnections.get(configId.toString());
      if (connection && connection.imap) {
        connection.imap.end();
        this.activeConnections.delete(configId.toString());
      }

      console.log(`🛑 Polling arrêté pour configuration: ${configId}`);
    } catch (error) {
      console.error(`❌ Erreur arrêt polling pour ${configId}:`, error);
    }
  }

  /**
   * Tester une connexion IMAP
   */
  async testConnection(config) {
    return new Promise((resolve, reject) => {
      const imap = new Imap(config.getIMAPConnectionConfig());
      const timeout = setTimeout(() => {
        imap.destroy();
        reject(new Error('Timeout de connexion'));
      }, 15000);

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      try {
        imap.connect();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Effectuer un poll pour une configuration (version avec queue)
   */
  async pollConfiguration(config) {
    console.log(`📥 Polling emails pour ${config.name} (${config.email})`);

    let messagesFound = 0;
    let messagesQueued = 0;
    let errors = [];

    try {
      const emails = await this.fetchEmails(config);
      messagesFound = emails.length;

      console.log(`📧 ${messagesFound} email(s) trouvé(s) pour ${config.name}`);

      for (const email of emails) {
        try {
          // Ajouter l'email à la queue au lieu de le traiter directement
          await queueService.addEmailToQueue(email, config._id.toString());
          messagesQueued++;
          console.log(`📮 Email ajouté à la queue: ${email.messageId || email.subject}`);
        } catch (error) {
          console.error(`❌ Erreur ajout email à la queue:`, error);
          errors.push(error);
        }
      }

      // Mettre à jour les statistiques
      await config.updatePollStats(messagesFound, messagesQueued, errors);
      await config.updateConnectionStats(true);

      return {
        messagesFound,
        messagesQueued,
        errors: errors.length
      };

    } catch (error) {
      console.error(`❌ Erreur lors du polling pour ${config.name}:`, error);
      errors.push(error);
      await config.updateConnectionStats(false, error);
      await config.updatePollStats(messagesFound, messagesQueued, errors);
      throw error;
    }
  }

  /**
   * Effectuer un poll par ID de configuration (appelé par la queue)
   */
  async pollConfigurationById(configId) {
    try {
      const config = await IMAPConfiguration.findById(configId);
      if (!config) {
        throw new Error(`Configuration IMAP non trouvée: ${configId}`);
      }

      if (!config.isActive || !config.pollingConfig.enabled) {
        console.log(`⏸️ Configuration ${configId} inactive, poll ignoré`);
        return { messagesFound: 0, messagesQueued: 0, errors: 0 };
      }

      return await this.pollConfiguration(config);
    } catch (error) {
      console.error(`❌ Erreur poll configuration ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les emails depuis IMAP
   */
  async fetchEmails(config) {
    return new Promise((resolve, reject) => {
      const imap = new Imap(config.getIMAPConnectionConfig());
      const emails = [];

      imap.once('ready', () => {
        imap.openBox(config.pollingConfig.mailbox, false, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Construire les critères de recherche
          const searchCriteria = this.buildSearchCriteria(config);

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            // Limiter le nombre de messages
            const limitedResults = results.slice(0, config.pollingConfig.maxMessages);

            const fetch = imap.fetch(limitedResults, {
              bodies: '',
              markSeen: config.pollingConfig.markAsRead,
              struct: true
            });

            fetch.on('message', (msg, seqno) => {
              const email = { seqno };

              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(buffer);
                    email.parsed = parsed;
                    email.messageId = parsed.messageId;
                    email.date = parsed.date;
                    email.from = parsed.from;
                    email.to = parsed.to;
                    email.subject = parsed.subject;
                    email.text = parsed.text;
                    email.html = parsed.html;
                    email.headers = parsed.headers;
                    email.inReplyTo = parsed.inReplyTo;
                    email.references = parsed.references;
                  } catch (parseError) {
                    console.error('❌ Erreur parsing email:', parseError);
                    email.parseError = parseError;
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('❌ Erreur fetch IMAP:', err);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              imap.end();
              // Filtrer les emails qui ont été parsés correctement
              const validEmails = emails.filter(email => email.parsed && !email.parseError);
              resolve(validEmails);
            });

            // Collecter tous les emails
            fetch.on('message', (msg, seqno) => {
              emails.push({ seqno });
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('❌ Erreur connexion IMAP:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Construire les critères de recherche IMAP
   */
  buildSearchCriteria(config) {
    const criteria = [];

    // Filtrer par date si activé
    if (config.filters.dateFilter.enabled) {
      const daysBack = config.filters.dateFilter.daysBack;
      const sinceDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000));
      criteria.push(['SINCE', sinceDate]);
    }

    // Seulement les emails non lus si configuré
    if (config.pollingConfig.onlyUnread) {
      criteria.push('UNSEEN');
    }

    // Filtres de sujet
    if (config.filters.subjectFilters && config.filters.subjectFilters.length > 0) {
      const subjectCriteria = config.filters.subjectFilters.map(filter =>
        ['SUBJECT', filter]
      );
      criteria.push(['OR', ...subjectCriteria]);
    }

    // Exclure les réponses automatiques
    if (config.filters.excludeAutoReply) {
      criteria.push(['NOT', ['HEADER', 'X-Autoreply', '']]);
      criteria.push(['NOT', ['HEADER', 'Auto-Submitted', 'auto-replied']]);
    }

    return criteria.length > 0 ? criteria : ['ALL'];
  }

  /**
   * Traiter un email reçu
   */
  async processEmail(email, config) {
    try {
      console.log(`🔍 Traitement email: ${email.subject} de ${email.from?.text}`);

      // Extraire les informations de l'email
      const fromEmail = this.extractEmailAddress(email.from);
      const toEmail = this.extractEmailAddress(email.to);
      const subject = email.subject || '';
      const bodyText = email.text || '';
      const bodyHtml = email.html || '';
      const messageId = email.messageId;
      const inReplyTo = email.inReplyTo;
      const references = email.references;

      // Essayer d'identifier la campagne d'origine
      const association = await this.identifyOriginalCampaign(
        fromEmail,
        toEmail,
        subject,
        inReplyTo,
        references,
        config.userId
      );

      if (association.campaignId && association.contactId && association.trackingId) {
        // Marquer comme répondu dans le tracking
        const emailTracking = await EmailTracking.findById(association.trackingId);
        if (emailTracking) {
          emailTracking.markAsReplied(bodyText || bodyHtml);
          await emailTracking.save();

          console.log(`✅ Email associé à la campagne ${association.campaignId} - Contact ${association.contactId}`);

          // Mettre à jour les métriques de la campagne
          const campaign = await Campaign.findById(association.campaignId);
          if (campaign) {
            await campaign.updateMetrics();
          }

          // Mettre à jour les statistiques de la configuration
          config.statistics.campaignsMatched += 1;
          await config.save();
        }
      } else {
        console.log('⚠️ Email non associé, stockage pour examen manuel');

        // Stocker l'email non associé
        await this.storeUnassociatedEmail({
          fromEmail,
          toEmail,
          subject,
          bodyText,
          bodyHtml,
          messageId,
          receivedAt: email.date || new Date(),
          imapConfigId: config._id
        });

        // Mettre à jour les statistiques
        config.statistics.unassociatedEmails += 1;
        await config.save();
      }

    } catch (error) {
      console.error('❌ Erreur traitement email:', error);
      throw error;
    }
  }

  /**
   * Extraire l'adresse email d'un objet adresse
   */
  extractEmailAddress(addressObj) {
    if (!addressObj) return '';
    if (typeof addressObj === 'string') return addressObj;
    if (Array.isArray(addressObj) && addressObj.length > 0) {
      return addressObj[0].address || addressObj[0];
    }
    if (addressObj.address) return addressObj.address;
    return '';
  }

  /**
   * Identifier la campagne d'origine d'une réponse
   */
  async identifyOriginalCampaign(fromEmail, toEmail, subject, inReplyTo, references, userId) {
    try {
      // Méthode 1: Recherche par In-Reply-To header
      if (inReplyTo) {
        const tracking = await EmailTracking.findOne({
          emailId: inReplyTo
        }).populate('contactId', 'email');

        if (tracking && tracking.contactId &&
            tracking.contactId.email.toLowerCase() === fromEmail.toLowerCase()) {
          return {
            campaignId: tracking.campaignId,
            contactId: tracking.contactId._id,
            trackingId: tracking._id
          };
        }
      }

      // Méthode 2: Recherche par References header
      if (references) {
        const messageIds = Array.isArray(references) ? references : [references];
        for (const msgId of messageIds) {
          const tracking = await EmailTracking.findOne({
            emailId: msgId
          }).populate('contactId', 'email');

          if (tracking && tracking.contactId &&
              tracking.contactId.email.toLowerCase() === fromEmail.toLowerCase()) {
            return {
              campaignId: tracking.campaignId,
              contactId: tracking.contactId._id,
              trackingId: tracking._id
            };
          }
        }
      }

      // Méthode 3: Recherche par expéditeur et sujet similaire
      const contact = await Contact.findOne({
        email: { $regex: new RegExp(fromEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      });

      if (contact) {
        // Chercher les emails récents envoyés à ce contact (dernières 72h)
        const recentDate = new Date(Date.now() - 72 * 60 * 60 * 1000);

        const recentTracking = await EmailTracking.find({
          contactId: contact._id,
          sentAt: { $gte: recentDate }
        }).sort({ sentAt: -1 }).limit(10);

        // Essayer de matcher le sujet
        for (const tracking of recentTracking) {
          const campaign = await Campaign.findById(tracking.campaignId);
          if (campaign && this.isSubjectMatch(subject, campaign.subject)) {
            return {
              campaignId: tracking.campaignId,
              contactId: contact._id,
              trackingId: tracking._id
            };
          }
        }

        // Si aucun match parfait, prendre le plus récent
        if (recentTracking.length > 0) {
          const mostRecent = recentTracking[0];
          return {
            campaignId: mostRecent.campaignId,
            contactId: contact._id,
            trackingId: mostRecent._id
          };
        }
      }

      return { campaignId: null, contactId: null, trackingId: null };

    } catch (error) {
      console.error('❌ Erreur identification campagne:', error);
      return { campaignId: null, contactId: null, trackingId: null };
    }
  }

  /**
   * Vérifier si le sujet correspond à une réponse
   */
  isSubjectMatch(replySubject, originalSubject) {
    const cleanReply = replySubject.toLowerCase()
      .replace(/^(re|aw|fwd?):\s*/i, '')
      .trim();

    const cleanOriginal = originalSubject.toLowerCase().trim();

    return cleanReply.includes(cleanOriginal) || cleanOriginal.includes(cleanReply);
  }

  /**
   * Stocker un email non associé
   */
  async storeUnassociatedEmail(emailData) {
    try {
      const unassociated = new UnassociatedEmail({
        fromEmail: emailData.fromEmail,
        toEmail: emailData.toEmail,
        subject: emailData.subject,
        bodyText: emailData.bodyText,
        bodyHtml: emailData.bodyHtml,
        messageId: emailData.messageId,
        receivedAt: emailData.receivedAt,
        imapConfigId: emailData.imapConfigId,
        status: 'pending_review'
      });

      await unassociated.save();
      console.log('📝 Email non associé sauvegardé pour examen manuel');

    } catch (error) {
      console.error('❌ Erreur sauvegarde email non associé:', error);
    }
  }

  /**
   * Surveiller les changements de configuration
   */
  startConfigurationMonitoring() {
    // Vérifier les nouvelles configurations toutes les 5 minutes
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const activeConfigs = await IMAPConfiguration.findActiveConfigurations();
        console.log(`🔍 Monitoring: ${activeConfigs.length} configurations actives trouvées`);

        // Démarrer le polling pour les nouvelles configurations
        for (const config of activeConfigs) {
          try {
            // Vérifier si la configuration est déjà programmée dans la queue
            const stats = await queueService.getQueueStats();
            await this.startPollingForConfiguration(config);
          } catch (error) {
            console.error(`❌ Erreur démarrage config ${config._id}:`, error);
          }
        }

      } catch (error) {
        console.error('❌ Erreur monitoring configurations:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Obtenir le statut du service
   */
  async getStatus() {
    try {
      const queueStats = queueService.isInitialized ? await queueService.getQueueStats() : null;
      const activeConfigs = await IMAPConfiguration.findActiveConfigurations();

      return {
        isRunning: this.isRunning,
        queueInitialized: queueService.isInitialized,
        activeConfigurations: activeConfigs.length,
        activeConnections: this.activeConnections.size,
        queueStats
      };
    } catch (error) {
      console.error('❌ Erreur récupération statut:', error);
      return {
        isRunning: this.isRunning,
        queueInitialized: false,
        activeConfigurations: 0,
        activeConnections: this.activeConnections.size,
        error: error.message
      };
    }
  }

  /**
   * Forcer un poll pour une configuration spécifique
   */
  async forcePoll(configId) {
    try {
      if (!queueService.isInitialized) {
        throw new Error('Service de queue non initialisé');
      }

      // Forcer un poll immédiat via la queue
      const job = await queueService.forceImapPolling(configId);
      return {
        success: true,
        message: 'Poll forcé avec succès',
        jobId: job.id
      };

    } catch (error) {
      console.error('❌ Erreur poll forcé:', error);
      throw error;
    }
  }
}

// Créer une instance globale du service
const imapService = new IMAPService();

module.exports = imapService;