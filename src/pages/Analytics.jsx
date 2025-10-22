import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  StarIcon
} from '@heroicons/react/24/outline';

// Import des composants
import Navbar from '../components/Navbar';
import MetricsCard from '../components/analytics/MetricsCard';
import PerformanceChart from '../components/analytics/PerformanceChart';
import TopPerformersTable from '../components/analytics/TopPerformersTable';
import TimeRangeSelector from '../components/analytics/TimeRangeSelector';
import InsightsPanel from '../components/analytics/InsightsPanel';
import ROICalculator from '../components/analytics/ROICalculator';

// Services
import { analyticsApi } from '../services/analyticsApi';

const Analytics = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedFilters, setSelectedFilters] = useState({
    artistId: null,
    projectId: null
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period: selectedTimeRange,
        ...selectedFilters
      };

      const response = await analyticsApi.getDashboardMetrics(params);

      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur dashboard analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange, selectedFilters]);

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

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Helper functions
  const formatMetricValue = (value, type = 'number') => {
    if (value === null || value === undefined) return '0';

    switch (type) {
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'currency':
        return `${Number(value).toLocaleString('fr-FR')}€`;
      case 'time':
        return `${Math.round(Number(value))}min`;
      default:
        return Number(value).toLocaleString('fr-FR');
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-600">Chargement des analytics...</p>
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
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, changes, topCampaigns, topJournalists, temporalData } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Analytics Avancés
              </h1>
              <p className="text-gray-600">
                Analyses détaillées de vos campagnes et performances d'engagement
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <TimeRangeSelector
                value={selectedTimeRange}
                onChange={handleTimeRangeChange}
              />

              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <motion.div
          variants={cardVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricsCard
            title="Taux d'ouverture"
            value={formatMetricValue(metrics?.openRate, 'percentage')}
            change={changes?.openRate?.percentage}
            icon={EyeIcon}
            color="blue"
            description={`${formatMetricValue(metrics?.totalOpened)} / ${formatMetricValue(metrics?.totalSent)} emails`}
          />

          <MetricsCard
            title="Taux de clic"
            value={formatMetricValue(metrics?.clickRate, 'percentage')}
            change={changes?.clickRate?.percentage}
            icon={CursorArrowRaysIcon}
            color="green"
            description={`${formatMetricValue(metrics?.totalClicked)} clics`}
          />

          <MetricsCard
            title="Taux de réponse"
            value={formatMetricValue(metrics?.responseRate, 'percentage')}
            change={changes?.responseRate?.percentage}
            icon={ChatBubbleLeftRightIcon}
            color="purple"
            description={`${formatMetricValue(metrics?.totalReplied)} réponses`}
          />

          <MetricsCard
            title="Score d'engagement"
            value={formatMetricValue(metrics?.engagementScore)}
            change={changes?.engagementScore?.percentage}
            icon={StarIcon}
            color="orange"
            description="Métrique composite"
          />
        </motion.div>

        {/* Métriques secondaires */}
        <motion.div
          variants={cardVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Emails envoyés</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMetricValue(metrics?.totalSent)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {getChangeIcon(changes?.totalSent?.percentage)}
              <span className={`ml-1 ${getChangeColor(changes?.totalSent?.percentage)}`}>
                {changes?.totalSent?.percentage > 0 ? '+' : ''}
                {formatMetricValue(changes?.totalSent?.percentage, 'percentage')} vs période précédente
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Temps de réponse moyen</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMetricValue(metrics?.averageTimeToReply, 'time')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                Médiane: {formatMetricValue(metrics?.medianTimeToReply, 'time')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Journalistes actifs</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMetricValue(topJournalists?.length || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                Score moyen: {formatMetricValue(metrics?.avgJournalistScore)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Graphiques de performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div variants={cardVariants}>
            <PerformanceChart
              title="Évolution des métriques"
              data={temporalData}
              metrics={['openRate', 'clickRate', 'responseRate']}
              timeRange={selectedTimeRange}
            />
          </motion.div>

          <motion.div variants={cardVariants}>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2 text-blue-600" />
                Tunnel de conversion
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emails envoyés</span>
                  <span className="font-semibold">{formatMetricValue(metrics?.totalSent)}</span>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ouvertures</span>
                    <span className="font-semibold text-blue-600">
                      {formatMetricValue(metrics?.totalOpened)} ({formatMetricValue(metrics?.openRate, 'percentage')})
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, metrics?.openRate || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clics</span>
                    <span className="font-semibold text-green-600">
                      {formatMetricValue(metrics?.totalClicked)} ({formatMetricValue(metrics?.clickRate, 'percentage')})
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (metrics?.clickRate || 0) * (metrics?.openRate || 0) / 100)}%` }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Réponses</span>
                    <span className="font-semibold text-purple-600">
                      {formatMetricValue(metrics?.totalReplied)} ({formatMetricValue(metrics?.responseRate, 'percentage')})
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, metrics?.responseRate || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Performers et Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <TopPerformersTable
              campaigns={topCampaigns}
              journalists={topJournalists}
              onViewDetails={(type, id) => {
                // Navigation vers les détails
                if (type === 'campaign') {
                  window.location.href = `/analytics/campaigns/${id}`;
                } else if (type === 'journalist') {
                  window.location.href = `/analytics/journalists/${id}`;
                }
              }}
            />
          </motion.div>

          <motion.div variants={cardVariants}>
            <InsightsPanel
              metrics={metrics}
              changes={changes}
              timeRange={selectedTimeRange}
            />
          </motion.div>
        </div>

        {/* ROI Calculator */}
        <motion.div variants={cardVariants}>
          <ROICalculator
            metrics={metrics}
            onCalculate={(roiData) => {
              console.log('ROI calculé:', roiData);
            }}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={cardVariants} className="mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = '/analytics/campaigns'}
                className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Analyser campagnes
              </button>

              <button
                onClick={() => window.location.href = '/analytics/journalists'}
                className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Profils journalistes
              </button>

              <button
                onClick={() => window.location.href = '/analytics/best-times'}
                className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
              >
                <ClockIcon className="w-5 h-5 mr-2" />
                Meilleurs créneaux
              </button>

              <button
                onClick={() => window.location.href = '/analytics/reports'}
                className="flex items-center justify-center px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                Rapports custom
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;