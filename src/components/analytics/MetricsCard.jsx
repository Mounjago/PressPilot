import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const MetricsCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  description = '',
  loading = false,
  tooltip = '',
  onClick = null,
  className = ''
}) => {
  // Color mapping
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      trend: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      trend: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      trend: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      trend: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      trend: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      trend: 'text-gray-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Change indicator
  const getChangeIndicator = () => {
    if (change === null || change === undefined || change === 0) {
      return {
        icon: MinusIcon,
        color: 'text-gray-400',
        text: 'Aucun changement'
      };
    }

    if (change > 0) {
      return {
        icon: ArrowTrendingUpIcon,
        color: 'text-green-500',
        text: `+${Math.abs(change).toFixed(1)}%`
      };
    }

    return {
      icon: ArrowTrendingDownIcon,
      color: 'text-red-500',
      text: `-${Math.abs(change).toFixed(1)}%`
    };
  };

  const changeIndicator = getChangeIndicator();
  const ChangeIcon = changeIndicator.icon;

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: {
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { delay: 0.3, duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? "hover" : undefined}
      className={`
        relative bg-white rounded-xl shadow-lg p-6 border border-gray-100
        ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute top-4 right-4">
          <div className="group relative">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg -right-0 top-full">
              {tooltip}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </h3>
          </div>

          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
          </div>

          {description && (
            <p className="text-xs text-gray-500 mb-2">
              {description}
            </p>
          )}

          {/* Change indicator */}
          <div className="flex items-center text-sm">
            <ChangeIcon className={`w-4 h-4 mr-1 ${changeIndicator.color}`} />
            <span className={changeIndicator.color}>
              {changeIndicator.text}
            </span>
            <span className="text-gray-500 ml-1">vs période précédente</span>
          </div>
        </div>

        {/* Icon */}
        <motion.div
          variants={iconVariants}
          className={`p-3 rounded-full ${colors.bg}`}
        >
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </motion.div>
      </div>

      {/* Sparkline placeholder */}
      {onClick && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="h-8 flex items-end space-x-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 bg-gradient-to-t from-${color}-200 to-${color}-100 rounded-sm`}
                style={{
                  height: `${Math.random() * 100}%`,
                  minHeight: '4px'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hover effect */}
      {onClick && (
        <div className="absolute inset-0 rounded-xl border-2 border-transparent hover:border-blue-200 transition-colors" />
      )}
    </motion.div>
  );
};

// Composant pour les métriques avec graphique intégré
export const MetricsCardWithChart = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  chartData = [],
  chartKey = 'value',
  ...props
}) => {
  const colors = {
    blue: 'rgb(59, 130, 246)',
    green: 'rgb(34, 197, 94)',
    purple: 'rgb(147, 51, 234)',
    orange: 'rgb(249, 115, 22)',
    red: 'rgb(239, 68, 68)',
    gray: 'rgb(107, 114, 128)'
  };

  return (
    <MetricsCard
      {...props}
      title={title}
      value={value}
      change={change}
      icon={Icon}
      color={color}
      onClick={props.onClick}
    >
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="h-8 flex items-end space-x-1">
            {chartData.slice(-12).map((data, i) => {
              const maxValue = Math.max(...chartData.map(d => d[chartKey] || 0));
              const height = maxValue > 0 ? ((data[chartKey] || 0) / maxValue) * 100 : 0;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-300 hover:opacity-75"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: colors[color] || colors.blue
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </MetricsCard>
  );
};

// Composant pour afficher une grille de métriques
export const MetricsGrid = ({ metrics, loading = false }) => {
  const metricConfigs = [
    {
      key: 'totalSent',
      title: 'Emails envoyés',
      icon: 'envelope',
      color: 'blue',
      format: 'number'
    },
    {
      key: 'openRate',
      title: 'Taux d\'ouverture',
      icon: 'eye',
      color: 'green',
      format: 'percentage'
    },
    {
      key: 'clickRate',
      title: 'Taux de clic',
      icon: 'cursor',
      color: 'purple',
      format: 'percentage'
    },
    {
      key: 'responseRate',
      title: 'Taux de réponse',
      icon: 'chat',
      color: 'orange',
      format: 'percentage'
    }
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '0';

    switch (format) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricConfigs.map((config) => (
        <MetricsCard
          key={config.key}
          title={config.title}
          value={formatValue(metrics?.[config.key], config.format)}
          change={metrics?.changes?.[config.key]?.percentage}
          icon={config.icon}
          color={config.color}
          loading={loading}
          description={metrics?.descriptions?.[config.key]}
        />
      ))}
    </div>
  );
};

export default MetricsCard;