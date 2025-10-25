/**
 * EMAIL PROCESSOR - Traitement des emails reçus depuis la queue
 * Gestion de l'association avec les campagnes et stockage en base
 */

const { simpleParser } = require('mailparser');
const Campaign = require('../models/Campaign');

class EmailProcessor {
  /**
   * Traiter un email reçu depuis la queue
   */
  async processIncomingEmail(emailData, configId, suggestedCampaignId = null) {
    try {
      console.log(`📧 Traitement email: ${emailData.messageId} pour config: ${configId}`);

      // Parser l'email complet si nécessaire
      const parsedEmail = await this.parseEmailContent(emailData);

      // Associer à une campagne
      const campaign = await this.associateWithCampaign(parsedEmail, suggestedCampaignId);

      // Créer l'objet message formaté
      const processedMessage = await this.createProcessedMessage(parsedEmail, configId, campaign);

      // Stocker en base de données
      const savedMessage = await this.saveMessageToDatabase(processedMessage);

      // Mettre à jour les statistiques de la campagne
      if (campaign) {
        await this.updateCampaignStats(campaign._id, savedMessage);
      }

      console.log(`✅ Email traité et sauvegardé: ${savedMessage._id}`);

      return {
        success: true,
        messageId: savedMessage._id,
        campaignId: campaign?._id,
        processed: true
      };

    } catch (error) {
      console.error('❌ Erreur traitement email:', error);
      throw error;
    }
  }

  /**
   * Parser le contenu complet de l'email
   */
  async parseEmailContent(emailData) {
    try {
      // Si c'est déjà parsé, le retourner tel quel
      if (emailData.parsed) {
        return emailData;
      }

      // Parser avec mailparser si nécessaire
      if (emailData.raw) {
        const parsed = await simpleParser(emailData.raw);
        return {
          ...emailData,
          ...parsed,
          parsed: true
        };
      }

      return emailData;
    } catch (error) {
      console.error('❌ Erreur parsing email:', error);
      throw error;
    }
  }

  /**
   * Associer l'email à une campagne
   */
  async associateWithCampaign(parsedEmail, suggestedCampaignId = null) {
    try {
      let campaign = null;

      // 1. Utiliser la campagne suggérée si fournie
      if (suggestedCampaignId) {
        campaign = await Campaign.findById(suggestedCampaignId);
        if (campaign) {
          console.log(`📎 Campagne associée par suggestion: ${campaign.title}`);
          return campaign;
        }
      }

      // 2. Rechercher par headers de réponse (In-Reply-To, References)
      campaign = await this.findCampaignByHeaders(parsedEmail);
      if (campaign) {
        console.log(`📎 Campagne associée par headers: ${campaign.title}`);
        return campaign;
      }

      // 3. Rechercher par sujet (Re: [Campaign Title])
      campaign = await this.findCampaignBySubject(parsedEmail);
      if (campaign) {
        console.log(`📎 Campagne associée par sujet: ${campaign.title}`);
        return campaign;
      }

      // 4. Rechercher par adresse email de l'expéditeur dans les destinataires de campagnes récentes
      campaign = await this.findCampaignByRecipient(parsedEmail);
      if (campaign) {
        console.log(`📎 Campagne associée par destinataire: ${campaign.title}`);
        return campaign;
      }

      console.log('📭 Aucune campagne associée - email non classifié');
      return null;

    } catch (error) {
      console.error('❌ Erreur association campagne:', error);
      return null;
    }
  }

  /**
   * Rechercher une campagne par les headers de réponse
   */
  async findCampaignByHeaders(parsedEmail) {
    try {
      const inReplyTo = parsedEmail.inReplyTo;
      const references = parsedEmail.references;

      if (!inReplyTo && !references) return null;

      const headerValues = [
        inReplyTo,
        ...(Array.isArray(references) ? references : [references])
      ].filter(Boolean);

      if (headerValues.length === 0) return null;

      // Rechercher dans les messages de campagnes
      const campaign = await Campaign.findOne({
        'messages.messageId': { $in: headerValues }
      });

      return campaign;
    } catch (error) {
      console.error('❌ Erreur recherche par headers:', error);
      return null;
    }
  }

  /**
   * Rechercher une campagne par le sujet
   */
  async findCampaignBySubject(parsedEmail) {
    try {
      const subject = parsedEmail.subject || '';

      // Extraire le titre original du sujet (supprimer Re:, Fwd:, etc.)
      const cleanSubject = subject
        .replace(/^(Re|Fwd|Fw):\s*/gi, '')
        .trim();

      if (!cleanSubject) return null;

      // Rechercher une campagne avec un titre similaire
      const campaign = await Campaign.findOne({
        $or: [
          { title: { $regex: cleanSubject, $options: 'i' } },
          { subject: { $regex: cleanSubject, $options: 'i' } }
        ],
        status: { $in: ['sent', 'active'] }
      }).sort({ sentAt: -1 });

      return campaign;
    } catch (error) {
      console.error('❌ Erreur recherche par sujet:', error);
      return null;
    }
  }

  /**
   * Rechercher une campagne par l'adresse du destinataire
   */
  async findCampaignByRecipient(parsedEmail) {
    try {
      const fromEmail = parsedEmail.from?.value?.[0]?.address || parsedEmail.from?.address;
      if (!fromEmail) return null;

      // Rechercher dans les campagnes des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const campaign = await Campaign.findOne({
        'recipients.email': fromEmail,
        $or: [
          { sentAt: { $gte: thirtyDaysAgo } },
          { status: 'active' }
        ]
      }).sort({ sentAt: -1 });

      return campaign;
    } catch (error) {
      console.error('❌ Erreur recherche par destinataire:', error);
      return null;
    }
  }

  /**
   * Créer l'objet message formaté pour la base de données
   */
  async createProcessedMessage(parsedEmail, configId, campaign) {
    const fromAddress = parsedEmail.from?.value?.[0] || parsedEmail.from || {};
    const toAddresses = parsedEmail.to?.value || parsedEmail.to || [];

    return {
      messageId: parsedEmail.messageId,
      threadId: parsedEmail.inReplyTo || parsedEmail.messageId,
      configId: configId,
      campaignId: campaign?._id || null,

      // Headers de base
      from: {
        name: fromAddress.name || '',
        email: fromAddress.address || fromAddress.email || ''
      },
      to: toAddresses.map(addr => ({
        name: addr.name || '',
        email: addr.address || addr.email || addr
      })),
      cc: parsedEmail.cc?.value?.map(addr => ({
        name: addr.name || '',
        email: addr.address || ''
      })) || [],
      bcc: parsedEmail.bcc?.value?.map(addr => ({
        name: addr.name || '',
        email: addr.address || ''
      })) || [],

      // Contenu
      subject: parsedEmail.subject || '',
      text: parsedEmail.text || '',
      html: parsedEmail.html || '',

      // Métadonnées
      date: parsedEmail.date || new Date(),
      headers: {
        inReplyTo: parsedEmail.inReplyTo,
        references: parsedEmail.references,
        messageId: parsedEmail.messageId
      },

      // Pièces jointes
      attachments: parsedEmail.attachments?.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        contentId: att.contentId
      })) || [],

      // Métadonnées de traitement
      processed: true,
      processedAt: new Date(),
      source: 'imap',

      // Statut et flags
      flags: {
        seen: parsedEmail.flags?.includes('\\Seen') || false,
        flagged: parsedEmail.flags?.includes('\\Flagged') || false,
        answered: parsedEmail.flags?.includes('\\Answered') || false,
        draft: parsedEmail.flags?.includes('\\Draft') || false
      }
    };
  }

  /**
   * Sauvegarder le message en base de données
   */
  async saveMessageToDatabase(messageData) {
    try {
      // Créer un modèle Message si il n'existe pas déjà
      const Message = require('../models/Message');

      // Vérifier si le message existe déjà
      const existingMessage = await Message.findOne({
        messageId: messageData.messageId
      });

      if (existingMessage) {
        console.log(`📧 Message déjà existant: ${messageData.messageId}`);
        return existingMessage;
      }

      // Créer le nouveau message
      const message = new Message(messageData);
      const savedMessage = await message.save();

      console.log(`💾 Message sauvegardé: ${savedMessage._id}`);
      return savedMessage;

    } catch (error) {
      console.error('❌ Erreur sauvegarde message:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques de la campagne
   */
  async updateCampaignStats(campaignId, message) {
    try {
      const update = {
        $inc: {
          'analytics.responses': 1,
          'analytics.totalEngagement': 1
        },
        $push: {
          'responses': {
            messageId: message._id,
            from: message.from.email,
            subject: message.subject,
            receivedAt: message.date,
            type: 'email'
          }
        }
      };

      await Campaign.findByIdAndUpdate(campaignId, update);
      console.log(`📊 Statistiques campagne mises à jour: ${campaignId}`);

    } catch (error) {
      console.error('❌ Erreur mise à jour stats campagne:', error);
    }
  }

  /**
   * Extraire et analyser le sentiment de l'email (optionnel)
   */
  async analyzeSentiment(text) {
    try {
      // Analyse simple du sentiment basée sur des mots-clés
      const positiveWords = ['merci', 'excellent', 'génial', 'parfait', 'super', 'bravo'];
      const negativeWords = ['problème', 'erreur', 'déçu', 'mauvais', 'nul', 'horrible'];

      const words = text.toLowerCase().split(/\s+/);

      let positiveCount = 0;
      let negativeCount = 0;

      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });

      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';

    } catch (error) {
      console.error('❌ Erreur analyse sentiment:', error);
      return 'neutral';
    }
  }
}

module.exports = new EmailProcessor();