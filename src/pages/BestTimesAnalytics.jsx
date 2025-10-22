import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CalendarDaysIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  EnvelopeIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Import des composants
import Navbar from '../components/Navbar';
import HeatmapView from '../components/analytics/HeatmapView';
import TimeRangeSelector from '../components/analytics/TimeRangeSelector';
import MetricsCard from '../components/analytics/MetricsCard';

// Services
import { analyticsApi } from '../services/analyticsApi';

const BestTimesAnalytics = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedFilters, setSelectedFilters] = useState({
    contactId: null,
    mediaType: null
  });

  // Fetch timing analytics data
  const fetchTimingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period: selectedTimeRange,
        ...selectedFilters
      };

      const response = await analyticsApi.getBestTimesRecommendations(params);

      if (response.success) {
        setTimingData(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur best times analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTimingData();
  }, [selectedTimeRange, selectedFilters]);

  // Helper functions
  const formatTime = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getDayName = (dayIndex) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayIndex] || 'Inconnu';
  };

  const getTimeOfDayLabel = (hour) => {
    if (hour >= 6 && hour < 12) return 'Matinée';
    if (hour >= 12 && hour < 18) return 'Après-midi';
    if (hour >= 18 && hour < 22) return 'Soirée';
    return 'Nuit';
  };

  // Handlers
  const handleTimeRangeChange = (newRange) => {
    setSelectedTimeRange(newRange);
  };

  const handleFiltersChange = (newFilters) => {
    setSelectedFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600">Chargement des analyses de timing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl">❌</div>
            <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchTimingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { bestTimes, hourlyHeatmap, hourlyStats, dailyStats, aiRecommendations } = timingData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ⏰ Meilleurs Créneaux d'Envoi
              </h1>
              <p className="text-gray-600">
                Optimisez vos envois avec l'intelligence artificielle et l'analyse des données comportementales
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <TimeRangeSelector
                value={selectedTimeRange}
                onChange={handleTimeRangeChange}
              />

              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Filtres
              </button>
            </div>
          </div>
        </div>

        {/* Métriques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Meilleur créneau global"
            value={bestTimes?.length > 0 ? formatTime(bestTimes[0].hour) : 'N/A'}
            icon={ClockIcon}
            color="blue"
            description={bestTimes?.length > 0 ? getDayName(bestTimes[0].dayOfWeek - 1) : 'Données insuffisantes'}
          />

          <MetricsCard
            title="Taux d'ouverture optimal"
            value={bestTimes?.length > 0 ? `${bestTimes[0].openRate?.toFixed(1)}%` : '0%'}
            icon={ArrowTrendingUpIcon}
            color="green"
            description="Au meilleur créneau"
          />

          <MetricsCard
            title="Emails analysés"
            value={timingData?.totalAnalyzedEmails?.toLocaleString('fr-FR') || '0'}
            icon={EnvelopeIcon}
            color="purple"
            description={`Sur ${selectedTimeRange.replace('d', ' jours')}`}
          />

          <MetricsCard
            title="Créneaux identifiés"
            value={bestTimes?.length || 0}
            icon={CalendarDaysIcon}
            color="orange"
            description="Avec données suffisantes"
          />
        </div>

        {/* Heatmap principale */}
        <div className="mb-8">
          <HeatmapView
            title="Heatmap des performances par créneau"
            data={bestTimes || []}
            xAxisKey="hour"
            yAxisKey="dayOfWeek"
            valueKey="openRate"
            height={400}
            colorScale={['#FEF3F2', '#FEE4E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626']}
          />
        </div>

        {/* Analyses détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top créneaux */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-green-600" />
              Top 10 des créneaux
            </h3>

            <div className="space-y-4">
              {bestTimes?.slice(0, 10).map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getDayName(slot.dayOfWeek - 1)} à {formatTime(slot.hour)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTimeOfDayLabel(slot.hour)} • {slot.sampleSize} emails
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {slot.openRate?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {slot.responseRate?.toFixed(1)}% réponses
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Statistiques par période */}
          <div className="space-y-6">
            {/* Analyse par heure */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance par heure
              </h3>

              <div className="space-y-3">
                {hourlyStats?.map((stat, hour) => {
                  const percentage = stat.openRate || 0;
                  return (
                    <div key={hour} className="flex items-center">
                      <div className="w-12 text-sm text-gray-600 font-medium">
                        {formatTime(hour)}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, percentage * 2)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-900 font-medium text-right">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                }).slice(8, 20) /* Afficher seulement 8h-19h */}
              </div>
            </div>

            {/* Analyse par jour */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance par jour
              </h3>

              <div className="space-y-3">
                {dailyStats?.map((stat, dayIndex) => {
                  const percentage = stat.openRate || 0;
                  return (
                    <div key={dayIndex} className="flex items-center">
                      <div className="w-16 text-sm text-gray-600 font-medium">
                        {getDayName(dayIndex)}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, percentage * 2)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-900 font-medium text-right">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations IA */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />
            Recommandations IA Personnalisées
          </h3>

          {aiRecommendations?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiRecommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-lg border-2 ${
                    recommendation.type === 'primary'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className={`font-semibold ${
                      recommendation.type === 'primary' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {recommendation.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recommendation.confidence >= 80
                          ? 'bg-green-100 text-green-800'
                          : recommendation.confidence >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {recommendation.confidence}% confiance
                      </span>
                      {recommendation.impact === 'high' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Impact élevé
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${
                    recommendation.type === 'primary' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {recommendation.description}
                  </p>

                  <div className="flex items-center space-x-2">
                    <LightBulbIcon className={`w-4 h-4 ${
                      recommendation.type === 'primary' ? 'text-blue-600' : 'text-yellow-500'
                    }`} />
                    <span className="text-xs text-gray-600">
                      Recommandation basée sur {timingData?.totalAnalyzedEmails || 0} interactions
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Recommandations en cours de génération
              </h4>
              <p className="text-gray-500">
                Les recommandations IA apparaîtront ici une fois que nous aurons suffisamment de données.
              </p>
            </div>
          )}
        </div>

        {/* Conseils et bonnes pratiques */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
            Conseils pour optimiser vos envois
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🌅 Matinée (8h-12h)</h4>
              <p className="text-sm text-gray-600">
                Idéal pour les annonces importantes et les communiqués de presse.
                Les journalistes consultent leurs emails en préparant leur journée.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🌞 Après-midi (14h-17h)</h4>
              <p className="text-sm text-gray-600">
                Parfait pour les suivis et les informations complémentaires.
                Taux d'engagement élevé après la pause déjeuner.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📅 Mardi-Jeudi</h4>
              <p className="text-sm text-gray-600">
                Les jours optimaux de la semaine. Évitez les lundis et vendredis
                pour maximiser l'attention des journalistes.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">⚡ Test A/B Timing</h4>
              <p className="text-sm text-gray-600">
                Testez différents créneaux pour vos campagnes importantes.
                Utilisez nos données pour affiner votre stratégie.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🎯 Personnalisation</h4>
              <p className="text-sm text-gray-600">
                Adaptez vos horaires selon le type de média et la zone géographique.
                Consultez les profils individuels pour plus de précision.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📊 Suivi continu</h4>
              <p className="text-sm text-gray-600">
                Surveillez vos métriques régulièrement. Les comportements évoluent
                et nos recommandations s'adaptent en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestTimesAnalytics;