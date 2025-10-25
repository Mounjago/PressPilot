/**
 * SERVICE DE QUEUE - Gestion des tâches asynchrones avec Bull Queue
 * Traitement en arrière-plan pour le polling IMAP et traitement des emails
 */

const Bull = require('bull');
const Redis = require('ioredis');

class QueueService {
  constructor() {
    this.redis = null;
    this.emailQueue = null;
    this.imapPollingQueue = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser les connexions Redis et les queues
   */
  async initialize() {
    try {
      // Configuration Redis
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        db: process.env.REDIS_DB || 0
      };

      // Créer la connexion Redis
      this.redis = new Redis(redisConfig);

      // Vérifier la connexion
      await this.redis.ping();
      console.log('✅ Connexion Redis établie');

      // Créer les queues avec Redis
      this.emailQueue = new Bull('email processing', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100, // Garder 100 jobs complétés
          removeOnFail: 50,      // Garder 50 jobs échoués
          attempts: 3,           // 3 tentatives en cas d'échec
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      this.imapPollingQueue = new Bull('imap polling', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000
          }
        }
      });

      // Configurer les processors
      this.setupQueueProcessors();

      // Configurer les événements de queue
      this.setupQueueEvents();

      this.isInitialized = true;
      console.log('✅ Service de queue initialisé avec succès');

    } catch (error) {
      console.error('❌ Erreur initialisation service de queue:', error);
      throw error;
    }
  }

  /**
   * Configuration des processors pour chaque type de job
   */
  setupQueueProcessors() {
    // Processor pour le traitement des emails
    this.emailQueue.process('processEmail', 5, async (job) => {
      const { email, configId, campaignId } = job.data;
      console.log(`📧 Traitement email ID: ${email.messageId} pour config: ${configId}`);

      try {
        const emailProcessor = require('./emailProcessor');
        const result = await emailProcessor.processIncomingEmail(email, configId, campaignId);

        console.log(`✅ Email traité avec succès: ${email.messageId}`);
        return result;
      } catch (error) {
        console.error(`❌ Erreur traitement email ${email.messageId}:`, error);
        throw error;
      }
    });

    // Processor pour le polling IMAP
    this.imapPollingQueue.process('pollConfiguration', 3, async (job) => {
      const { configId } = job.data;
      console.log(`📥 Polling IMAP pour configuration: ${configId}`);

      try {
        const imapService = require('./imapService');
        const result = await imapService.pollConfigurationById(configId);

        console.log(`✅ Polling IMAP complété pour: ${configId}`);
        return result;
      } catch (error) {
        console.error(`❌ Erreur polling IMAP ${configId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Configuration des événements de queue pour le monitoring
   */
  setupQueueEvents() {
    // Événements pour la queue email
    this.emailQueue.on('completed', (job, result) => {
      console.log(`✅ Job email complété: ${job.id}`);
    });

    this.emailQueue.on('failed', (job, err) => {
      console.error(`❌ Job email échoué: ${job.id}`, err.message);
    });

    this.emailQueue.on('stalled', (job) => {
      console.warn(`⚠️ Job email bloqué: ${job.id}`);
    });

    // Événements pour la queue IMAP polling
    this.imapPollingQueue.on('completed', (job, result) => {
      console.log(`✅ Job polling IMAP complété: ${job.id}`);
    });

    this.imapPollingQueue.on('failed', (job, err) => {
      console.error(`❌ Job polling IMAP échoué: ${job.id}`, err.message);
    });

    this.imapPollingQueue.on('stalled', (job) => {
      console.warn(`⚠️ Job polling IMAP bloqué: ${job.id}`);
    });
  }

  /**
   * Ajouter un email à traiter dans la queue
   */
  async addEmailToQueue(email, configId, campaignId = null) {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      const job = await this.emailQueue.add('processEmail', {
        email,
        configId,
        campaignId
      }, {
        priority: campaignId ? 10 : 5, // Priorité plus haute si associé à une campagne
        delay: 0 // Traitement immédiat
      });

      console.log(`📮 Email ajouté à la queue: ${job.id} (MessageID: ${email.messageId})`);
      return job;
    } catch (error) {
      console.error('❌ Erreur ajout email à la queue:', error);
      throw error;
    }
  }

  /**
   * Programmer le polling IMAP pour une configuration
   */
  async scheduleImapPolling(configId, intervalMinutes = 5) {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      // Supprimer les jobs existants pour cette configuration
      await this.cancelImapPolling(configId);

      // Ajouter un job récurrent
      const job = await this.imapPollingQueue.add('pollConfiguration', {
        configId
      }, {
        repeat: {
          cron: `*/${intervalMinutes} * * * *` // Toutes les X minutes
        },
        jobId: `imap-poll-${configId}` // ID unique pour permettre la suppression
      });

      console.log(`📅 Polling IMAP programmé: ${configId} toutes les ${intervalMinutes} minutes`);
      return job;
    } catch (error) {
      console.error('❌ Erreur programmation polling IMAP:', error);
      throw error;
    }
  }

  /**
   * Annuler le polling IMAP pour une configuration
   */
  async cancelImapPolling(configId) {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      const jobId = `imap-poll-${configId}`;
      const jobs = await this.imapPollingQueue.getRepeatableJobs();

      for (const job of jobs) {
        if (job.id === jobId || job.name === 'pollConfiguration') {
          const jobData = job.opts ? job.opts.repeat : null;
          if (jobData) {
            await this.imapPollingQueue.removeRepeatableByKey(job.key);
            console.log(`🗑️ Job polling supprimé: ${configId}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur annulation polling IMAP:', error);
      throw error;
    }
  }

  /**
   * Forcer un polling immédiat pour une configuration
   */
  async forceImapPolling(configId) {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      const job = await this.imapPollingQueue.add('pollConfiguration', {
        configId
      }, {
        priority: 20, // Priorité élevée pour polling forcé
        delay: 0
      });

      console.log(`🚀 Polling IMAP forcé: ${configId}`);
      return job;
    } catch (error) {
      console.error('❌ Erreur polling IMAP forcé:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des queues
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      const emailStats = {
        waiting: await this.emailQueue.getWaiting().then(jobs => jobs.length),
        active: await this.emailQueue.getActive().then(jobs => jobs.length),
        completed: await this.emailQueue.getCompleted().then(jobs => jobs.length),
        failed: await this.emailQueue.getFailed().then(jobs => jobs.length),
        delayed: await this.emailQueue.getDelayed().then(jobs => jobs.length)
      };

      const imapStats = {
        waiting: await this.imapPollingQueue.getWaiting().then(jobs => jobs.length),
        active: await this.imapPollingQueue.getActive().then(jobs => jobs.length),
        completed: await this.imapPollingQueue.getCompleted().then(jobs => jobs.length),
        failed: await this.imapPollingQueue.getFailed().then(jobs => jobs.length),
        delayed: await this.imapPollingQueue.getDelayed().then(jobs => jobs.length)
      };

      return {
        email: emailStats,
        imap: imapStats,
        redis: {
          status: this.redis.status,
          uptime: process.uptime()
        }
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats queue:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les queues (supprimer les anciens jobs)
   */
  async cleanQueues() {
    if (!this.isInitialized) {
      throw new Error('Queue service non initialisé');
    }

    try {
      // Nettoyer les jobs complétés de plus de 24h
      await this.emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
      await this.imapPollingQueue.clean(24 * 60 * 60 * 1000, 'completed');

      // Nettoyer les jobs échoués de plus de 7 jours
      await this.emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
      await this.imapPollingQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

      console.log('✅ Nettoyage des queues complété');
    } catch (error) {
      console.error('❌ Erreur nettoyage queues:', error);
      throw error;
    }
  }

  /**
   * Fermer les connexions
   */
  async close() {
    try {
      if (this.emailQueue) {
        await this.emailQueue.close();
      }
      if (this.imapPollingQueue) {
        await this.imapPollingQueue.close();
      }
      if (this.redis) {
        await this.redis.quit();
      }

      this.isInitialized = false;
      console.log('✅ Service de queue fermé');
    } catch (error) {
      console.error('❌ Erreur fermeture service de queue:', error);
      throw error;
    }
  }
}

// Singleton
const queueService = new QueueService();

module.exports = queueService;