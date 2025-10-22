/**
 * ROUTES RÉCEPTION D'EMAILS - SYSTÈME COMPLET
 * Gestion des réponses d'emails et association automatique aux campagnes
 */

const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const EmailTracking = require('../models/EmailTracking');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configuration multer pour les webhooks avec pièces jointes
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    fieldSize: 1024 * 1024 // 1MB par champ
  }
});

/**
 * POST /api/incoming/webhooks/mailgun - Webhook Mailgun pour emails entrants
 * Traite les réponses aux campagnes et les associe automatiquement
 */
router.post('/webhooks/mailgun', upload.any(), async (req, res) => {
  try {
    console.log('📨 Webhook email entrant reçu');

    // Mailgun envoie les données en form-data
    const emailData = req.body;

    // Vérifier la signature Mailgun (sécurité)
    if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', process.env.MAILGUN_WEBHOOK_SIGNING_KEY)
        .update(emailData.timestamp + emailData.token)
        .digest('hex');

      if (signature !== emailData.signature) {
        console.error('❌ Signature webhook Mailgun invalide');
        return res.status(401).json({ success: false, message: 'Signature invalide' });
      }
    }

    // Extraire les informations de l'email
    const {
      From: fromEmail,
      To: toEmail,
      Subject: subject,
      'body-plain': bodyText,
      'body-html': bodyHtml,
      'In-Reply-To': inReplyTo,
      References: references,
      'Message-Id': messageId,
      timestamp
    } = emailData;

    console.log(`📧 Email de ${fromEmail} vers ${toEmail} - Sujet: ${subject}`);

    // Essayer d'identifier la campagne d'origine
    const { campaignId, contactId, trackingId } = await identifyOriginalCampaign(
      fromEmail,
      toEmail,
      subject,
      inReplyTo,
      references
    );

    if (campaignId && contactId && trackingId) {
      // Marquer comme répondu dans le tracking
      const emailTracking = await EmailTracking.findById(trackingId);
      if (emailTracking) {
        emailTracking.markAsReplied(bodyText || bodyHtml);
        await emailTracking.save();

        console.log(`✅ Réponse associée à la campagne ${campaignId} - Contact ${contactId}`);

        // Mettre à jour les métriques de la campagne
        const campaign = await Campaign.findById(campaignId);
        if (campaign) {
          await campaign.updateMetrics();
        }
      }
    } else {
      console.log('⚠️ Impossible d\'associer la réponse à une campagne spécifique');

      // Stocker la réponse non associée pour examen manuel
      await storeUnassociatedReply({
        fromEmail,
        toEmail,
        subject,
        bodyText,
        bodyHtml,
        messageId,
        receivedAt: new Date(parseInt(timestamp) * 1000)
      });
    }

    // Traiter les pièces jointes si présentes
    if (req.files && req.files.length > 0) {
      console.log(`📎 ${req.files.length} pièce(s) jointe(s) reçue(s)`);
      // TODO: Sauvegarder les pièces jointes
    }

    res.status(200).json({
      success: true,
      message: 'Email entrant traité',
      associated: !!(campaignId && contactId)
    });

  } catch (error) {
    console.error('❌ Erreur traitement email entrant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur traitement email entrant'
    });
  }
});

/**
 * Identifie la campagne d'origine d'une réponse
 */
