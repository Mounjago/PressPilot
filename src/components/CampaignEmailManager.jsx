/**
 * GESTIONNAIRE DE CAMPAGNES EMAIL - INTERFACE COMPLÈTE
 * Interface React pour la gestion complète des campagnes email avec envoi réel
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CampaignEmailManager.css';

const CampaignEmailManager = ({ campaignId, onCampaignUpdate }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [stats, setStats] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  // Configuration API
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api`;
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Charger les données de la campagne
  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
      checkServiceStatus();
    }
  }, [campaignId]);

  // Mise à jour des stats en temps réel pour les campagnes envoyées
  useEffect(() => {
    let interval;
    if (campaign?.status === 'sent' || campaign?.status === 'sending') {
      interval = setInterval(() => {
        loadRealTimeStats();
      }, 30000); // Toutes les 30 secondes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaign?.status]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/campaigns/${campaignId}`, axiosConfig);

      if (response.data.success) {
        setCampaign(response.data.data);

        // Charger les stats si la campagne est envoyée
        if (response.data.data.status === 'sent') {
          loadCampaignStats();
        }
      } else {
        setError('Erreur lors du chargement de la campagne');
      }
    } catch (err) {
      console.error('Erreur chargement campagne:', err);
      setError('Impossible de charger les données de la campagne');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/campaigns/${campaignId}/stats`, axiosConfig);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/email/stats/real-time/${campaignId}`, axiosConfig);
      if (response.data.success) {
        setRealTimeStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur stats temps réel:', err);
    }
  };

  const checkServiceStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/campaigns/service/status`, axiosConfig);
      setServiceStatus(response.data);
    } catch (err) {
      console.error('Erreur statut service:', err);
      setServiceStatus({ success: false, status: 'error', message: 'Service indisponible' });
    }
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;

    try {
      setSending(true);
      setError('');

      const response = await axios.post(
        `${API_URL}/campaigns/${campaignId}/send`,
        {
          confirmSend: 'true',
          batchSize: 10,
          delayMs: 100
        },
        axiosConfig
      );

      if (response.data.success) {
        setCampaign(prev => ({ ...prev, status: 'sending' }));
        setShowConfirmSend(false);

        // Recharger les données après 2 secondes
        setTimeout(() => {
          loadCampaignData();
          if (onCampaignUpdate) onCampaignUpdate();
        }, 2000);

        alert(`Campagne envoyée avec succès ! ${response.data.data.successfulSends}/${response.data.data.totalTargets} emails envoyés.`);
      } else {
        setError(response.data.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Erreur envoi campagne:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de la campagne');
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !campaign) return;

    try {
      const response = await axios.post(
        `${API_URL}/campaigns/test-email`,
        {
          to: testEmail,
          subject: campaign.subject,
          htmlContent: campaign.htmlContent || campaign.content,
          textContent: campaign.content
        },
        axiosConfig
      );

      if (response.data.success) {
        alert(`Email de test envoyé avec succès à ${testEmail} !`);
        setShowTestModal(false);
        setTestEmail('');
      } else {
        alert('Erreur lors de l\'envoi du test : ' + response.data.message);
      }
    } catch (err) {
      console.error('Erreur test email:', err);
      alert('Erreur lors de l\'envoi du test : ' + (err.response?.data?.message || err.message));
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'scheduled': return '#007bff';
      case 'sending': return '#fd7e14';
      case 'sent': return '#28a745';
      case 'paused': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'scheduled': return 'Programmée';
      case 'sending': return 'Envoi en cours';
      case 'sent': return 'Envoyée';
      case 'paused': return 'En pause';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="campaign-email-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de la campagne...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="campaign-email-manager">
        <div className="error-state">
          <h3>Erreur</h3>
          <p>{error}</p>
          <button onClick={loadCampaignData} className="btn-retry">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="campaign-email-manager">
        <div className="empty-state">
          <p>Aucune campagne sélectionnée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-email-manager">
      {/* En-tête de la campagne */}
      <div className="campaign-header">
        <div className="campaign-info">
          <h2>{campaign.name}</h2>
          <p className="campaign-subject">{campaign.subject}</p>
          <div className="campaign-meta">
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(campaign.status) }}
            >
              {getStatusText(campaign.status)}
            </span>
            <span className="target-count">
              {campaign.targetContacts?.length || 0} contacts ciblés
            </span>
            {campaign.sentAt && (
              <span className="sent-date">
                Envoyée le {new Date(campaign.sentAt).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* Actions de la campagne */}
        <div className="campaign-actions">
          {/* Statut du service */}
          {serviceStatus && (
            <div className={`service-status ${serviceStatus.success ? 'online' : 'offline'}`}>
              <span className="status-indicator"></span>
              Service Email: {serviceStatus.success ? 'En ligne' : 'Hors ligne'}
            </div>
          )}

          {/* Bouton de test */}
          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <button
              className="btn-test"
              onClick={() => setShowTestModal(true)}
              disabled={!serviceStatus?.success}
            >
              📧 Tester
            </button>
          )}

          {/* Bouton d'envoi */}
          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <button
              className="btn-send"
              onClick={() => setShowConfirmSend(true)}
              disabled={sending || !serviceStatus?.success || !campaign.targetContacts?.length}
            >
              {sending ? '⏳ Envoi...' : '🚀 Envoyer la campagne'}
            </button>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Statistiques de la campagne */}
      {(campaign.status === 'sent' || campaign.status === 'sending') && (
        <div className="campaign-stats">
          <h3>Statistiques de performance</h3>

          {/* Métriques principales */}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Emails envoyés</h4>
              <div className="stat-value">{formatNumber(stats?.metrics?.totalSent || 0)}</div>
            </div>
            <div className="stat-card">
              <h4>Taux d'ouverture</h4>
              <div className="stat-value">{formatPercentage(stats?.metrics?.openRate)}</div>
              <div className="stat-detail">{formatNumber(stats?.metrics?.totalOpened)} ouvertures</div>
            </div>
            <div className="stat-card">
              <h4>Taux de clic</h4>
              <div className="stat-value">{formatPercentage(stats?.metrics?.clickRate)}</div>
              <div className="stat-detail">{formatNumber(stats?.metrics?.totalClicked)} clics</div>
            </div>
            <div className="stat-card">
              <h4>Taux de réponse</h4>
              <div className="stat-value">{formatPercentage(stats?.metrics?.responseRate)}</div>
              <div className="stat-detail">{formatNumber(stats?.metrics?.totalReplied)} réponses</div>
            </div>
          </div>

          {/* Activité récente */}
          {realTimeStats?.recentActivity && realTimeStats.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h4>Activité récente</h4>
              <div className="activity-list">
                {realTimeStats.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-contact">
                      {activity.contactId?.firstName} {activity.contactId?.lastName}
                    </div>
                    <div className="activity-action">
                      {activity.status === 'opened' && '👀 A ouvert l\'email'}
                      {activity.status === 'clicked' && '🔗 A cliqué sur un lien'}
                      {activity.status === 'replied' && '💬 A répondu'}
                    </div>
                    <div className="activity-time">
                      {new Date(activity.updatedAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights de performance */}
          {stats?.performance?.insights && stats.performance.insights.length > 0 && (
            <div className="performance-insights">
              <h4>Conseils d'optimisation</h4>
              <div className="insights-list">
                {stats.performance.insights.map((insight, index) => (
                  <div key={index} className={`insight-item ${insight.type}`}>
                    <div className="insight-message">{insight.message}</div>
                    <div className="insight-suggestion">{insight.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation d'envoi */}
      {showConfirmSend && (
        <div className="modal-overlay">
          <div className="modal confirm-send-modal">
            <h3>Confirmer l'envoi de la campagne</h3>
            <div className="modal-content">
              <p><strong>Campagne:</strong> {campaign.name}</p>
              <p><strong>Sujet:</strong> {campaign.subject}</p>
              <p><strong>Destinataires:</strong> {campaign.targetContacts?.length || 0} contacts</p>

              <div className="warning-box">
                ⚠️ Cette action est irréversible. Les emails seront envoyés immédiatement.
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmSend(false)}
                disabled={sending}
              >
                Annuler
              </button>
              <button
                className="btn-confirm"
                onClick={handleSendCampaign}
                disabled={sending}
              >
                {sending ? 'Envoi en cours...' : 'Confirmer l\'envoi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de test d'email */}
      {showTestModal && (
        <div className="modal-overlay">
          <div className="modal test-email-modal">
            <h3>Envoyer un email de test</h3>
            <div className="modal-content">
              <p>Envoyez un aperçu de cette campagne à votre adresse email :</p>
              <input
                type="email"
                placeholder="votre.email@exemple.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="test-email-input"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
              >
                Annuler
              </button>
              <button
                className="btn-send-test"
                onClick={handleSendTestEmail}
                disabled={!testEmail}
              >
                Envoyer le test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignEmailManager;