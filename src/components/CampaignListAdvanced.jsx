/**
 * LISTE AVANCÉE DES CAMPAGNES EMAIL
 * Interface complète pour visualiser et gérer toutes les campagnes
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CampaignEmailManager from './CampaignEmailManager';
import '../styles/CampaignListAdvanced.css';

const CampaignListAdvanced = ({ artistId, projectId }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Configuration API
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api`;
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [filters, pagination.page, artistId, projectId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);

      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (artistId) {
        params.append('artistId', artistId);
      }

      if (projectId) {
        params.append('projectId', projectId);
      }

      // Charger depuis l'API
      const response = await axios.get(`${API_URL}/campaigns?${params.toString()}`, axiosConfig);

      if (response.data.success) {
        setCampaigns(response.data.data.campaigns || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total || 0,
          pages: response.data.data.pages || 0
        }));
      } else {
        throw new Error(response.data.message || 'Erreur lors du chargement des campagnes');
      }

    } catch (err) {
      console.error('Erreur chargement campagnes:', err);
      setError('Impossible de charger les campagnes depuis l\'API');

      // Fallback vers localStorage si l'API échoue
      try {
        const storageKey = `presspilot-campaigns-${artistId}-${projectId}`;
        const savedCampaigns = localStorage.getItem(storageKey);
        let allCampaigns = savedCampaigns ? JSON.parse(savedCampaigns) : [];

        // Filtrer par statut si nécessaire
        if (filters.status !== 'all') {
          allCampaigns = allCampaigns.filter(campaign => campaign.status === filters.status);
        }

        // Trier les campagnes
        allCampaigns.sort((a, b) => {
          const field = filters.sortBy;
          const order = filters.sortOrder === 'asc' ? 1 : -1;

          if (field === 'createdAt' || field === 'sentAt') {
            return order * (new Date(a[field] || 0) - new Date(b[field] || 0));
          } else if (field === 'name') {
            return order * a[field].localeCompare(b[field]);
          }
          return 0;
        });

        // Pagination
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        const paginatedCampaigns = allCampaigns.slice(start, end);

        setCampaigns(paginatedCampaigns);
        setPagination(prev => ({
          ...prev,
          total: allCampaigns.length,
          pages: Math.ceil(allCampaigns.length / pagination.limit)
        }));

        setError('Chargement depuis localStorage (mode hors ligne)');
      } catch (fallbackErr) {
        console.error('Erreur fallback localStorage:', fallbackErr);
        setError('Impossible de charger les campagnes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleCampaignUpdate = () => {
    loadCampaigns();
    if (selectedCampaign) {
      // Recharger la campagne sélectionnée
      const updatedCampaign = campaigns.find(c => c.id === selectedCampaign.id);
      if (updatedCampaign) {
        setSelectedCampaign(updatedCampaign);
      }
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  if (selectedCampaign) {
    return (
      <div className="campaign-list-advanced">
        <div className="campaign-detail-header">
          <button
            className="btn-back"
            onClick={() => setSelectedCampaign(null)}
          >
            ← Retour à la liste
          </button>
          <h2>Détails de la campagne</h2>
        </div>
        <CampaignEmailManager
          campaignId={selectedCampaign.id}
          onCampaignUpdate={handleCampaignUpdate}
        />
      </div>
    );
  }

  return (
    <div className="campaign-list-advanced">
      {/* En-tête avec filtres */}
      <div className="campaigns-header">
        <div className="header-info">
          <h2>Campagnes Email</h2>
          <p>{pagination.total} campagne{pagination.total !== 1 ? 's' : ''} au total</p>
        </div>

        <div className="campaigns-filters">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="scheduled">Programmées</option>
            <option value="sending">En cours d'envoi</option>
            <option value="sent">Envoyées</option>
            <option value="paused">En pause</option>
            <option value="cancelled">Annulées</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange({ sortBy, sortOrder });
            }}
            className="filter-select"
          >
            <option value="createdAt-desc">Plus récentes</option>
            <option value="createdAt-asc">Plus anciennes</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
            <option value="sentAt-desc">Envoyées récemment</option>
            <option value="metrics.openRate-desc">Meilleur taux d'ouverture</option>
            <option value="metrics.responseRate-desc">Meilleur taux de réponse</option>
          </select>
        </div>
      </div>

      {/* Messages d'état */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des campagnes...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadCampaigns} className="btn-retry">
            Réessayer
          </button>
        </div>
      )}

      {/* Liste des campagnes */}
      {!loading && !error && campaigns.length === 0 && (
        <div className="empty-state">
          <h3>Aucune campagne trouvée</h3>
          <p>Créez votre première campagne email pour commencer.</p>
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <>
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="campaign-card"
                onClick={() => handleCampaignSelect(campaign)}
              >
                <div className="campaign-card-header">
                  <h3 className="campaign-name">{campaign.name}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                  >
                    {getStatusText(campaign.status)}
                  </span>
                </div>

                <p className="campaign-subject">{campaign.subject}</p>

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Contacts ciblés:</span>
                    <span className="meta-value">{campaign.targetContacts?.length || 0}</span>
                  </div>

                  {campaign.sentAt && (
                    <div className="meta-item">
                      <span className="meta-label">Envoyée:</span>
                      <span className="meta-value">{formatDate(campaign.sentAt)}</span>
                    </div>
                  )}

                  {campaign.scheduledAt && campaign.status === 'scheduled' && (
                    <div className="meta-item">
                      <span className="meta-label">Programmée:</span>
                      <span className="meta-value">{formatDate(campaign.scheduledAt)}</span>
                    </div>
                  )}

                  <div className="meta-item">
                    <span className="meta-label">Créée:</span>
                    <span className="meta-value">{formatDate(campaign.createdAt)}</span>
                  </div>
                </div>

                {/* Métriques pour les campagnes envoyées */}
                {campaign.status === 'sent' && campaign.metrics && (
                  <div className="campaign-metrics">
                    <div className="metric">
                      <div className="metric-label">Envoyés</div>
                      <div className="metric-value">{formatNumber(campaign.metrics.totalSent)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Ouvertures</div>
                      <div className="metric-value">{formatPercentage(campaign.metrics.openRate)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Clics</div>
                      <div className="metric-value">{formatPercentage(campaign.metrics.clickRate)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Réponses</div>
                      <div className="metric-value">{formatPercentage(campaign.metrics.responseRate)}</div>
                    </div>
                  </div>
                )}

                {/* Indicateur d'activité pour les campagnes en cours */}
                {campaign.status === 'sending' && (
                  <div className="sending-indicator">
                    <div className="sending-progress"></div>
                    <span>Envoi en cours...</span>
                  </div>
                )}

                <div className="campaign-card-actions">
                  <button className="btn-view">
                    {campaign.status === 'draft' || campaign.status === 'scheduled'
                      ? 'Modifier & Envoyer'
                      : 'Voir les détails'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                ← Précédent
              </button>

              <div className="pagination-info">
                Page {pagination.page} sur {pagination.pages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignListAdvanced;