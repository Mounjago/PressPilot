/**
 * ROUTES QUEUE - Gestion et monitoring de la queue Bull
 * Routes Express pour surveiller et administrer les queues de messages
 */

const express = require('express');
const { param, query, validationResult } = require('express-validator');
const queueService = require('../services/queueService');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/queue/status - Obtenir le statut général des queues
 */
router.get('/status', auth, async (req, res) => {
  try {
    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const stats = await queueService.getQueueStats();

    res.json({
      success: true,
      data: {
        status: 'running',
        initialized: queueService.isInitialized,
        ...stats
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statut queue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
});

/**
 * GET /api/queue/jobs/email - Obtenir les jobs de traitement d'email
 */
router.get('/jobs/email', auth, [
  query('status')
    .optional()
    .isIn(['waiting', 'active', 'completed', 'failed', 'delayed'])
    .withMessage('Statut invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite doit être entre 1 et 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const { status = 'waiting', limit = 20 } = req.query;

    let jobs = [];
    switch (status) {
      case 'waiting':
        jobs = await queueService.emailQueue.getWaiting(0, limit - 1);
        break;
      case 'active':
        jobs = await queueService.emailQueue.getActive(0, limit - 1);
        break;
      case 'completed':
        jobs = await queueService.emailQueue.getCompleted(0, limit - 1);
        break;
      case 'failed':
        jobs = await queueService.emailQueue.getFailed(0, limit - 1);
        break;
      case 'delayed':
        jobs = await queueService.emailQueue.getDelayed(0, limit - 1);
        break;
    }

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: {
        configId: job.data?.configId,
        messageId: job.data?.email?.messageId,
        subject: job.data?.email?.subject,
        from: job.data?.email?.from
      },
      opts: {
        priority: job.opts?.priority,
        delay: job.opts?.delay,
        attempts: job.opts?.attempts
      },
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      createdAt: job.timestamp
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        count: jobs.length,
        status
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération jobs email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jobs'
    });
  }
});

/**
 * GET /api/queue/jobs/imap - Obtenir les jobs de polling IMAP
 */
router.get('/jobs/imap', auth, [
  query('status')
    .optional()
    .isIn(['waiting', 'active', 'completed', 'failed', 'delayed'])
    .withMessage('Statut invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite doit être entre 1 et 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const { status = 'waiting', limit = 20 } = req.query;

    let jobs = [];
    switch (status) {
      case 'waiting':
        jobs = await queueService.imapPollingQueue.getWaiting(0, limit - 1);
        break;
      case 'active':
        jobs = await queueService.imapPollingQueue.getActive(0, limit - 1);
        break;
      case 'completed':
        jobs = await queueService.imapPollingQueue.getCompleted(0, limit - 1);
        break;
      case 'failed':
        jobs = await queueService.imapPollingQueue.getFailed(0, limit - 1);
        break;
      case 'delayed':
        jobs = await queueService.imapPollingQueue.getDelayed(0, limit - 1);
        break;
    }

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: {
        configId: job.data?.configId
      },
      opts: {
        priority: job.opts?.priority,
        repeat: job.opts?.repeat,
        attempts: job.opts?.attempts
      },
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      createdAt: job.timestamp
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        count: jobs.length,
        status
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération jobs IMAP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jobs'
    });
  }
});

/**
 * GET /api/queue/job/:jobId - Obtenir les détails d'un job spécifique
 */
router.get('/job/:jobId', auth, [
  param('jobId').isInt().withMessage('ID de job invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const { jobId } = req.params;

    // Rechercher dans les deux queues
    let job = await queueService.emailQueue.getJob(jobId);
    let queueType = 'email';

    if (!job) {
      job = await queueService.imapPollingQueue.getJob(jobId);
      queueType = 'imap';
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job non trouvé'
      });
    }

    const jobDetails = {
      id: job.id,
      name: job.name,
      queueType,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      returnvalue: job.returnvalue,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      createdAt: job.timestamp,
      attemptsMade: job.attemptsMade,
      delay: job.delay
    };

    res.json({
      success: true,
      data: jobDetails
    });

  } catch (error) {
    console.error('❌ Erreur récupération job:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du job'
    });
  }
});

/**
 * POST /api/queue/job/:jobId/retry - Relancer un job échoué
 */
router.post('/job/:jobId/retry', auth, authorize('admin'), [
  param('jobId').isInt().withMessage('ID de job invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const { jobId } = req.params;

    // Rechercher le job dans les queues
    let job = await queueService.emailQueue.getJob(jobId);
    if (!job) {
      job = await queueService.imapPollingQueue.getJob(jobId);
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job non trouvé'
      });
    }

    // Relancer le job
    await job.retry();

    res.json({
      success: true,
      message: 'Job relancé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur relance job:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la relance du job'
    });
  }
});

/**
 * DELETE /api/queue/job/:jobId - Supprimer un job
 */
router.delete('/job/:jobId', auth, authorize('admin'), [
  param('jobId').isInt().withMessage('ID de job invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const { jobId } = req.params;

    // Rechercher et supprimer le job dans les queues
    let job = await queueService.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
    } else {
      job = await queueService.imapPollingQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Job supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression job:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du job'
    });
  }
});

/**
 * POST /api/queue/clean - Nettoyer les queues
 */
router.post('/clean', auth, authorize('admin'), async (req, res) => {
  try {
    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    await queueService.cleanQueues();

    res.json({
      success: true,
      message: 'Queues nettoyées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur nettoyage queues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des queues'
    });
  }
});

/**
 * POST /api/queue/pause - Mettre en pause toutes les queues
 */
router.post('/pause', auth, authorize('admin'), async (req, res) => {
  try {
    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    await queueService.emailQueue.pause();
    await queueService.imapPollingQueue.pause();

    res.json({
      success: true,
      message: 'Queues mises en pause'
    });

  } catch (error) {
    console.error('❌ Erreur pause queues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise en pause'
    });
  }
});

/**
 * POST /api/queue/resume - Reprendre toutes les queues
 */
router.post('/resume', auth, authorize('admin'), async (req, res) => {
  try {
    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    await queueService.emailQueue.resume();
    await queueService.imapPollingQueue.resume();

    res.json({
      success: true,
      message: 'Queues relancées'
    });

  } catch (error) {
    console.error('❌ Erreur reprise queues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la reprise'
    });
  }
});

/**
 * GET /api/queue/repeated - Obtenir les jobs répétés
 */
router.get('/repeated', auth, async (req, res) => {
  try {
    if (!queueService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Service de queue non initialisé'
      });
    }

    const emailRepeated = await queueService.emailQueue.getRepeatableJobs();
    const imapRepeated = await queueService.imapPollingQueue.getRepeatableJobs();

    res.json({
      success: true,
      data: {
        email: emailRepeated,
        imap: imapRepeated
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération jobs répétés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jobs répétés'
    });
  }
});

module.exports = router;