/**
 * ROUTES TRACKING EMAIL - SYSTÈME COMPLET
 * Tracking pixels, liens cliqués, webhooks Mailgun, désinscriptions
 */

const express = require('express');
const { param, query } = require('express-validator');
const EmailTracking = require('../models/EmailTracking');
const Campaign = require('../models/Campaign');

const router = express.Router();

/**
 * GET /api/email/track/open/:trackingId.png - Pixel de tracking ouverture
 * Image 1x1 pixel transparent pour tracker les ouvertures d'emails
 */
router.get('/track/open/:trackingId.png', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Créer un pixel transparent 1x1
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHl8h3A/QAAAABJRU5ErkJggg==',
      'base64'
    );

    // Headers pour un pixel de tracking
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pixel.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Traitement asynchrone du tracking (ne pas bloquer la réponse)
    setImmediate(async () => {
      try {
        const emailTracking = await EmailTracking.findById(trackingId);
        if (emailTracking) {
          // Déterminer le type d'appareil
          let deviceType = 'unknown';
          if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            deviceType = 'mobile';
          } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            deviceType = 'tablet';
          } else if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
            deviceType = 'desktop';
          }

          // Marquer comme ouvert
          emailTracking.markAsOpened(deviceType, userAgent, ipAddress);
          await emailTracking.save();

          // Mettre à jour les métriques de la campagne (de manière asynchrone)
          if (emailTracking.campaignId) {
            const campaign = await Campaign.findById(emailTracking.campaignId);
            if (campaign) {
              campaign.updateMetrics().catch(err =>
                console.error('Erreur mise à jour métriques campagne:', err)
              );
            }
          }

          console.log(`📧 Email ouvert - Tracking ID: ${trackingId}`);
        }
      } catch (error) {
        console.error('❌ Erreur tracking ouverture:', error);
      }
    });

    // Retourner immédiatement le pixel
    res.send(pixel);

  } catch (error) {
    console.error('❌ Erreur pixel tracking:', error);

    // Retourner un pixel même en cas d'erreur pour ne pas casser l'affichage
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHl8h3A/QAAAABJRU5ErkJggg==',
      'base64'
    );
    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
  }
});

/**
 * GET /api/email/track/click/:trackingId - Redirection avec tracking des clics
 */
router.get('/track/click/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url, pos = 0 } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL de destination manquante'
      });
    }

    const decodedUrl = decodeURIComponent(url);

    // Valider que l'URL est sûre
    try {
      new URL(decodedUrl);
    } catch (urlError) {
      console.error('❌ URL invalide dans tracking clic:', decodedUrl);
      return res.status(400).json({
        success: false,
        message: 'URL invalide'
      });
    }

    // Traitement asynchrone du tracking
    setImmediate(async () => {
      try {
        const emailTracking = await EmailTracking.findById(trackingId);
        if (emailTracking) {
          emailTracking.markAsClicked(decodedUrl, parseInt(pos));
          await emailTracking.save();

          // Mettre à jour les métriques de la campagne
          if (emailTracking.campaignId) {
            const campaign = await Campaign.findById(emailTracking.campaignId);
            if (campaign) {
              campaign.updateMetrics().catch(err =>
                console.error('Erreur mise à jour métriques campagne:', err)
              );
            }
          }

          console.log(`🔗 Lien cliqué - Tracking ID: ${trackingId}, URL: ${decodedUrl}`);
        }
      } catch (error) {
        console.error('❌ Erreur tracking clic:', error);
      }
    });

    // Redirection immédiate vers l'URL de destination
    res.redirect(302, decodedUrl);

  } catch (error) {
    console.error('❌ Erreur redirection tracking:', error);

    // En cas d'erreur, essayer de rediriger quand même
    const { url } = req.query;
    if (url) {
      try {
        res.redirect(302, decodeURIComponent(url));
      } catch (redirectError) {
        res.status(400).json({
          success: false,
          message: 'Erreur de redirection'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'URL de destination manquante'
      });
    }
  }
});

/**
 * POST /api/email/webhooks/mailgun - Webhooks Mailgun pour événements email
 * Traite les événements : delivered, opened, clicked, bounced, complained, unsubscribed
 */
