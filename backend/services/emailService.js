/**
 * SERVICE D'ENVOI D'EMAILS - MAILGUN
 * Service professionnel pour l'envoi d'emails marketing avec tracking complet
 */

const Mailgun = require('mailgun.js');
const FormData = require('form-data');
const { uuidv4 } = require('../utils/uuid');
const Campaign = require('../models/Campaign');
const EmailTracking = require('../models/EmailTracking');

class EmailService {
  constructor() {
    this.mailgun = null;
    this.domain = process.env.MAILGUN_DOMAIN;
    this.apiKey = process.env.MAILGUN_API_KEY;
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@presspilot.com';
    this.baseUrl = process.env.MAILGUN_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

    this.initializeMailgun();
  }

  /**
   * Initialise la connexion Mailgun
   */
  initializeMailgun() {
    if (!this.apiKey || !this.domain) {
      console.error('❌ Configuration Mailgun manquante - MAILGUN_API_KEY et MAILGUN_DOMAIN requis');
      return;
    }

    try {
      const mailgun = new Mailgun(FormData);
      this.mailgun = mailgun.client({
        username: 'api',
        key: this.apiKey,
        url: 'https://api.eu.mailgun.net' // Serveurs européens pour RGPD
      });

      console.log('✅ Service Email Mailgun initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Mailgun:', error);
    }
  }

  /**
   * Teste la connexion Mailgun
   */
  async testConnection() {
    if (!this.mailgun) {
      throw new Error('Service Mailgun non initialisé');
    }

    try {
      const response = await this.mailgun.domains.list();
      return {
        success: true,
        domains: response.items?.length || 0,
        message: 'Connexion Mailgun réussie'
      };
    } catch (error) {
      console.error('❌ Test connexion Mailgun:', error);
      throw new Error(`Échec test Mailgun: ${error.message}`);
    }
  }

  /**
   * Génère un pixel de tracking unique
   */
  generateTrackingPixel(emailTrackingId) {
    return `${this.baseUrl}/api/email/track/open/${emailTrackingId}.png`;
  }

  /**
   * Génère des liens trackés
   */
  generateTrackedLink(originalUrl, emailTrackingId, position = 0) {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${this.baseUrl}/api/email/track/click/${emailTrackingId}?url=${encodedUrl}&pos=${position}`;
  }

  /**
   * Traite le contenu HTML pour ajouter le tracking
   */
  processEmailContent(htmlContent, emailTrackingId) {
    let processedContent = htmlContent;

    // Ajouter le pixel de tracking à la fin
    const trackingPixel = `<img src="${this.generateTrackingPixel(emailTrackingId)}" width="1" height="1" style="display:none;" alt="" />`;
    processedContent += trackingPixel;

    // Tracker tous les liens
    let linkPosition = 0;
    processedContent = processedContent.replace(
      /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
      (match, url, rest) => {
        // Ne pas tracker les liens déjà trackés ou internes
        if (url.includes('/api/email/track/') || url.startsWith('#') || url.startsWith('mailto:')) {
          return match;
        }

        const trackedUrl = this.generateTrackedLink(url, emailTrackingId, linkPosition++);
        return `<a href="${trackedUrl}"${rest}>`;
      }
    );

    return processedContent;
  }

  /**
   * Génère l'URL de désinscription conforme RGPD
   */
  generateUnsubscribeUrl(contactId, campaignId) {
    return `${this.baseUrl}/unsubscribe?contact=${contactId}&campaign=${campaignId}`;
  }

  /**
   * Envoie un email individuel avec tracking
   */
  async sendTrackedEmail({
    to,
    subject,
    htmlContent,
    textContent = null,
    campaignId,
    contactId,
    sentBy,
    attachments = []
  }) {
    if (!this.mailgun) {
      throw new Error('Service Mailgun non initialisé');
    }

    try {
      // Créer un enregistrement de tracking
      const emailId = uuidv4();
      const emailTracking = new EmailTracking({
        emailId,
        campaignId,
        contactId,
        sentBy,
        sentAt: new Date(),
        status: 'sent',
        mlFeatures: {
          sendHour: new Date().getHours(),
          sendDayOfWeek: new Date().getDay(),
          subjectLength: subject.length,
          bodyLength: htmlContent.length,
          hasAttachment: attachments.length > 0
        }
      });

      await emailTracking.save();

      // Traiter le contenu avec tracking
      const processedHtml = this.processEmailContent(htmlContent, emailTracking._id);

      // Générer le texte plain si non fourni
      const plainText = textContent || this.htmlToText(htmlContent);

      // URL de désinscription
      const unsubscribeUrl = this.generateUnsubscribeUrl(contactId, campaignId);

      // Préparer les données Mailgun
      const messageData = {
        from: `PressPilot <${this.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: processedHtml,
        text: plainText,
        'h:List-Unsubscribe': `<${unsubscribeUrl}>`,
        'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'o:campaign': campaignId,
        'o:tag': ['presspilot-campaign'],
        'o:tracking': 'yes',
        'o:tracking-clicks': 'yes',
        'o:tracking-opens': 'yes',
        'v:email-tracking-id': emailTracking._id.toString(),
        'v:contact-id': contactId,
        'v:campaign-id': campaignId
      };

      // Ajouter les pièces jointes si présentes
      if (attachments.length > 0) {
        messageData.attachment = attachments;
      }

      // Envoyer via Mailgun
      const response = await this.mailgun.messages.create(this.domain, messageData);

      // Mettre à jour le tracking avec l'ID Mailgun
      emailTracking.emailId = response.id;
      emailTracking.status = 'sent';
      await emailTracking.save();

      return {
        success: true,
        emailId: response.id,
        trackingId: emailTracking._id,
        message: 'Email envoyé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);

      // Marquer comme échec en base
      try {
        await EmailTracking.updateOne(
          { emailId },
          {
            status: 'failed',
            errorMessage: error.message
          }
        );
      } catch (updateError) {
        console.error('❌ Erreur mise à jour tracking:', updateError);
      }

      throw new Error(`Échec envoi email: ${error.message}`);
    }
  }

  /**
   * Envoie une campagne complète avec gestion des erreurs
   */
  async sendCampaign(campaignId, options = {}) {
    if (!this.mailgun) {
      throw new Error('Service Mailgun non initialisé');
    }

    try {
      // Récupérer la campagne avec les contacts
      const campaign = await Campaign.findById(campaignId)
        .populate('targetContacts.contactId', 'email firstName lastName')
        .populate('createdBy', 'email firstName lastName');

      if (!campaign) {
        throw new Error('Campagne introuvable');
      }

      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error('Cette campagne ne peut pas être envoyée');
      }

      // Marquer la campagne comme en cours d'envoi
      campaign.status = 'sending';
      campaign.sentAt = new Date();
      await campaign.save();

      const results = {
        total: campaign.targetContacts.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      // Traitement par batch pour éviter de surcharger Mailgun
      const batchSize = options.batchSize || 10;
      const delayMs = options.delayMs || 100; // Délai entre les envois

      for (let i = 0; i < campaign.targetContacts.length; i += batchSize) {
        const batch = campaign.targetContacts.slice(i, i + batchSize);

        const batchPromises = batch.map(async (targetContact) => {
          try {
            const contact = targetContact.contactId;

            if (!contact || !contact.email) {
              throw new Error('Contact ou email manquant');
            }

            // Personnaliser le contenu si nécessaire
            let personalizedContent = campaign.htmlContent || campaign.content;
            personalizedContent = personalizedContent.replace(/{{contact\.firstName}}/g, contact.firstName || 'Contact');
            personalizedContent = personalizedContent.replace(/{{contact\.lastName}}/g, contact.lastName || '');

            const result = await this.sendTrackedEmail({
              to: contact.email,
              subject: campaign.subject,
              htmlContent: personalizedContent,
              campaignId: campaign._id,
              contactId: contact._id,
              sentBy: campaign.createdBy._id
            });

            // Mettre à jour le statut du contact dans la campagne
            targetContact.status = 'sent';
            targetContact.sentAt = new Date();

            results.sent++;
            return result;

          } catch (error) {
            console.error(`❌ Erreur envoi pour contact ${targetContact.contactId}:`, error);

            // Mettre à jour le statut d'échec
            targetContact.status = 'failed';
            targetContact.errorMessage = error.message;

            results.failed++;
            results.errors.push({
              contactId: targetContact.contactId,
              error: error.message
            });

            return null;
          }
        });

        // Attendre que le batch soit terminé
        await Promise.allSettled(batchPromises);

        // Sauvegarder les progrès
        await campaign.save();

        // Délai entre les batches
        if (i + batchSize < campaign.targetContacts.length && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Finaliser la campagne
      campaign.status = 'sent';
      campaign.metrics.totalSent = results.sent;
      await campaign.save();

      console.log(`✅ Campagne ${campaignId} envoyée: ${results.sent}/${results.total} succès`);

      return {
        success: true,
        campaignId,
        results,
        message: `Campagne envoyée: ${results.sent}/${results.total} emails`
      };

    } catch (error) {
      console.error('❌ Erreur envoi campagne:', error);

      // Marquer la campagne comme échouée
      try {
        await Campaign.updateOne(
          { _id: campaignId },
          { status: 'draft' } // Remettre en brouillon pour permettre un nouvel essai
        );
      } catch (updateError) {
        console.error('❌ Erreur mise à jour campagne:', updateError);
      }

      throw error;
    }
  }

  /**
   * Envoie un email de test
   */
  async sendTestEmail({
    to,
    subject,
    htmlContent,
    textContent = null
  }) {
    if (!this.mailgun) {
      throw new Error('Service Mailgun non initialisé');
    }

    try {
      const messageData = {
        from: `PressPilot Test <${this.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject: `[TEST] ${subject}`,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent),
        'o:tag': ['presspilot-test']
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);

      return {
        success: true,
        emailId: response.id,
        message: 'Email de test envoyé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur envoi email de test:', error);
      throw new Error(`Échec envoi test: ${error.message}`);
    }
  }

  /**
   * Convertit HTML en texte plain basique
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Obtient les statistiques Mailgun pour une campagne
   */
  async getCampaignStats(campaignId, startDate, endDate) {
    if (!this.mailgun) {
      throw new Error('Service Mailgun non initialisé');
    }

    try {
      const params = {
        event: ['accepted', 'delivered', 'failed', 'opened', 'clicked'],
        begin: startDate.toISOString(),
        end: endDate.toISOString(),
        campaign: campaignId
      };

      const events = await this.mailgun.events.get(this.domain, params);

      const stats = {
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        events: events.items || []
      };

      events.items?.forEach(event => {
        switch (event.event) {
          case 'accepted':
            stats.sent++;
            break;
          case 'delivered':
            stats.delivered++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'opened':
            stats.opened++;
            break;
          case 'clicked':
            stats.clicked++;
            break;
        }
      });

      return stats;

    } catch (error) {
      console.error('❌ Erreur récupération stats Mailgun:', error);
      throw new Error(`Échec récupération stats: ${error.message}`);
    }
  }
}

// Instance singleton
const emailService = new EmailService();

module.exports = emailService;