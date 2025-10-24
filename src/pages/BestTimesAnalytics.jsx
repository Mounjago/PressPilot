import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Phone, Mail, Target, Users, Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { analyticsApi } from '../api';
import '../styles/Dashboard.css';

const BestTimesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bestTimesData, setBestTimesData] = useState({
    hourly: [],
    daily: []
  });
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBestTimesData();
  }, [selectedPeriod]);

  const fetchBestTimesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await analyticsApi.getBestTimes(selectedPeriod);

      setBestTimesData({
        hourly: data.hourly || [],
        daily: data.daily || []
      });

      setInsights(data.insights || []);

    } catch (error) {
      console.error('Erreur lors du chargement des best times:', error);
      setError('Impossible de charger les données d\'analyse des meilleurs moments');

      // Empty state instead of mock data
      setBestTimesData({
        hourly: [],
        daily: []
      });
      setInsights([]);

    } finally {
      setLoading(false);
    }
  };

  const getBestHours = () => {
    return bestTimesData.hourly
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3);
  };

  const getBestDays = () => {
    return bestTimesData.daily
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content ml-0 md:ml-64 p-4 md:p-6">
          <div className="dashboard-header">
            <h1 className="dashboard-title">MEILLEURS MOMENTS</h1>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-gray-600">Chargement des données...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content ml-0 md:ml-64 p-4 md:p-6">
          <div className="dashboard-header">
            <h1 className="dashboard-title">MEILLEURS MOMENTS</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <button
                    onClick={fetchBestTimesData}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="dashboard-header md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">Meilleurs moments</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content ml-0 md:ml-64 pt-16 md:pt-0 p-4 md:p-6 min-h-screen">
        <div className="dashboard-header mb-6">
          <div className="hidden md:block">
            <h1 className="dashboard-title text-2xl md:text-3xl font-bold text-gray-900 mb-2">MEILLEURS MOMENTS</h1>
            <p className="dashboard-subtitle text-gray-600 mb-4">Identifiez les créneaux optimaux pour vos campagnes</p>
          </div>

          <div className="time-range-selector">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
            </select>
          </div>
        </div>

        {/* Insights principaux */}
        {insights.length > 0 ? (
          <div className="insights-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="insight-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className={`insight-icon flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    insight.type === 'success'
                      ? 'bg-green-50 text-green-600'
                      : insight.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="insight-content min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-600 mb-1">{insight.title}</h4>
                    <div className="metric-value text-lg sm:text-xl font-bold text-gray-900 mb-1">
                      {insight.value}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 leading-tight">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8">
            <div className="text-gray-400 mb-4">
              <TrendingUp size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée d'analyse disponible</h3>
            <p className="text-gray-600 mb-4">
              Commencez à envoyer des campagnes pour voir l'analyse des meilleurs moments.
            </p>
            <button
              onClick={fetchBestTimesData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Actualiser
            </button>
          </div>
        )}

        {/* Analyse par heures */}
        <div className="analytics-section mb-8">
          <h3 className="section-title text-xl font-semibold text-gray-900 mb-4">Performance par heure</h3>
          <div className="chart-container bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            {bestTimesData.hourly.length > 0 ? (
              <div className="best-times-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {bestTimesData.hourly.map((hour, index) => {
                const performanceClass = hour.responseRate > 20 ? 'high-performance' : hour.responseRate > 15 ? 'medium-performance' : 'low-performance';
                const colorClasses = {
                  'high-performance': 'border-green-300 bg-green-50',
                  'medium-performance': 'border-yellow-300 bg-yellow-50',
                  'low-performance': 'border-red-300 bg-red-50'
                };

                return (
                  <div
                    key={index}
                    className={`time-slot p-3 sm:p-4 rounded-lg border-2 text-center transition-all duration-300 hover:shadow-md ${
                      colorClasses[performanceClass]
                    }`}
                  >
                    <div className="time-label font-semibold text-sm sm:text-base text-gray-900 mb-2">{hour.hour}</div>
                    <div className="time-metrics flex justify-center space-x-2 sm:space-x-3 mb-2">
                      <div className="time-metric flex items-center space-x-1">
                        <Mail size={12} className="text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">{hour.emails}</span>
                      </div>
                      <div className="time-metric flex items-center space-x-1">
                        <Phone size={12} className="text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">{hour.calls}</span>
                      </div>
                    </div>
                    <div className={`response-rate font-bold text-sm sm:text-lg ${
                      performanceClass === 'high-performance'
                        ? 'text-green-700'
                        : performanceClass === 'medium-performance'
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}>{hour.responseRate}%</div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune donnée horaire disponible pour cette période</p>
              </div>
            )}
          </div>
        </div>

        {/* Analyse par jours */}
        <div className="analytics-section mb-8">
          <h3 className="section-title text-xl font-semibold text-gray-900 mb-4">Performance par jour</h3>
          <div className="chart-container bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            {bestTimesData.daily.length > 0 ? (
              <div className="daily-performance-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                {bestTimesData.daily.map((day, index) => {
                const performanceClass = day.responseRate > 25 ? 'high-performance' : day.responseRate > 20 ? 'medium-performance' : 'low-performance';
                const colorClasses = {
                  'high-performance': 'border-green-300 bg-green-50',
                  'medium-performance': 'border-yellow-300 bg-yellow-50',
                  'low-performance': 'border-red-300 bg-red-50'
                };

                return (
                  <div
                    key={index}
                    className={`daily-slot p-3 sm:p-4 rounded-lg border-2 text-center transition-all duration-300 hover:shadow-md ${
                      colorClasses[performanceClass]
                    }`}
                  >
                    <div className="day-label font-semibold text-sm sm:text-base text-gray-900 mb-2">{day.day}</div>
                    <div className="daily-metrics flex justify-center space-x-2 sm:space-x-3 mb-2">
                      <div className="daily-metric flex items-center space-x-1">
                        <Mail size={12} className="text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">{day.emails}</span>
                      </div>
                      <div className="daily-metric flex items-center space-x-1">
                        <Phone size={12} className="text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">{day.calls}</span>
                      </div>
                    </div>
                    <div className={`daily-response-rate font-bold text-sm sm:text-lg mb-1 ${
                      performanceClass === 'high-performance'
                        ? 'text-green-700'
                        : performanceClass === 'medium-performance'
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}>{day.responseRate}%</div>
                    <div className={`daily-performance-label text-xs font-medium ${
                      performanceClass === 'high-performance'
                        ? 'text-green-600'
                        : performanceClass === 'medium-performance'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {day.responseRate > 25 ? 'Excellent' : day.responseRate > 20 ? 'Bon' : 'Moyen'}
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune donnée journalière disponible pour cette période</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommandations */}
        <div className="analytics-section">
          <h3 className="section-title text-xl font-semibold text-gray-900 mb-4">Recommandations</h3>
          <div className="recommendations-grid grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="recommendation-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <div className="recommendation-header flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Target size={20} className="text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Créneaux optimaux</h4>
              </div>
              <div className="recommendation-content space-y-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Meilleures heures :</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {getBestHours().map((hour, index) => (
                      <li key={index} className="flex justify-between items-center py-1">
                        <span>{hour.hour}</span>
                        <span className="font-medium text-green-600">{hour.responseRate}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Meilleurs jours :</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {getBestDays().map((day, index) => (
                      <li key={index} className="flex justify-between items-center py-1">
                        <span>{day.day}</span>
                        <span className="font-medium text-green-600">{day.responseRate}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="recommendation-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
              <div className="recommendation-header flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">À éviter</h4>
              </div>
              <div className="recommendation-content space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Heures de pause :</span>
                  <span className="block text-gray-600">12h-13h (taux: 8.9%)</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fin de semaine :</span>
                  <span className="block text-gray-600">Weekend (taux moyen: 10.2%)</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Début de matinée :</span>
                  <span className="block text-gray-600">Avant 9h (performances réduites)</span>
                </div>
              </div>
            </div>

            <div className="recommendation-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
              <div className="recommendation-header flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Stratégies</h4>
              </div>
              <div className="recommendation-content space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Campagnes email :</span>
                  <span className="block text-gray-600">Programmer entre 14h-16h</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Appels de relance :</span>
                  <span className="block text-gray-600">Mardi et jeudi matin</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Campagnes importantes :</span>
                  <span className="block text-gray-600">Éviter les lundis et vendredis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BestTimesAnalytics;