router.post('/webhooks/mailgun', express.raw({ type: 'application/x-www-form-urlencoded' }), async (req, res) => {
  try {
    // Mailgun envoie les données en form-encoded
    const formData = new URLSearchParams(req.body.toString());
    const eventData = Object.fromEntries(formData);

    console.log('📨 Webhook Mailgun reçu:', eventData.event);

    // Vérifier la signature Mailgun (sécurité)
    if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', process.env.MAILGUN_WEBHOOK_SIGNING_KEY)
        .update(eventData.timestamp + eventData.token)
        .digest('hex');

      if (signature !== eventData.signature) {
        console.error('❌ Signature webhook Mailgun invalide');
        return res.status(401).json({ success: false, message: 'Signature invalide' });
      }
    }

    // Extraire les métadonnées custom
    const emailTrackingId = eventData['email-tracking-id'];
    const contactId = eventData['contact-id'];
    const campaignId = eventData['campaign-id'];

    if (!emailTrackingId) {
      console.log('⚠️ Webhook sans tracking ID, ignoring');
      return res.status(200).json({ success: true, message: 'Ignoré' });
    }

    // Traiter l'événement selon son type
    const emailTracking = await EmailTracking.findById(emailTrackingId);
    if (!emailTracking) {
      console.error(`❌ EmailTracking introuvable: ${emailTrackingId}`);
      return res.status(404).json({ success: false, message: 'Tracking introuvable' });
    }

    const eventTimestamp = new Date(parseFloat(eventData.timestamp) * 1000);

    switch (eventData.event) {
      case 'delivered':
        emailTracking.status = 'delivered';
        break;

      case 'opened':
        if (!emailTracking.firstOpenedAt) {
          emailTracking.firstOpenedAt = eventTimestamp;
        }
        emailTracking.openedAt = eventTimestamp;
        emailTracking.totalOpens += 1;
        emailTracking.status = 'opened';
        emailTracking.calculateEngagementScore();
        break;

      case 'clicked':
        if (!emailTracking.firstClickedAt) {
          emailTracking.firstClickedAt = eventTimestamp;
        }
        emailTracking.clickedAt = eventTimestamp;
        emailTracking.totalClicks += 1;
        emailTracking.status = 'clicked';

        // Ajouter le lien cliqué
        if (eventData.url) {
          emailTracking.clickedLinks.push({
            url: eventData.url,
            clickedAt: eventTimestamp,
            position: 0
          });
        }
        emailTracking.calculateEngagementScore();
        break;

      case 'bounced':
      case 'dropped':
        emailTracking.status = 'bounced';
        emailTracking.bounceReason = eventData.reason || eventData.description;
        break;

      case 'complained':
        emailTracking.status = 'complained';
        break;

      case 'unsubscribed':
        emailTracking.status = 'unsubscribed';
        emailTracking.unsubscribedAt = eventTimestamp;
        break;

      default:
        console.log(`⚠️ Événement Mailgun non géré: ${eventData.event}`);
    }

    // Sauvegarder les modifications
    await emailTracking.save();

    // Mettre à jour les métriques de la campagne de manière asynchrone
    if (campaignId) {
      setImmediate(async () => {
        try {
          const campaign = await Campaign.findById(campaignId);
          if (campaign) {
            await campaign.updateMetrics();
          }
        } catch (metricsError) {
          console.error('❌ Erreur mise à jour métriques:', metricsError);
        }
      });
    }

    console.log(`✅ Événement ${eventData.event} traité pour ${emailTrackingId}`);

    res.status(200).json({
      success: true,
      message: 'Événement traité'
    });

  } catch (error) {
    console.error('❌ Erreur webhook Mailgun:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur traitement webhook'
    });
  }
});

/**
 * GET /api/email/unsubscribe - Page de désinscription RGPD
 */
router.get('/unsubscribe', async (req, res) => {
  try {
    const { contact, campaign, token } = req.query;

    // HTML de la page de désinscription
    const unsubscribePage = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Désinscription - PressPilot</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
            font-size: 24px;
            font-weight: bold;
            color: #0ED894;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        select, textarea, button {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        button {
            background-color: #dc3545;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 500;
        }
        button:hover {
            background-color: #c82333;
        }
        .info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">PressPilot</div>
        <h1>Désinscription des communications</h1>

        <div class="info">
            Nous respectons votre choix de ne plus recevoir nos communications.
            Veuillez remplir ce formulaire pour vous désinscrire.
        </div>

        <form action="/api/email/unsubscribe" method="POST">
            <input type="hidden" name="contact" value="${contact || ''}" />
            <input type="hidden" name="campaign" value="${campaign || ''}" />

            <div class="form-group">
                <label for="reason">Raison de la désinscription (optionnel) :</label>
                <select name="reason" id="reason">
                    <option value="">Sélectionner une raison</option>
                    <option value="trop_frequent">Trop d'emails</option>
                    <option value="non_pertinent">Contenu non pertinent</option>
                    <option value="spam">Considéré comme spam</option>
                    <option value="autre">Autre raison</option>
                </select>
            </div>

            <div class="form-group">
                <label for="comment">Commentaire (optionnel) :</label>
                <textarea name="comment" id="comment" rows="3"
                         placeholder="Vos commentaires nous aident à améliorer nos communications..."></textarea>
            </div>

            <button type="submit">Confirmer la désinscription</button>
        </form>

        <div class="footer">
            PressPilot - Plateforme de relations presse musicales<br>
            Cette désinscription est définitive et conforme au RGPD.
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(unsubscribePage);

  } catch (error) {
    console.error('❌ Erreur page désinscription:', error);
    res.status(500).send('<h1>Erreur</h1><p>Une erreur est survenue.</p>');
  }
});

/**
 * POST /api/email/unsubscribe - Traitement de la désinscription
 */
router.post('/unsubscribe', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { contact, campaign, reason, comment } = req.body;

    if (contact) {
      // Marquer tous les trackings de ce contact comme désinscrits
      await EmailTracking.updateMany(
        { contactId: contact },
        {
          status: 'unsubscribed',
          unsubscribedAt: new Date()
        }
      );

      console.log(`📧 Contact ${contact} désinscrit - Raison: ${reason || 'Non spécifiée'}`);
    }

    // Page de confirmation
    const confirmationPage = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Désinscription confirmée - PressPilot</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ED894;
            margin-bottom: 30px;
        }
        .success-icon {
            font-size: 48px;
            color: #28a745;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">PressPilot</div>
        <div class="success-icon">✅</div>
        <h1>Désinscription confirmée</h1>

        <div class="message">
            Votre désinscription a été traitée avec succès.<br>
            Vous ne recevrez plus d'emails de notre part.<br><br>
            Merci pour vos retours qui nous aident à améliorer nos services.
        </div>

        <div class="footer">
            PressPilot - Plateforme de relations presse musicales
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(confirmationPage);

  } catch (error) {
    console.error('❌ Erreur traitement désinscription:', error);
    res.status(500).send('<h1>Erreur</h1><p>Une erreur est survenue lors de la désinscription.</p>');
  }
});

/**
 * GET /api/email/stats/real-time/:campaignId - Statistiques en temps réel
 */
router.get('/stats/real-time/:campaignId', param('campaignId').isMongoId(), async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Récupérer les métriques en temps réel
    const metrics = await EmailTracking.getCampaignMetrics(
      campaignId,
      new Date(0), // Depuis le début
      new Date()
    );

    // Activité récente (dernières 24h)
    const recentActivity = await EmailTracking.find({
      campaignId,
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('contactId', 'email firstName lastName')
      .select('status openedAt clickedAt repliedAt contactId updatedAt deviceType')
      .lean();

    // Métriques par heure des dernières 24h
    const hourlyMetrics = await EmailTracking.aggregate([
      {
        $match: {
          campaignId: require('mongoose').Types.ObjectId(campaignId),
          sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$sentAt' },
          sent: { $sum: 1 },
          opened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        recentActivity,
        hourlyMetrics,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats temps réel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération statistiques temps réel'
    });
  }
});

module.exports = router;