import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, TrendingDown, Users, Mail, Phone, Calendar, Target } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const [metrics, setMetrics] = useState({
    totalCampaigns: 0,
    totalContacts: 0,
    emailsSent: 0,
    phoneCallsMade: 0,
    responseRate: 0,
    conversionRate: 0
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Les données seront chargées depuis l'API analytics
      // const response = await analyticsApi.getMetrics(selectedTimeRange);
      // setMetrics(response.metrics);
      // setChartData(response.chartData);
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Analytics</h1>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">ANALYTICS</h1>
          <p className="dashboard-subtitle">Analysez vos performances et optimisez vos campagnes</p>

          {/* Sélecteur de période */}
          <div className="time-range-selector">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="form-select"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
              <option value="1y">1 an</option>
            </select>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Target className="metric-icon" />
              <span className="metric-label">Campagnes actives</span>
            </div>
            <div className="metric-value">{metrics.totalCampaigns}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +12% ce mois
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Users className="metric-icon" />
              <span className="metric-label">Total contacts</span>
            </div>
            <div className="metric-value">{metrics.totalContacts.toLocaleString()}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +8% ce mois
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Mail className="metric-icon" />
              <span className="metric-label">Emails envoyés</span>
            </div>
            <div className="metric-value">{metrics.emailsSent.toLocaleString()}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +15% ce mois
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Phone className="metric-icon" />
              <span className="metric-label">Appels effectués</span>
            </div>
            <div className="metric-value">{metrics.phoneCallsMade}</div>
            <div className="metric-change negative">
              <TrendingDown size={16} />
              -3% ce mois
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <BarChart className="metric-icon" />
              <span className="metric-label">Taux de réponse</span>
            </div>
            <div className="metric-value">{metrics.responseRate}%</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +2.1% ce mois
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Target className="metric-icon" />
              <span className="metric-label">Taux de conversion</span>
            </div>
            <div className="metric-value">{metrics.conversionRate}%</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +1.8% ce mois
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="analytics-charts">
          <div className="chart-container">
            <h3 className="chart-title">Performance mensuelle</h3>
            <div className="chart-placeholder">
              <BarChart size={64} className="chart-icon" />
              <p>Graphique des performances mensuelles</p>
              <small>Emails envoyés, appels effectués et taux de réponse</small>
            </div>
          </div>

          <div className="chart-container">
            <h3 className="chart-title">Évolution des contacts</h3>
            <div className="chart-placeholder">
              <TrendingUp size={64} className="chart-icon" />
              <p>Évolution du nombre de contacts</p>
              <small>Croissance de votre base de contacts au fil du temps</small>
            </div>
          </div>
        </div>

        {/* Top performers */}
        <div className="analytics-section">
          <h3 className="section-title">Meilleures campagnes</h3>
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Campagne</th>
                  <th>Emails envoyés</th>
                  <th>Taux d'ouverture</th>
                  <th>Taux de réponse</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="campaign-cell">
                      <strong>Lancement Album Électro</strong>
                      <span className="campaign-date">15 Oct 2024</span>
                    </div>
                  </td>
                  <td>450</td>
                  <td><span className="rate positive">65%</span></td>
                  <td><span className="rate positive">22%</span></td>
                  <td><span className="performance excellent">Excellent</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="campaign-cell">
                      <strong>Promotion Single Jazz</strong>
                      <span className="campaign-date">12 Oct 2024</span>
                    </div>
                  </td>
                  <td>320</td>
                  <td><span className="rate positive">58%</span></td>
                  <td><span className="rate positive">18%</span></td>
                  <td><span className="performance good">Bon</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="campaign-cell">
                      <strong>Festival d'été</strong>
                      <span className="campaign-date">8 Oct 2024</span>
                    </div>
                  </td>
                  <td>680</td>
                  <td><span className="rate average">45%</span></td>
                  <td><span className="rate average">12%</span></td>
                  <td><span className="performance average">Moyen</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights et recommandations */}
        <div className="analytics-section">
          <h3 className="section-title">Insights et recommandations</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon positive">
                <TrendingUp size={24} />
              </div>
              <div className="insight-content">
                <h4>Performance en hausse</h4>
                <p>Vos campagnes email montrent une amélioration de +15% ce mois. Continuez sur cette lancée !</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon warning">
                <Phone size={24} />
              </div>
              <div className="insight-content">
                <h4>Optimiser les appels</h4>
                <p>Les appels téléphoniques ont diminué de 3%. Considérez d'augmenter la fréquence des relances.</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon info">
                <Calendar size={24} />
              </div>
              <div className="insight-content">
                <h4>Meilleur moment</h4>
                <p>Les mardis et jeudis entre 10h-12h montrent les meilleurs taux de réponse (+25%).</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;