async function identifyOriginalCampaign(fromEmail, toEmail, subject, inReplyTo, references) {
  try {
    // Méthode 1: Recherche par In-Reply-To header
    if (inReplyTo) {
      const tracking = await EmailTracking.findOne({
        emailId: inReplyTo
      }).populate('contactId', 'email');

      if (tracking && tracking.contactId.email.toLowerCase() === fromEmail.toLowerCase()) {
        return {
          campaignId: tracking.campaignId,
          contactId: tracking.contactId._id,
          trackingId: tracking._id
        };
      }
    }

    // Méthode 2: Recherche par References header
    if (references) {
      const messageIds = references.split(/\s+/);
      for (const msgId of messageIds) {
        const tracking = await EmailTracking.findOne({
          emailId: msgId.trim()
        }).populate('contactId', 'email');

        if (tracking && tracking.contactId.email.toLowerCase() === fromEmail.toLowerCase()) {
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
        if (campaign && isSubjectMatch(subject, campaign.subject)) {
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
 * Vérifie si le sujet correspond à une réponse
 */
function isSubjectMatch(replySubject, originalSubject) {
  const cleanReply = replySubject.toLowerCase()
    .replace(/^(re|aw|fwd?):\s*/i, '')
    .trim();

  const cleanOriginal = originalSubject.toLowerCase().trim();

  return cleanReply.includes(cleanOriginal) || cleanOriginal.includes(cleanReply);
}

/**
 * Stocke une réponse non associée pour examen manuel
 */
async function storeUnassociatedReply(emailData) {
  try {
    // Créer un modèle pour les emails non associés
    const UnassociatedEmail = require('../models/UnassociatedEmail');

    const unassociated = new UnassociatedEmail({
      fromEmail: emailData.fromEmail,
      toEmail: emailData.toEmail,
      subject: emailData.subject,
      bodyText: emailData.bodyText,
      bodyHtml: emailData.bodyHtml,
      messageId: emailData.messageId,
      receivedAt: emailData.receivedAt,
      status: 'pending_review'
    });

    await unassociated.save();
    console.log('📝 Réponse non associée sauvegardée pour examen manuel');

  } catch (error) {
    console.error('❌ Erreur sauvegarde réponse non associée:', error);
  }
}

/**
 * GET /api/incoming/unassociated - Liste des réponses non associées
 */
router.get('/unassociated', auth, async (req, res) => {
  try {
    const UnassociatedEmail = require('../models/UnassociatedEmail');

    const { page = 1, limit = 20, status = 'pending_review' } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sort: { receivedAt: -1 }
    };

    const unassociated = await UnassociatedEmail.paginate({ status }, options);

    res.json({
      success: true,
      data: unassociated.docs,
      pagination: {
        page: unassociated.page,
        limit: unassociated.limit,
        total: unassociated.totalDocs,
        pages: unassociated.totalPages
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération emails non associés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération emails non associés'
    });
  }
});

/**
 * POST /api/incoming/associate/:emailId - Associer manuellement une réponse
 */
router.post('/associate/:emailId', auth, [
  param('emailId').isMongoId(),
  body('campaignId').isMongoId(),
  body('contactId').isMongoId()
], async (req, res) => {
  try {
    const { emailId } = req.params;
    const { campaignId, contactId } = req.body;

    const UnassociatedEmail = require('../models/UnassociatedEmail');

    // Récupérer l'email non associé
    const email = await UnassociatedEmail.findById(emailId);
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email non trouvé'
      });
    }

    // Vérifier que la campagne et le contact existent
    const [campaign, contact] = await Promise.all([
      Campaign.findById(campaignId),
      Contact.findById(contactId)
    ]);

    if (!campaign || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Campagne ou contact invalide'
      });
    }

    // Chercher le tracking correspondant
    const emailTracking = await EmailTracking.findOne({
      campaignId,
      contactId
    }).sort({ sentAt: -1 });

    if (emailTracking) {
      // Marquer comme répondu
      emailTracking.markAsReplied(email.bodyText || email.bodyHtml);
      await emailTracking.save();

      // Mettre à jour les métriques
      await campaign.updateMetrics();

      // Marquer l'email comme traité
      email.status = 'associated';
      email.associatedCampaign = campaignId;
      email.associatedContact = contactId;
      await email.save();

      res.json({
        success: true,
        message: 'Email associé avec succès'
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Aucun tracking trouvé pour cette campagne/contact'
      });
    }

  } catch (error) {
    console.error('❌ Erreur association manuelle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur association manuelle'
    });
  }
});

module.exports = router;