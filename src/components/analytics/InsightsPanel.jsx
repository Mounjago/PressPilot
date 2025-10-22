import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const InsightsPanel = ({
  metrics = {},
  changes = {},
  timeRange = '30d',
  className = ''
}) => {
  const [selectedInsight, setSelectedInsight] = useState(null);

  // Génération automatique des insights basés sur les métriques
  const insights = useMemo(() => {
    const generatedInsights = [];

    // Insight sur les performances générales
    if (metrics.responseRate > 8) {
      generatedInsights.push({
        id: 'high_response_rate',
        type: 'success',
        priority: 'high',
        title: 'Excellent taux de réponse',
        description: `Votre taux de réponse de ${metrics.responseRate?.toFixed(1)}% est bien au-dessus de la moyenne de l'industrie (3-5%).`,
        icon: CheckCircleIcon,
        actions: [
          'Documentez votre approche actuelle',
          'Partagez vos bonnes pratiques avec l\'équipe',
          'Reproduisez cette stratégie dans vos prochaines campagnes'
        ],
        impact: 'Maintenir cette performance peut augmenter vos résultats de 15-20%'
      });
    } else if (metrics.responseRate < 2) {
      generatedInsights.push({
        id: 'low_response_rate',
        type: 'warning',
        priority: 'high',
        title: 'Taux de réponse à améliorer',
        description: `Votre taux de réponse de ${metrics.responseRate?.toFixed(1)}% est en dessous des standards.`,
        icon: ExclamationTriangleIcon,
        actions: [
          'Personnalisez davantage vos messages',
          'Revoyez le timing de vos envois',
          'Testez différents sujets d\'email',
          'Segmentez mieux votre audience'
        ],
        impact: 'Ces améliorations peuvent doubler votre taux de réponse'
      });
    }

    // Insight sur les tendances
    if (changes.openRate?.percentage > 15) {
      generatedInsights.push({
        id: 'improving_open_rate',
        type: 'success',
        priority: 'medium',
        title: 'Amélioration des ouvertures',
        description: `Votre taux d'ouverture a augmenté de ${changes.openRate.percentage.toFixed(1)}% par rapport à la période précédente.`,
        icon: ArrowTrendingUpIcon,
        actions: [
          'Analysez les sujets qui fonctionnent le mieux',
          'Reproduisez ces patterns dans vos prochains envois',
          'Continuez à tester de nouveaux formats'
        ],
        impact: 'Cette tendance positive peut se traduire par plus d\'engagement'
      });
    } else if (changes.openRate?.percentage < -10) {
      generatedInsights.push({
        id: 'declining_open_rate',
        type: 'warning',
        priority: 'medium',
        title: 'Baisse du taux d\'ouverture',
        description: `Votre taux d'ouverture a diminué de ${Math.abs(changes.openRate.percentage).toFixed(1)}%.`,
        icon: ArrowTrendingDownIcon,
        actions: [
          'Revoyez vos sujets d\'email',
          'Testez différents horaires d\'envoi',
          'Vérifiez la délivrabilité de vos emails',
          'Nettoyez votre liste de contacts'
        ],
        impact: 'Corriger cette tendance peut récupérer 20-30% d\'engagement'
      });
    }

    // Insight sur le timing
    if (metrics.averageTimeToReply > 48) {
      generatedInsights.push({
        id: 'slow_response_time',
        type: 'info',
        priority: 'medium',
        title: 'Temps de réponse long',
        description: `Le temps de réponse moyen est de ${Math.round(metrics.averageTimeToReply)}h. Les journalistes répondent généralement sous 24h.`,
        icon: ClockIcon,
        actions: [
          'Envoyez aux heures de pointe (9h-11h, 14h-16h)',
          'Créez un sentiment d\'urgence approprié',
          'Simplifiez vos messages pour faciliter la réponse',
          'Incluez des questions directes'
        ],
        impact: 'Réduire ce délai peut augmenter votre taux de réponse de 15%'
      });
    }

    // Insight sur l'engagement
    if (metrics.clickRate > 15) {
      generatedInsights.push({
        id: 'high_engagement',
        type: 'success',
        priority: 'medium',
        title: 'Fort engagement du contenu',
        description: `Votre taux de clic de ${metrics.clickRate?.toFixed(1)}% indique un contenu très engageant.`,
        icon: SparklesIcon,
        actions: [
          'Analysez quels contenus génèrent le plus de clics',
          'Créez plus de contenu similaire',
          'Partagez ces formats avec votre équipe'
        ],
        impact: 'Ce niveau d\'engagement favorise les relations long terme'
      });
    }

    // Insight sur le volume
    if (metrics.totalSent < 50) {
      generatedInsights.push({
        id: 'low_volume',
        type: 'info',
        priority: 'low',
        title: 'Volume d\'envoi limité',
        description: `Vous avez envoyé ${metrics.totalSent} emails sur cette période. Un volume plus élevé peut améliorer vos statistiques.`,
        icon: EnvelopeIcon,
        actions: [
          'Élargissez votre liste de contacts qualifiés',
          'Planifiez des campagnes plus régulières',
          'Segmentez pour envoyer du contenu plus pertinent'
        ],
        impact: 'Augmenter le volume peut révéler de nouvelles opportunités'
      });
    }

    // Insight comparatif avec l'industrie
    const industryBenchmarks = {
      openRate: 22,
      clickRate: 12,
      responseRate: 4
    };

    if (metrics.openRate > industryBenchmarks.openRate * 1.2) {
      generatedInsights.push({
        id: 'above_industry_average',
        type: 'success',
        priority: 'low',
        title: 'Performance supérieure à l\'industrie',
        description: 'Vos métriques dépassent les standards de l\'industrie musicale.',
        icon: ArrowTrendingUpIcon,
        actions: [
          'Documentez vos méthodes pour les reproduire',
          'Formez votre équipe sur ces bonnes pratiques',
          'Envisagez de partager votre expertise'
        ],
        impact: 'Vous êtes dans le top 20% des performers'
      });
    }

    return generatedInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [metrics, changes]);

  // Configuration des types d'insights
  const insightConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900'
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const insightVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const detailVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };

  // Composant pour un insight individuel
  const InsightCard = ({ insight, isSelected, onClick }) => {
    const config = insightConfig[insight.type] || insightConfig.info;
    const IconComponent = insight.icon;

    return (
      <motion.div
        variants={insightVariants}
        className={`
          border rounded-lg p-4 cursor-pointer transition-all duration-200
          ${config.bgColor} ${config.borderColor}
          hover:shadow-md
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
        onClick={onClick}
      >
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${config.titleColor}`}>
                {insight.title}
              </h4>
              <ChevronRightIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isSelected ? 'transform rotate-90' : ''
                }`}
              />
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {insight.description}
            </p>

            {/* Priority badge */}
            <div className="mt-2">
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                Priorité {insight.priority === 'high' ? 'haute' : insight.priority === 'medium' ? 'moyenne' : 'faible'}
              </span>
            </div>
          </div>
        </div>

        {/* Détails expandables */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              variants={detailVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-4 pt-4 border-t border-gray-200"
            >
              {/* Actions recommandées */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  Actions recommandées :
                </h5>
                <ul className="space-y-1">
                  {insight.actions.map((action, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-blue-500 mr-2">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Impact estimé */}
              {insight.impact && (
                <div className="bg-white bg-opacity-50 rounded-md p-3">
                  <div className="flex items-start">
                    <SparklesIcon className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h6 className="text-sm font-medium text-gray-900">Impact estimé</h6>
                      <p className="text-sm text-gray-600 mt-1">{insight.impact}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <LightBulbIcon className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Insights IA
          </h3>
        </div>

        <div className="text-sm text-gray-500">
          {insights.length} insight{insights.length > 1 ? 's' : ''} détecté{insights.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des insights */}
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun insight disponible
          </h4>
          <p className="text-gray-500">
            Les insights apparaîtront ici une fois que vous aurez des données suffisantes.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isSelected={selectedInsight === insight.id}
              onClick={() => setSelectedInsight(
                selectedInsight === insight.id ? null : insight.id
              )}
            />
          ))}
        </motion.div>
      )}

      {/* Footer avec statistiques */}
      {insights.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {insights.filter(i => i.type === 'success').length}
              </div>
              <div className="text-xs text-gray-500">Points forts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">
                {insights.filter(i => i.type === 'warning').length}
              </div>
              <div className="text-xs text-gray-500">Améliorations</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {insights.filter(i => i.type === 'info').length}
              </div>
              <div className="text-xs text-gray-500">Informations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;