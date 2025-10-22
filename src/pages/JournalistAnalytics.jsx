import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  LightBulbIcon,
  CalendarIcon,
  PhoneIcon,
  LinkIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

// Import des composants
import Navbar from '../components/Navbar';
import MetricsCard from '../components/analytics/MetricsCard';
import PerformanceChart from '../components/analytics/PerformanceChart';
import HeatmapView from '../components/analytics/HeatmapView';

// Services
import { analyticsApi } from '../services/analyticsApi';

const JournalistAnalytics = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [journalistData, setJournalistData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch journalist analytics data
  const fetchJournalistData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getJournalistAnalytics(contactId);

      if (response.success) {
        setJournalistData(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur journalist analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (contactId) {
      fetchJournalistData();
    }
  }, [contactId]);

  // Helper functions
  const formatMetricValue = (value, type = 'number') => {
    if (value === null || value === undefined) return '0';

    switch (type) {
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'score':
        return `${Math.round(Number(value))}/100`;
      case 'time':
        return `${Math.round(Number(value))}h`;
      case 'days':
        return `${Math.round(Number(value))} jours`;
      default:
        return Number(value).toLocaleString('fr-FR');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600">Chargement du profil...</p>
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
              onClick={fetchJournalistData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { profile, engagementHistory, bestTimes, similarJournalists, predictions, recommendations } = journalistData || {};
  const contact = profile?.contactId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/analytics')}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Profil Journaliste
              </h1>
              <div className="flex items-center text-gray-600">
                <UserIcon className="w-4 h-4 mr-1" />
                <span className="font-medium mr-2">
                  {contact?.firstName} {contact?.lastName}
                </span>
                <span className="mx-2">•</span>
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                <span>{contact?.media}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <PhoneIcon className="w-4 h-4 mr-2" />
                Contacter
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ShareIcon className="w-4 h-4 mr-2" />
                Partager
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {contact?.firstName} {contact?.lastName}
                  </h3>
                  <p className="text-gray-600">{contact?.position}</p>
                  <div className="flex items-center mt-1">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">{contact?.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(profile?.affinityScore)}`}>
                  {profile?.affinityScore?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-gray-600">Score d'affinité</div>
                <div className={`mt-1 px-2 py-1 rounded-full text-xs ${getScoreBgColor(profile?.affinityScore)} ${getScoreColor(profile?.affinityScore)}`}>
                  {profile?.affinityScore >= 70 ? 'Excellent' :
                   profile?.affinityScore >= 40 ? 'Correct' : 'Faible'}
                </div>
              </div>

              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(profile?.influenceScore)}`}>
                  {profile?.influenceScore?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-gray-600">Score d'influence</div>
                <div className="text-xs text-gray-500 mt-1">
                  {profile?.influenceMetrics?.estimatedReach
                    ? `${profile.influenceMetrics.estimatedReach.toLocaleString()} portée`
                    : 'Portée inconnue'
                  }
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {profile?.engagementHistory?.totalEmailsSent || 0}
                </div>
                <div className="text-sm text-gray-600">Interactions totales</div>
                <div className="text-xs text-gray-500 mt-1">
                  {profile?.relationshipDuration
                    ? `Depuis ${Math.round(profile.relationshipDuration)} jours`
                    : 'Nouvelle relation'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques d'engagement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Taux d'ouverture"
            value={formatMetricValue(profile?.engagementHistory?.averageOpenRate, 'percentage')}
            icon={EyeIcon}
            color="blue"
            description={`${profile?.engagementHistory?.totalEmailsOpened || 0} ouvertures`}
          />

          <MetricsCard
            title="Taux de clic"
            value={formatMetricValue(profile?.engagementHistory?.averageClickRate, 'percentage')}
            icon={CursorArrowRaysIcon}
            color="green"
            description={`${profile?.engagementHistory?.totalEmailsClicked || 0} clics`}
          />

          <MetricsCard
            title="Taux de réponse"
            value={formatMetricValue(profile?.engagementHistory?.averageResponseRate, 'percentage')}
            icon={ChatBubbleLeftRightIcon}
            color="purple"
            description={`${profile?.engagementHistory?.totalEmailsReplied || 0} réponses`}
          />

          <MetricsCard
            title="Temps de réponse moyen"
            value={formatMetricValue(profile?.responsePatterns?.averageResponseTime, 'time')}
            icon={ClockIcon}
            color="orange"
            description="Rapidité de réaction"
          />
        </div>

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Vue d\'ensemble', icon: UserIcon },
                { id: 'engagement', name: 'Historique d\'engagement', icon: ArrowTrendingUpIcon },
                { id: 'timing', name: 'Meilleurs créneaux', icon: ClockIcon },
                { id: 'predictions', name: 'Prédictions IA', icon: LightBulbIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu par onglet */}
        <div className="space-y-8">
          {selectedTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Scores et métriques détaillées */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Scores détaillés
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score d'affinité</span>
                        <span className={`font-medium ${getScoreColor(profile?.affinityScore)}`}>
                          {formatMetricValue(profile?.affinityScore, 'score')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, profile?.affinityScore || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score d'influence</span>
                        <span className={`font-medium ${getScoreColor(profile?.influenceScore)}`}>
                          {formatMetricValue(profile?.influenceScore, 'score')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, profile?.influenceScore || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score de fiabilité</span>
                        <span className={`font-medium ${getScoreColor(profile?.reliabilityScore)}`}>
                          {formatMetricValue(profile?.reliabilityScore, 'score')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, profile?.reliabilityScore || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score global</span>
                        <span className={`font-medium ${getScoreColor(profile?.globalScore)}`}>
                          {formatMetricValue(profile?.globalScore, 'score')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, profile?.globalScore || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sujets d'intérêt */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sujets d'intérêt
                  </h3>

                  {profile?.topicPreferences?.length > 0 ? (
                    <div className="space-y-3">
                      {profile.topicPreferences.slice(0, 5).map((topic, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900">{topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{topic.frequency}x</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (topic.engagementScore / 100) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun sujet d'intérêt identifié pour le moment</p>
                  )}
                </div>
              </div>

              {/* Journalistes similaires et recommandations */}
              <div className="space-y-6">
                {/* Journalistes similaires */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Journalistes similaires
                  </h3>

                  {similarJournalists?.length > 0 ? (
                    <div className="space-y-3">
                      {similarJournalists.map((similar, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {similar.contactId?.firstName} {similar.contactId?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{similar.contactId?.media}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatMetricValue(similar.globalScore, 'score')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun journaliste similaire trouvé</p>
                  )}
                </div>

                {/* Recommandations */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recommandations
                  </h3>

                  {recommendations?.recommendations?.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.recommendations.map((rec, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{rec.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

                          {rec.actions && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Actions:</h5>
                              <ul className="space-y-1">
                                {rec.actions.map((action, actionIndex) => (
                                  <li key={actionIndex} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rec.expectedImprovement && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className="text-xs text-green-600 font-medium">
                                Impact estimé: {rec.expectedImprovement}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune recommandation disponible</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'engagement' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Graphique d'engagement dans le temps */}
              <PerformanceChart
                title="Historique d'engagement"
                data={engagementHistory?.map(h => ({
                  date: h.sentAt,
                  openRate: h.openedAt ? 100 : 0,
                  clickRate: h.clickedAt ? 100 : 0,
                  replied: h.repliedAt ? 100 : 0,
                  engagementScore: h.engagementScore
                })) || []}
                metrics={['engagementScore']}
                height={300}
              />

              {/* Détails des interactions récentes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Interactions récentes
                </h3>

                {engagementHistory?.length > 0 ? (
                  <div className="space-y-4">
                    {engagementHistory.slice(0, 10).map((interaction, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(interaction.sentAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {interaction.openedAt && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Ouvert
                              </span>
                            )}
                            {interaction.clickedAt && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Cliqué
                              </span>
                            )}
                            {interaction.repliedAt && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Répondu
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-900 mb-2">
                          <strong>Campagne:</strong> {interaction.campaignId?.name}
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Sujet:</strong> {interaction.campaignId?.subject}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            Score d'engagement: {interaction.engagementScore || 0}
                          </span>

                          {interaction.repliedAt && (
                            <span className="text-xs text-green-600">
                              Réponse en {Math.round((new Date(interaction.repliedAt) - new Date(interaction.sentAt)) / (1000 * 60 * 60))}h
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune interaction récente</p>
                )}
              </div>
            </motion.div>
          )}

          {selectedTab === 'timing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Heatmap des meilleurs moments */}
              <HeatmapView
                title="Meilleurs créneaux pour contacter ce journaliste"
                data={bestTimes || []}
                xAxisKey="hour"
                yAxisKey="dayOfWeek"
                valueKey="openRate"
              />

              {/* Recommandations de timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Créneau optimal recommandé
                  </h3>

                  {profile?.getBestContactTime ? (
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {profile.getBestContactTime().hour}h
                      </div>
                      <div className="text-lg text-blue-800 mb-2">
                        {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][profile.getBestContactTime().dayOfWeek - 1]}
                      </div>
                      <div className="text-sm text-blue-600">
                        Confiance: {Math.round(profile.getBestContactTime().confidence)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Données insuffisantes pour recommander un créneau optimal</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Patterns de réponse
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Réponses rapides (&lt;1h)</span>
                        <span className="font-medium">24%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Réponses moyennes (1-6h)</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Réponses tardives (&gt;6h)</span>
                        <span className="font-medium">31%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '31%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'predictions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Prédictions d'engagement */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Prédictions d'engagement IA
                </h3>

                {predictions ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {predictions.predictions?.openProbability || 0}%
                      </div>
                      <div className="text-sm text-blue-800">Probabilité d'ouverture</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {predictions.predictions?.clickProbability || 0}%
                      </div>
                      <div className="text-sm text-green-800">Probabilité de clic</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {predictions.predictions?.replyProbability || 0}%
                      </div>
                      <div className="text-sm text-purple-800">Probabilité de réponse</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Prédictions non disponibles</p>
                )}

                {predictions?.confidence && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confiance du modèle</span>
                      <span className="font-medium">{Math.round(predictions.confidence)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${predictions.confidence}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Facteurs d'influence */}
              {predictions?.factors && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Facteurs d'influence
                  </h3>

                  <div className="space-y-3">
                    {predictions.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">{factor}</span>
                        <LightBulbIcon className="w-4 h-4 text-yellow-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risques identifiés */}
              {predictions?.risks && predictions.risks.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Risques identifiés
                  </h3>

                  <div className="space-y-4">
                    {predictions.risks.map((risk, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-red-900">{risk.type}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            risk.severity === 'high' ? 'bg-red-200 text-red-800' :
                            risk.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {risk.severity === 'high' ? 'Élevé' : risk.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </span>
                        </div>
                        <p className="text-sm text-red-700 mb-3">{risk.description}</p>
                        <div className="text-sm text-red-600">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalistAnalytics;