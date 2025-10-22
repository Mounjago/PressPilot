import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  EnvelopeIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Import des composants
import Navbar from '../components/Navbar';
import MetricsCard from '../components/analytics/MetricsCard';
import PerformanceChart from '../components/analytics/PerformanceChart';
import HeatmapView from '../components/analytics/HeatmapView';
import InsightsPanel from '../components/analytics/InsightsPanel';

// Services
import { analyticsApi } from '../services/analyticsApi';

const CampaignAnalytics = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch campaign analytics data
  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getCampaignAnalytics(campaignId);

      if (response.success) {
        setCampaignData(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur campaign analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  // Helper functions
  const formatMetricValue = (value, type = 'number') => {
    if (value === null || value === undefined) return '0';

    switch (type) {
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'time':
        return `${Math.round(Number(value))}min`;
      default:
        return Number(value).toLocaleString('fr-FR');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return DevicePhoneMobileIcon;
      case 'tablet':
        return DeviceTabletIcon;
      case 'desktop':
        return ComputerDesktopIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600">Chargement de l'analyse...</p>
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
              onClick={fetchCampaignData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { campaign, trackingData, hourlyMetrics, clickAnalysis, deviceAnalysis, insights, roi } = campaignData || {};

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
                Analyse de campagne
              </h1>
              <div className="flex items-center text-gray-600">
                <span className="font-medium mr-2">{campaign?.name}</span>
                <span className="mx-2">•</span>
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>{new Date(campaign?.sentAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ShareIcon className="w-4 h-4 mr-2" />
                Partager
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Exporter
              </button>
            </div>
          </div>

          {/* Campaign info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sujet</h3>
                <p className="text-gray-900">{campaign?.subject}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Artiste</h3>
                <p className="text-gray-900">{campaign?.artist?.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Projet</h3>
                <p className="text-gray-900">{campaign?.project?.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Statut</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  campaign?.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {campaign?.status === 'sent' ? 'Envoyée' : campaign?.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Emails envoyés"
            value={formatMetricValue(campaign?.metrics?.totalSent)}
            icon={EnvelopeIcon}
            color="blue"
            description={`Ciblage: ${trackingData?.length || 0} journalistes`}
          />

          <MetricsCard
            title="Taux d'ouverture"
            value={formatMetricValue(campaign?.metrics?.openRate, 'percentage')}
            icon={EyeIcon}
            color="green"
            description={`${formatMetricValue(campaign?.metrics?.totalOpened)} ouvertures`}
          />

          <MetricsCard
            title="Taux de clic"
            value={formatMetricValue(campaign?.metrics?.clickRate, 'percentage')}
            icon={CursorArrowRaysIcon}
            color="purple"
            description={`${formatMetricValue(campaign?.metrics?.totalClicked)} clics`}
          />

          <MetricsCard
            title="Taux de réponse"
            value={formatMetricValue(campaign?.metrics?.responseRate, 'percentage')}
            icon={ChatBubbleLeftRightIcon}
            color="orange"
            description={`${formatMetricValue(campaign?.metrics?.totalReplied)} réponses`}
          />
        </div>

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Vue d\'ensemble', icon: SparklesIcon },
                { id: 'timing', name: 'Analyse temporelle', icon: ClockIcon },
                { id: 'engagement', name: 'Engagement', icon: UserGroupIcon },
                { id: 'devices', name: 'Appareils', icon: DevicePhoneMobileIcon }
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Graphique de performance */}
              <div className="lg:col-span-2">
                <PerformanceChart
                  title="Performance dans le temps"
                  data={hourlyMetrics}
                  metrics={['openRate', 'clickRate', 'responseRate']}
                  height={300}
                />
              </div>

              {/* Insights */}
              <div>
                <InsightsPanel
                  metrics={campaign?.metrics}
                  insights={insights}
                />
              </div>
            </motion.div>
          )}

          {selectedTab === 'timing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Heatmap des heures d'envoi */}
              <HeatmapView
                title="Performance par heure d'envoi"
                data={hourlyMetrics}
                xAxisKey="hour"
                yAxisKey="openRate"
                colorScale={['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626']}
              />

              {/* Métriques temporelles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Temps de réaction
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Temps d'ouverture moyen</span>
                        <span className="font-medium">
                          {formatMetricValue(campaign?.metrics?.averageTimeToOpen, 'time')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Temps de clic moyen</span>
                        <span className="font-medium">
                          {formatMetricValue(campaign?.metrics?.averageTimeToClick, 'time')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Temps de réponse moyen</span>
                        <span className="font-medium">
                          {formatMetricValue(campaign?.metrics?.averageTimeToReply / 60, 'time')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Meilleures heures
                  </h3>
                  <div className="space-y-3">
                    {hourlyMetrics?.slice(0, 3).map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{metric.hour}h</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {formatMetricValue(metric.responseRate, 'percentage')}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, metric.responseRate * 10)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribution temporelle
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ouvertures rapides (&lt;1h)</span>
                      <span className="font-medium">24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ouvertures moyennes (1-6h)</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ouvertures tardives (&gt;6h)</span>
                      <span className="font-medium">31%</span>
                    </div>
                  </div>
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
              {/* Analyse des clics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Analyse des clics par lien
                </h3>
                <div className="space-y-4">
                  {clickAnalysis?.map((link, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-md">
                          {link.url}
                        </span>
                        <span className="text-sm text-gray-500">
                          {link.clicks} clics
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(link.clicks / Math.max(...clickAnalysis.map(l => l.clicks))) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {link.uniqueClickers} utilisateurs uniques
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liste des interactions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Journalistes les plus engagés
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Journaliste
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Média
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ouverture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clics
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Réponse
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trackingData?.slice(0, 10).map((tracking, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tracking.contactId?.firstName} {tracking.contactId?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {tracking.contactId?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tracking.contactId?.media}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tracking.openedAt ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ouvert
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Non ouvert
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tracking.totalClicks || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tracking.repliedAt ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Répondu
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'devices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Statistiques par appareil */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(deviceAnalysis || {}).map(([deviceType, stats]) => {
                  const DeviceIcon = getDeviceIcon(deviceType);
                  return (
                    <div key={deviceType} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {deviceType === 'mobile' ? 'Mobile' :
                           deviceType === 'tablet' ? 'Tablette' :
                           deviceType === 'desktop' ? 'Ordinateur' : deviceType}
                        </h3>
                        <DeviceIcon className="w-6 h-6 text-gray-500" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Ouvertures</span>
                            <span className="font-medium">{stats.opened || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (stats.openRate || 0))}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatMetricValue(stats.openRate, 'percentage')} taux d'ouverture
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Clics</span>
                            <span className="font-medium">{stats.clicked || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (stats.clickRate || 0))}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatMetricValue(stats.clickRate, 'percentage')} taux de clic
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Part du trafic</span>
                            <span className="font-medium">
                              {formatMetricValue((stats.sent / campaign?.metrics?.totalSent) * 100, 'percentage')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommandations par appareil */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Recommandations d'optimisation
                </h3>

                <div className="space-y-4">
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Mobile (priorité haute)</h4>
                    <p className="text-sm text-blue-700">
                      Les journalistes consultent majoritairement leurs emails sur mobile.
                      Optimisez vos emails pour l'affichage mobile avec des textes courts et des boutons tactiles.
                    </p>
                  </div>

                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">Desktop (engagement élevé)</h4>
                    <p className="text-sm text-green-700">
                      Les ouvertures sur desktop montrent un meilleur taux d'engagement.
                      Profitez de l'espace plus large pour du contenu riche et des call-to-actions visibles.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ROI Analysis */}
        {roi && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Analyse ROI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {roi.roi > 0 ? '+' : ''}{roi.roi.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">ROI global</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {roi.actualCostPerReply.toFixed(0)}€
                </div>
                <div className="text-sm text-gray-600">Coût par réponse</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {roi.totalReplies}
                </div>
                <div className="text-sm text-gray-600">Réponses obtenues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {roi.totalInvestment.toFixed(0)}€
                </div>
                <div className="text-sm text-gray-600">Investissement total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignAnalytics;