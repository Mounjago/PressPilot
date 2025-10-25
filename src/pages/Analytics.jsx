import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, TrendingDown, Users, Mail, Phone, Calendar, Target } from 'lucide-react';
import Layout from '../components/Layout';
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
      <Layout title="Analytics">
        <div className="loading-spinner"></div>
      </Layout>
    );
  }

  return (
    <Layout title="ANALYTICS" subtitle="Analysez vos performances et optimisez vos campagnes">
      {/* Sélecteur de période */}
      <div className="time-range-selector">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="form-select w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
              <option value="1y">1 an</option>
            </select>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <Target className="metric-icon w-5 h-5 text-emerald-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Campagnes actives</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.totalCampaigns}</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp size={16} />
              +12% ce mois
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <Users className="metric-icon w-5 h-5 text-blue-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Total contacts</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.totalContacts.toLocaleString()}</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp size={16} />
              +8% ce mois
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <Mail className="metric-icon w-5 h-5 text-purple-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Emails envoyés</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.emailsSent.toLocaleString()}</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp size={16} />
              +15% ce mois
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <Phone className="metric-icon w-5 h-5 text-orange-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Appels effectués</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.phoneCallsMade}</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-red-600">
              <TrendingDown size={16} />
              -3% ce mois
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <BarChart className="metric-icon w-5 h-5 text-green-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Taux de réponse</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.responseRate}%</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp size={16} />
              +2.1% ce mois
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="metric-header flex items-center gap-3 mb-3">
              <Target className="metric-icon w-5 h-5 text-indigo-600" />
              <span className="metric-label text-sm font-medium text-gray-600">Taux de conversion</span>
            </div>
            <div className="metric-value text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{metrics.conversionRate}%</div>
            <div className="metric-change flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp size={16} />
              +1.8% ce mois
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="analytics-charts grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="chart-container bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="chart-title text-lg font-semibold text-gray-900 mb-4">Performance mensuelle</h3>
            <div className="chart-placeholder flex flex-col items-center justify-center py-12 text-center">
              <BarChart size={48} className="chart-icon text-gray-400 mb-4" />
              <p className="font-medium text-gray-700 mb-2">Graphique des performances mensuelles</p>
              <small className="text-gray-500">Emails envoyés, appels effectués et taux de réponse</small>
            </div>
          </div>

          <div className="chart-container bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="chart-title text-lg font-semibold text-gray-900 mb-4">Évolution des contacts</h3>
            <div className="chart-placeholder flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp size={48} className="chart-icon text-gray-400 mb-4" />
              <p className="font-medium text-gray-700 mb-2">Évolution du nombre de contacts</p>
              <small className="text-gray-500">Croissance de votre base de contacts au fil du temps</small>
            </div>
          </div>
        </div>

        {/* Top performers */}
        <div className="analytics-section mb-8">
          <h3 className="section-title text-xl font-semibold text-gray-900 mb-4">Meilleures campagnes</h3>

          {/* Mobile: Card view */}
          <div className="block md:hidden space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">Lancement Album Électro</h4>
                  <p className="text-sm text-gray-500">15 Oct 2024</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Excellent</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-xs text-gray-500">Emails envoyés</span>
                  <p className="font-medium">450</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux ouverture</span>
                  <p className="font-medium text-green-600">65%</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux réponse</span>
                  <p className="font-medium text-green-600">22%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">Promotion Single Jazz</h4>
                  <p className="text-sm text-gray-500">12 Oct 2024</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Bon</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-xs text-gray-500">Emails envoyés</span>
                  <p className="font-medium">320</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux ouverture</span>
                  <p className="font-medium text-green-600">58%</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux réponse</span>
                  <p className="font-medium text-green-600">18%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">Festival d'été</h4>
                  <p className="text-sm text-gray-500">8 Oct 2024</p>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Moyen</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-xs text-gray-500">Emails envoyés</span>
                  <p className="font-medium">680</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux ouverture</span>
                  <p className="font-medium text-yellow-600">45%</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Taux réponse</span>
                  <p className="font-medium text-yellow-600">12%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block table-container bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="analytics-table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Campagne</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Emails envoyés</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Taux d'ouverture</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Taux de réponse</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="campaign-cell">
                        <strong className="text-gray-900">Lancement Album Électro</strong>
                        <span className="campaign-date block text-sm text-gray-500">15 Oct 2024</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">450</td>
                    <td className="py-4 px-6"><span className="rate text-green-600 font-medium">65%</span></td>
                    <td className="py-4 px-6"><span className="rate text-green-600 font-medium">22%</span></td>
                    <td className="py-4 px-6"><span className="performance px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Excellent</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="campaign-cell">
                        <strong className="text-gray-900">Promotion Single Jazz</strong>
                        <span className="campaign-date block text-sm text-gray-500">12 Oct 2024</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">320</td>
                    <td className="py-4 px-6"><span className="rate text-green-600 font-medium">58%</span></td>
                    <td className="py-4 px-6"><span className="rate text-green-600 font-medium">18%</span></td>
                    <td className="py-4 px-6"><span className="performance px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Bon</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="campaign-cell">
                        <strong className="text-gray-900">Festival d'été</strong>
                        <span className="campaign-date block text-sm text-gray-500">8 Oct 2024</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">680</td>
                    <td className="py-4 px-6"><span className="rate text-yellow-600 font-medium">45%</span></td>
                    <td className="py-4 px-6"><span className="rate text-yellow-600 font-medium">12%</span></td>
                    <td className="py-4 px-6"><span className="performance px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Moyen</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Insights et recommandations */}
        <div className="analytics-section">
          <h3 className="section-title text-xl font-semibold text-gray-900 mb-4">Insights et recommandations</h3>
          <div className="insights-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="insight-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="insight-icon flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <div className="insight-content min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Performance en hausse</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Vos campagnes email montrent une amélioration de +15% ce mois. Continuez sur cette lancée !</p>
                </div>
              </div>
            </div>

            <div className="insight-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="insight-icon flex-shrink-0 w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Phone size={24} className="text-yellow-600" />
                </div>
                <div className="insight-content min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Optimiser les appels</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Les appels téléphoniques ont diminué de 3%. Considérez d'augmenter la fréquence des relances.</p>
                </div>
              </div>
            </div>

            <div className="insight-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="insight-icon flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div className="insight-content min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Meilleur moment</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Les mardis et jeudis entre 10h-12h montrent les meilleurs taux de réponse (+25%).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
};

export default Analytics;