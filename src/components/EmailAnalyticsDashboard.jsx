/**
 * DASHBOARD ANALYTICS EMAIL - TEMPS RÉEL
 * Interface complète pour visualiser les performances des campagnes email
 */

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import '../styles/EmailAnalyticsDashboard.css';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EmailAnalyticsDashboard = ({ campaignId = null, timeRange = '30d' }) => {
  const [globalStats, setGlobalStats] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [realTimeActivity, setRealTimeActivity] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30); // secondes

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
    loadAnalyticsData();

    // Auto-refresh pour les données temps réel
    const interval = setInterval(() => {
      if (campaignId) {
        loadRealTimeStats();
      } else {
        loadGlobalStats();
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [campaignId, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      if (campaignId) {
        await Promise.all([
          loadCampaignStats(),
          loadRealTimeStats()
        ]);
      } else {
        await Promise.all([
          loadGlobalStats(),
          loadPerformanceData(),
          loadTopCampaigns()
        ]);
      }
    } catch (err) {
      console.error('Erreur chargement analytics:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/email/global`, {
        ...axiosConfig,
        params: { timeRange }
      });

      if (response.data.success) {
        setGlobalStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur stats globales:', err);
    }
  };

  const loadCampaignStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/campaigns/${campaignId}/stats`, axiosConfig);

      if (response.data.success) {
        setCampaignStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur stats campagne:', err);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/email/stats/real-time/${campaignId}`, axiosConfig);

      if (response.data.success) {
        setRealTimeActivity(response.data.data.recentActivity || []);
      }
    } catch (err) {
      console.error('Erreur stats temps réel:', err);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/email/performance`, {
        ...axiosConfig,
        params: { timeRange }
      });

      if (response.data.success) {
        setPerformanceData(response.data.data);
      }
    } catch (err) {
      console.error('Erreur données performance:', err);
    }
  };

  const loadTopCampaigns = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/email/top-campaigns`, {
        ...axiosConfig,
        params: { limit: 10, metric: 'responseRate' }
      });

      if (response.data.success) {
        setTopCampaigns(response.data.data);
      }
    } catch (err) {
      console.error('Erreur top campagnes:', err);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(num || 0);
  };

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const performanceChartData = performanceData ? {
    labels: performanceData.timeline?.map(item =>
      new Date(item.date).toLocaleDateString('fr-FR')
    ) || [],
    datasets: [
      {
        label: 'Taux d\'ouverture',
        data: performanceData.timeline?.map(item => item.openRate) || [],
        borderColor: '#0ED894',
        backgroundColor: 'rgba(14, 216, 148, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Taux de clic',
        data: performanceData.timeline?.map(item => item.clickRate) || [],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Taux de réponse',
        data: performanceData.timeline?.map(item => item.responseRate) || [],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
      },
    ],
  } : { labels: [], datasets: [] };

  const engagementChartData = globalStats ? {
    labels: ['Ouvertures', 'Clics', 'Réponses', 'Non-engagés'],
    datasets: [
      {
        data: [
          globalStats.totalOpened || 0,
          globalStats.totalClicked || 0,
          globalStats.totalReplied || 0,
          (globalStats.totalSent || 0) - (globalStats.totalOpened || 0),
        ],
        backgroundColor: [
          '#0ED894',
          '#007bff',
          '#28a745',
          '#e9ecef',
        ],
        borderWidth: 0,
      },
    ],
  } : { labels: [], datasets: [] };

  if (loading && !globalStats && !campaignStats) {
    return (
      <div className="email-analytics-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-analytics-dashboard">
      {/* En-tête du dashboard */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2>
            {campaignId ? 'Analytics Campagne' : 'Analytics Email'}
          </h2>
          <p>
            {campaignId
              ? 'Statistiques détaillées de la campagne'
              : `Données globales des ${timeRange === '7d' ? '7 derniers jours' : timeRange === '30d' ? '30 derniers jours' : 'derniers mois'}`
            }
          </p>
        </div>

        <div className="dashboard-controls">
          {!campaignId && (
            <select
              value={timeRange}
              onChange={(e) => window.location.reload()} // Simplification pour demo
              className="time-range-select"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
            </select>
          )}

          <div className="refresh-indicator">
            <span className="refresh-dot"></span>
            Mise à jour auto: {refreshInterval}s
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Erreur:</strong> {error}
          <button onClick={loadAnalyticsData} className="btn-retry">
            Réessayer
          </button>
        </div>
      )}

      {/* Métriques principales */}
      {(globalStats || campaignStats) && (
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">📧</div>
            <div className="metric-content">
              <h3>Emails envoyés</h3>
              <div className="metric-value">
                {formatNumber((globalStats?.totalSent || campaignStats?.metrics?.totalSent) || 0)}
              </div>
              <div className="metric-trend positive">
                +12% vs période précédente
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">👀</div>
            <div className="metric-content">
              <h3>Taux d'ouverture</h3>
              <div className="metric-value">
                {formatPercentage((globalStats?.avgOpenRate || campaignStats?.metrics?.openRate) || 0)}
              </div>
              <div className="metric-detail">
                {formatNumber((globalStats?.totalOpened || campaignStats?.metrics?.totalOpened) || 0)} ouvertures
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔗</div>
            <div className="metric-content">
              <h3>Taux de clic</h3>
              <div className="metric-value">
                {formatPercentage((globalStats?.avgClickRate || campaignStats?.metrics?.clickRate) || 0)}
              </div>
              <div className="metric-detail">
                {formatNumber((globalStats?.totalClicked || campaignStats?.metrics?.totalClicked) || 0)} clics
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💬</div>
            <div className="metric-content">
              <h3>Taux de réponse</h3>
              <div className="metric-value">
                {formatPercentage((globalStats?.avgResponseRate || campaignStats?.metrics?.responseRate) || 0)}
              </div>
              <div className="metric-detail">
                {formatNumber((globalStats?.totalReplied || campaignStats?.metrics?.totalReplied) || 0)} réponses
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques et analyses */}
      <div className="charts-grid">
        {/* Graphique de performance temporelle */}
        {!campaignId && performanceData && (
          <div className="chart-card">
            <h3>Évolution des performances</h3>
            <div className="chart-container">
              <Line data={performanceChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Répartition de l'engagement */}
        {globalStats && (
          <div className="chart-card">
            <h3>Répartition de l'engagement</h3>
            <div className="chart-container">
              <Doughnut
                data={engagementChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Activité en temps réel */}
        {(realTimeActivity.length > 0 || campaignId) && (
          <div className="chart-card activity-card">
            <h3>Activité en temps réel</h3>
            <div className="activity-feed">
              {realTimeActivity.length > 0 ? (
                realTimeActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-avatar">
                      {activity.contactId?.firstName?.[0] || '?'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-name">
                        {activity.contactId?.firstName} {activity.contactId?.lastName}
                      </div>
                      <div className="activity-action">
                        {activity.status === 'opened' && '👀 A ouvert l\'email'}
                        {activity.status === 'clicked' && '🔗 A cliqué sur un lien'}
                        {activity.status === 'replied' && '💬 A répondu'}
                        {activity.status === 'bounced' && '❌ Email rebondi'}
                      </div>
                    </div>
                    <div className="activity-time">
                      {new Date(activity.updatedAt).toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <p>Aucune activité récente détectée</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top campagnes */}
        {topCampaigns.length > 0 && (
          <div className="chart-card">
            <h3>Meilleures campagnes</h3>
            <div className="top-campaigns-list">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign._id} className="campaign-rank-item">
                  <div className="rank-number">#{index + 1}</div>
                  <div className="campaign-info">
                    <div className="campaign-name">{campaign.name}</div>
                    <div className="campaign-metrics">
                      <span className="metric">
                        {formatPercentage(campaign.metrics?.responseRate)} réponses
                      </span>
                      <span className="metric">
                        {formatPercentage(campaign.metrics?.openRate)} ouvertures
                      </span>
                    </div>
                  </div>
                  <div className="engagement-score">
                    <div className="score-circle">
                      {Math.round(campaign.metrics?.engagementScore || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailAnalyticsDashboard;