import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Calendar,
  User,
  FileText,
  Send,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Phone,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { campaignsApi } from '../api';

export default function CampaignDetailsModal({ projectId, projectName, onClose }) {
  const [campaign, setCampaign] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEmails, setExpandedEmails] = useState(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    message: '',
    targetContacts: 'all'
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectCampaigns();
    }
  }, [projectId]);

  const fetchProjectCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les campagnes liées au projet depuis localStorage ou API
      const savedCampaigns = localStorage.getItem(`presspilot-campaigns-${projectId}`);
      let projectCampaigns = [];

      if (savedCampaigns) {
        projectCampaigns = JSON.parse(savedCampaigns);
      }

      // Si on a des campagnes, prendre la première comme campagne active
      if (projectCampaigns.length > 0) {
        const activeCampaign = projectCampaigns[0];
        setCampaign(activeCampaign);

        // Récupérer les échanges pour cette campagne
        if (activeCampaign.id) {
          try {
            const exchangesResponse = await campaignsApi.getExchanges(activeCampaign.id);
            setExchanges(exchangesResponse.data || []);
          } catch (error) {
            console.log('Aucun échange trouvé pour cette campagne');
            setExchanges([]);
          }
        }
      } else {
        // Pas de campagne, afficher le formulaire de création
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      setError('Impossible de charger les campagnes du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Créer une nouvelle campagne
      const campaignData = {
        id: Date.now(),
        name: newCampaign.name,
        subject: newCampaign.subject,
        message: newCampaign.message,
        projectId: projectId,
        projectName: projectName,
        status: 'draft',
        createdAt: new Date().toISOString(),
        stats: { sent: 0, opened: 0, replied: 0 }
      };

      // Sauvegarder dans localStorage
      const savedCampaigns = localStorage.getItem(`presspilot-campaigns-${projectId}`);
      let campaigns = savedCampaigns ? JSON.parse(savedCampaigns) : [];
      campaigns.unshift(campaignData);
      localStorage.setItem(`presspilot-campaigns-${projectId}`, JSON.stringify(campaigns));

      setCampaign(campaignData);
      setShowCreateForm(false);
      setNewCampaign({ name: '', subject: '', message: '', targetContacts: 'all' });
    } catch (error) {
      console.error('Erreur lors de la création de la campagne:', error);
      setError('Impossible de créer la campagne');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;

    setLoading(true);
    try {
      // Simuler l'envoi d'email
      const sentEmail = {
        _id: Date.now(),
        type: 'sent',
        subject: campaign.subject,
        htmlContent: campaign.message,
        sentAt: new Date().toISOString(),
        status: 'sent',
        contact: {
          name: 'Contact Test',
          email: 'test@example.com',
          media: 'Média Test'
        },
        tracking: {
          opened: false,
          clicked: false,
          replied: false
        }
      };

      setExchanges(prev => [sentEmail, ...prev]);

      // Mettre à jour les stats de la campagne
      const updatedCampaign = {
        ...campaign,
        stats: { ...campaign.stats, sent: (campaign.stats.sent || 0) + 1 },
        status: 'sent'
      };
      setCampaign(updatedCampaign);

      // Sauvegarder dans localStorage
      const savedCampaigns = localStorage.getItem(`presspilot-campaigns-${projectId}`);
      let campaigns = savedCampaigns ? JSON.parse(savedCampaigns) : [];
      campaigns = campaigns.map(c => c.id === campaign.id ? updatedCampaign : c);
      localStorage.setItem(`presspilot-campaigns-${projectId}`, JSON.stringify(campaigns));

    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setError('Impossible d\'envoyer la campagne');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailExpansion = (emailId) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'opened': return 'text-green-600 bg-green-100';
      case 'clicked': return 'text-purple-600 bg-purple-100';
      case 'replied': return 'text-indigo-600 bg-indigo-100';
      case 'bounced': return 'text-red-600 bg-red-100';
      case 'failed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4" />;
      case 'opened': return <Mail className="h-4 w-4" />;
      case 'clicked': return <ExternalLink className="h-4 w-4" />;
      case 'replied': return <MessageSquare className="h-4 w-4" />;
      case 'bounced': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-inter">
                {showCreateForm ? 'Nouvelle campagne' : (campaign?.name || 'Campagnes')}
              </h2>
              <p className="text-gray-600 text-sm font-inter">
                {projectName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 text-lg font-medium"
            >
              ×
            </button>
          </div>

          {campaign && !showCreateForm && (
            <div className="mt-4 flex items-center space-x-6 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="font-inter">{formatDate(campaign.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span className="font-inter">{campaign.stats?.sent || 0} envoyés</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-inter">{campaign.stats?.replied || 0} réponses</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-inter">
                  {campaign.stats?.sent > 0
                    ? Math.round((campaign.stats?.replied / campaign.stats?.sent) * 100)
                    : 0}% taux de réponse
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto bg-slate-50/50" style={{ maxHeight: 'calc(95vh - 240px)' }}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-500"></div>
              <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          ) : showCreateForm ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="settings-section">
                  <h2 className="settings-section-title">
                    Creer une nouvelle campagne
                  </h2>

                  <form onSubmit={handleCreateCampaign} className="settings-form">
                    <div className="form-section">
                      <h3>Informations de la campagne</h3>
                      <p className="form-section-description">
                        Rédigez votre message pour promouvoir votre projet
                      </p>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nom de la campagne</label>
                          <input
                            type="text"
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            placeholder="Ex: Promo Album Printemps 2024"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Sujet de l'email</label>
                          <input
                            type="text"
                            value={newCampaign.subject}
                            onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                            placeholder="Ex: Nouveau single disponible"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Contenu du message</h3>
                      <div className="form-group">
                        <label>Message</label>
                        <textarea
                          value={newCampaign.message}
                          onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                          rows={8}
                          className="form-textarea"
                          placeholder="Bonjour [Nom],

Je vous contacte au sujet de notre nouveau projet...

Cordialement,
[Votre nom]"
                        required
                      />
                        <small className="form-help">
                          Vous pouvez utiliser [Nom] pour personnaliser avec le nom du contact
                        </small>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                      >
                        <FileText size={16} />
                        {loading ? 'Création...' : 'Créer la campagne'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white/50 backdrop-blur-sm">
              {/* Statistiques de la campagne */}
              {campaign && (
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-sm font-medium mb-1 font-inter">Envoyés</p>
                          <p className="text-3xl font-bold font-inter">
                            {campaign.stats?.sent || 0}
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3">
                          <Send className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1 font-inter">Ouverts</p>
                          <p className="text-3xl font-bold font-inter">
                            {campaign.stats?.opened || 0}
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3">
                          <Mail className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-100 text-sm font-medium mb-1 font-inter">Réponses</p>
                          <p className="text-3xl font-bold font-inter">
                            {campaign.stats?.replied || 0}
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-sm font-medium mb-1 font-inter">Taux de réponse</p>
                          <p className="text-3xl font-bold font-inter">
                            {campaign.stats?.sent > 0
                              ? Math.round((campaign.stats?.replied / campaign.stats?.sent) * 100)
                              : 0}%
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des échanges */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center font-inter">
                    <MessageSquare className="h-6 w-6 mr-3 text-emerald-600" />
                    Historique des échanges
                  </h3>
                  {campaign && campaign.status === 'draft' && (
                    <button
                      onClick={handleSendCampaign}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg flex items-center font-inter"
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Envoi...' : 'Envoyer maintenant'}
                    </button>
                  )}
                </div>

                {exchanges.length === 0 ? (
                  <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 w-20 h-20 mx-auto mb-4 shadow-sm">
                      <Mail className="h-12 w-12 text-emerald-500 mx-auto" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2 font-inter">Aucun échange</h4>
                    <p className="text-gray-600 font-inter">
                      {campaign?.status === 'draft'
                        ? 'Votre campagne est prête à être envoyée'
                        : 'Les échanges apparaîtront ici après l\'envoi'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exchanges.map((exchange) => (
                      <div
                        key={exchange._id}
                        className="bg-white/90 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 shadow-lg"
                      >
                        {/* En-tête de l'échange */}
                        <div
                          className="p-6 cursor-pointer hover:bg-white/60 transition-all duration-200"
                          onClick={() => toggleEmailExpansion(exchange._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exchange.status)}`}>
                                {getStatusIcon(exchange.status)}
                                <span className="ml-1">{exchange.status}</span>
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatDate(exchange.sentAt || exchange.receivedAt)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="font-medium text-gray-900 font-inter">
                                {exchange.type === 'sent' ? 'À: ' : 'De: '}
                                {exchange.contact?.name || exchange.to || exchange.from}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 font-inter">
                                <span className="font-medium">Sujet:</span> {exchange.subject}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4">
                            {expandedEmails.has(exchange._id) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Informations du contact */}
                        {exchange.contact && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {exchange.contact.media && (
                              <span className="inline-flex items-center text-xs text-gray-600">
                                <FileText className="h-3 w-3 mr-1" />
                                {exchange.contact.media}
                              </span>
                            )}
                            {exchange.contact.type && (
                              <span className="inline-flex items-center text-xs text-gray-600">
                                <Tag className="h-3 w-3 mr-1" />
                                {exchange.contact.type}
                              </span>
                            )}
                            {exchange.contact.location && (
                              <span className="inline-flex items-center text-xs text-gray-600">
                                <MapPin className="h-3 w-3 mr-1" />
                                {exchange.contact.location}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contenu de l'email (expandable) */}
                      {expandedEmails.has(exchange._id) && (
                        <div className="p-4 border-t border-white/40 bg-white/60 backdrop-blur-sm">
                          {/* Tracking details */}
                          {exchange.tracking && (
                            <div className="mb-4 p-3 bg-emerald-50 rounded-xl">
                              <h4 className="text-sm font-medium text-emerald-900 mb-2 font-inter">
                                Suivi de l'email
                              </h4>
                              <div className="space-y-1 text-xs text-emerald-700 font-inter">
                                {exchange.tracking.opened && (
                                  <p>✓ Ouvert le {formatDate(exchange.tracking.openedAt)}</p>
                                )}
                                {exchange.tracking.clicked && (
                                  <p>✓ Lien cliqué le {formatDate(exchange.tracking.clickedAt)}</p>
                                )}
                                {exchange.tracking.replied && (
                                  <p>✓ Répondu le {formatDate(exchange.tracking.repliedAt)}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Corps du message */}
                          <div className="prose max-w-none">
                            <div
                              className="text-sm text-gray-700 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: exchange.htmlContent || exchange.textContent || exchange.body
                              }}
                            />
                          </div>

                          {/* Réponse si présente */}
                          {exchange.reply && (
                            <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
                              <h4 className="text-sm font-medium text-indigo-900 mb-2 font-inter">
                                Réponse reçue
                              </h4>
                              <div className="text-sm text-indigo-700 whitespace-pre-wrap font-inter">
                                {exchange.reply.content}
                              </div>
                              <p className="text-xs text-indigo-600 mt-2 font-inter">
                                {formatDate(exchange.reply.receivedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-6 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              {campaign && !showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center font-medium shadow-lg font-inter"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nouvelle campagne
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg font-inter"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}