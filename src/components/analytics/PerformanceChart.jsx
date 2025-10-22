import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from 'recharts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const PerformanceChart = ({
  title = "Performance Analytics",
  data = [],
  metrics = ['openRate', 'clickRate', 'responseRate'],
  type = 'line', // 'line', 'area', 'bar', 'composed'
  timeRange = '30d',
  height = 400,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
  className = ''
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState(metrics);
  const [chartType, setChartType] = useState(type);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Configuration des métriques
  const metricConfigs = {
    openRate: {
      name: 'Taux d\'ouverture',
      unit: '%',
      color: '#3B82F6',
      yAxisId: 'percentage'
    },
    clickRate: {
      name: 'Taux de clic',
      unit: '%',
      color: '#10B981',
      yAxisId: 'percentage'
    },
    responseRate: {
      name: 'Taux de réponse',
      unit: '%',
      color: '#8B5CF6',
      yAxisId: 'percentage'
    },
    engagementScore: {
      name: 'Score d\'engagement',
      unit: '',
      color: '#F59E0B',
      yAxisId: 'score'
    },
    totalSent: {
      name: 'Emails envoyés',
      unit: '',
      color: '#6B7280',
      yAxisId: 'count'
    },
    totalOpened: {
      name: 'Ouvertures',
      unit: '',
      color: '#3B82F6',
      yAxisId: 'count'
    },
    totalClicked: {
      name: 'Clics',
      unit: '',
      color: '#10B981',
      yAxisId: 'count'
    },
    totalReplied: {
      name: 'Réponses',
      unit: '',
      color: '#8B5CF6',
      yAxisId: 'count'
    }
  };

  // Formatage des données
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const formattedItem = { ...item };

      // Formatage de la date
      if (item.date || item._id) {
        const date = new Date(item.date || item._id);
        formattedItem.formattedDate = date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        });
        formattedItem.fullDate = date.toLocaleDateString('fr-FR');
      }

      // Calcul des taux si nécessaire
      if (item.totalSent > 0) {
        formattedItem.openRate = ((item.totalOpened || 0) / item.totalSent) * 100;
        formattedItem.responseRate = ((item.totalReplied || 0) / item.totalSent) * 100;
      }

      if (item.totalOpened > 0) {
        formattedItem.clickRate = ((item.totalClicked || 0) / item.totalOpened) * 100;
      }

      return formattedItem;
    });
  }, [data]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-4 rounded-lg shadow-lg border border-gray-200"
      >
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            const config = metricConfigs[entry.dataKey];
            return (
              <div key={index} className="flex items-center justify-between min-w-[200px]">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{config?.name || entry.dataKey}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                  {config?.unit}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Formatage de l'axe Y
  const formatYAxis = (value, yAxisId) => {
    if (yAxisId === 'percentage') {
      return `${value.toFixed(0)}%`;
    }
    if (yAxisId === 'count') {
      return value.toLocaleString('fr-FR');
    }
    return value.toFixed(0);
  };

  // Rendu du graphique selon le type
  const renderChart = () => {
    const commonProps = {
      data: formattedData,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const xAxisProps = {
      dataKey: 'formattedDate',
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12, fill: '#6B7280' }
    };

    const yAxisProps = {
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12, fill: '#6B7280' },
      tickFormatter: (value) => formatYAxis(value, 'percentage')
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {selectedMetrics.map((metric, index) => {
              const config = metricConfigs[metric];
              return (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stackId={config?.yAxisId === 'count' ? 'count' : 'percentage'}
                  stroke={config?.color || colors[index]}
                  fill={config?.color || colors[index]}
                  fillOpacity={0.6}
                  strokeWidth={2}
                  name={config?.name || metric}
                />
              );
            })}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {selectedMetrics.map((metric, index) => {
              const config = metricConfigs[metric];
              return (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={config?.color || colors[index]}
                  name={config?.name || metric}
                  radius={[2, 2, 0, 0]}
                />
              );
            })}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis {...xAxisProps} />
            <YAxis yAxisId="percentage" {...yAxisProps} />
            <YAxis
              yAxisId="count"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => formatYAxis(value, 'count')}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {selectedMetrics.map((metric, index) => {
              const config = metricConfigs[metric];
              if (config?.yAxisId === 'count') {
                return (
                  <Bar
                    key={metric}
                    yAxisId="count"
                    dataKey={metric}
                    fill={config.color}
                    name={config.name}
                    fillOpacity={0.8}
                  />
                );
              } else {
                return (
                  <Line
                    key={metric}
                    yAxisId="percentage"
                    type="monotone"
                    dataKey={metric}
                    stroke={config?.color || colors[index]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={config?.name || metric}
                  />
                );
              }
            })}
          </ComposedChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {selectedMetrics.map((metric, index) => {
              const config = metricConfigs[metric];
              return (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={config?.color || colors[index]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name={config?.name || metric}
                />
              );
            })}
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-4">
          {/* Type de graphique */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Graphique linéaire"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'area'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Graphique en aires"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13.2L7.5 9.5L12 12.8L18 7L21 9.4V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V13.2Z" />
              </svg>
            </button>

            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Graphique en barres"
            >
              <ChartBarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Métriques sélectionnées */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(metricConfigs).map((metric) => {
          const config = metricConfigs[metric];
          const isSelected = selectedMetrics.includes(metric);

          return (
            <button
              key={metric}
              onClick={() => {
                if (isSelected) {
                  setSelectedMetrics(prev => prev.filter(m => m !== metric));
                } else {
                  setSelectedMetrics(prev => [...prev, metric]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={isSelected ? { backgroundColor: config.color } : {}}
            >
              {config.name}
            </button>
          );
        })}
      </div>

      {/* Graphique */}
      <div className="relative">
        {formattedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ChartBarIcon className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune donnée disponible</p>
            <p className="text-sm">Les données apparaîtront ici une fois disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats rapides */}
      {formattedData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {selectedMetrics.slice(0, 4).map((metric) => {
              const config = metricConfigs[metric];
              const values = formattedData.map(d => d[metric]).filter(v => v !== null && v !== undefined);
              const latest = values[values.length - 1];
              const previous = values[values.length - 2];
              const change = previous ? ((latest - previous) / previous) * 100 : 0;

              return (
                <div key={metric} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-gray-500">{config.name}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {latest?.toFixed(1) || '0'}{config.unit}
                  </p>
                  {change !== 0 && (
                    <p className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PerformanceChart;