import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyEuroIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const ROICalculator = ({
  metrics = {},
  onCalculate = () => {},
  className = ''
}) => {
  // State pour les inputs
  const [budget, setBudget] = useState('');
  const [costPerReply, setCostPerReply] = useState('50');
  const [valuePerReply, setValuePerReply] = useState('200');
  const [customMetrics, setCustomMetrics] = useState(null);

  // State pour les résultats
  const [roiResults, setRoiResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcul automatique quand les données changent
  useEffect(() => {
    if (budget && metrics.totalReplied !== undefined) {
      calculateROI();
    }
  }, [budget, costPerReply, valuePerReply, metrics]);

  // Fonction de calcul du ROI
  const calculateROI = () => {
    setIsCalculating(true);

    // Simulation d'un délai de calcul pour l'UX
    setTimeout(() => {
      const budgetNum = parseFloat(budget) || 0;
      const costPerReplyNum = parseFloat(costPerReply) || 50;
      const valuePerReplyNum = parseFloat(valuePerReply) || 200;
      const totalReplies = metrics.totalReplied || 0;
      const totalSent = metrics.totalSent || 1;

      // Calculs de base
      const actualCostPerReply = totalReplies > 0 ? budgetNum / totalReplies : budgetNum;
      const totalValue = totalReplies * valuePerReplyNum;
      const netValue = totalValue - budgetNum;
      const roi = budgetNum > 0 ? ((totalValue - budgetNum) / budgetNum) * 100 : 0;

      // Efficacité vs objectif
      const costEfficiency = costPerReplyNum > 0 ? ((costPerReplyNum - actualCostPerReply) / costPerReplyNum) * 100 : 0;

      // Point d'équilibre
      const breakEvenReplies = valuePerReplyNum > 0 ? Math.ceil(budgetNum / valuePerReplyNum) : 0;
      const repliesToBreakEven = Math.max(0, breakEvenReplies - totalReplies);

      // Projections
      const projectedRepliesNextMonth = totalReplies * 1.1; // 10% d'amélioration estimée
      const projectedROINextMonth = budgetNum > 0 ? ((projectedRepliesNextMonth * valuePerReplyNum - budgetNum) / budgetNum) * 100 : 0;

      // Score de performance
      const performanceScore = calculatePerformanceScore({
        roi,
        costEfficiency,
        responseRate: metrics.responseRate || 0,
        engagementScore: metrics.engagementScore || 0
      });

      const results = {
        // Métriques financières de base
        totalInvestment: budgetNum,
        totalReplies,
        actualCostPerReply,
        targetCostPerReply: costPerReplyNum,
        totalValue,
        netValue,
        roi,

        // Analyses
        costEfficiency,
        performanceScore,

        // Projections
        breakEvenReplies,
        repliesToBreakEven,
        projectedRepliesNextMonth,
        projectedROINextMonth,

        // Insights
        insights: generateROIInsights({
          roi,
          costEfficiency,
          actualCostPerReply,
          costPerReplyNum,
          totalReplies,
          breakEvenReplies,
          performanceScore
        }),

        // Recommandations
        recommendations: generateRecommendations({
          roi,
          costEfficiency,
          responseRate: metrics.responseRate || 0,
          actualCostPerReply,
          costPerReplyNum
        })
      };

      setRoiResults(results);
      setIsCalculating(false);
      onCalculate(results);
    }, 500);
  };

  // Calcul du score de performance
  const calculatePerformanceScore = ({ roi, costEfficiency, responseRate, engagementScore }) => {
    let score = 0;

    // Poids des différents facteurs
    score += Math.min(40, roi > 0 ? roi / 5 : 0); // ROI (max 40 points)
    score += Math.min(30, costEfficiency > 0 ? costEfficiency * 0.3 : 0); // Efficacité coût (max 30 points)
    score += Math.min(20, responseRate * 2); // Taux de réponse (max 20 points)
    score += Math.min(10, engagementScore * 0.1); // Score d'engagement (max 10 points)

    return Math.min(100, Math.max(0, score));
  };

  // Génération d'insights automatiques
  const generateROIInsights = ({
    roi,
    costEfficiency,
    actualCostPerReply,
    costPerReplyNum,
    totalReplies,
    breakEvenReplies,
    performanceScore
  }) => {
    const insights = [];

    if (roi > 100) {
      insights.push({
        type: 'success',
        title: 'ROI excellent',
        message: `Votre ROI de ${roi.toFixed(1)}% dépasse largement les attentes.`,
        icon: ArrowTrendingUpIcon
      });
    } else if (roi > 0) {
      insights.push({
        type: 'success',
        title: 'ROI positif',
        message: `Votre investissement génère ${roi.toFixed(1)}% de retour.`,
        icon: ArrowTrendingUpIcon
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'ROI négatif',
        message: `Votre investissement n'est pas encore rentable (${roi.toFixed(1)}%).`,
        icon: ArrowTrendingDownIcon
      });
    }

    if (costEfficiency > 20) {
      insights.push({
        type: 'success',
        title: 'Coût par réponse optimisé',
        message: `Vous êtes ${costEfficiency.toFixed(1)}% plus efficace que votre objectif.`
      });
    } else if (costEfficiency < -20) {
      insights.push({
        type: 'warning',
        title: 'Coût par réponse élevé',
        message: `Votre coût par réponse dépasse votre objectif de ${Math.abs(costEfficiency).toFixed(1)}%.`
      });
    }

    if (totalReplies >= breakEvenReplies) {
      insights.push({
        type: 'success',
        title: 'Point d\'équilibre atteint',
        message: `Vous avez dépassé le seuil de rentabilité de ${breakEvenReplies} réponses.`
      });
    }

    return insights;
  };

  // Génération de recommandations
  const generateRecommendations = ({ roi, costEfficiency, responseRate, actualCostPerReply, costPerReplyNum }) => {
    const recommendations = [];

    if (roi < 0) {
      recommendations.push({
        priority: 'high',
        action: 'Améliorer le taux de réponse',
        description: 'Concentrez-vous sur la personnalisation et le timing pour augmenter l\'engagement.'
      });
    }

    if (costEfficiency < 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimiser les coûts',
        description: 'Réduisez les coûts ou augmentez l\'efficacité pour atteindre votre objectif de coût par réponse.'
      });
    }

    if (responseRate < 5) {
      recommendations.push({
        priority: 'high',
        action: 'Segmenter votre audience',
        description: 'Ciblez mieux vos contacts pour améliorer la pertinence de vos messages.'
      });
    }

    if (roi > 50) {
      recommendations.push({
        priority: 'low',
        action: 'Augmenter le budget',
        description: 'Votre ROI élevé justifie une augmentation d\'investissement pour maximiser les résultats.'
      });
    }

    return recommendations;
  };

  // Formatage des valeurs
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const resultsVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalculatorIcon className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Calculateur ROI
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Retour sur investissement
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section des inputs */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Paramètres de calcul
          </h4>

          {/* Budget investi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget investi
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1000"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Coût cible par réponse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coût objectif par réponse
              <div className="group relative inline-block ml-1">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg -right-0 top-full">
                  Coût maximum acceptable pour obtenir une réponse de journaliste
                </div>
              </div>
            </label>
            <div className="relative">
              <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={costPerReply}
                onChange={(e) => setCostPerReply(e.target.value)}
                placeholder="50"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Valeur par réponse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valeur estimée par réponse
              <div className="group relative inline-block ml-1">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg -right-0 top-full">
                  Valeur business moyenne générée par chaque réponse de journaliste (couverture médiatique)
                </div>
              </div>
            </label>
            <div className="relative">
              <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={valuePerReply}
                onChange={(e) => setValuePerReply(e.target.value)}
                placeholder="200"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Métriques actuelles */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Métriques actuelles</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Emails envoyés:</span>
                <span className="font-medium ml-2">{metrics.totalSent || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Réponses:</span>
                <span className="font-medium ml-2">{metrics.totalReplied || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section des résultats */}
        <div>
          {isCalculating ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Calcul en cours...</span>
            </div>
          ) : roiResults ? (
            <motion.div
              variants={resultsVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Résultats de l'analyse
              </h4>

              {/* Métriques principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(roiResults.roi)}
                  </div>
                  <div className="text-sm text-blue-600">ROI</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(roiResults.netValue)}
                  </div>
                  <div className="text-sm text-green-600">Valeur nette</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(roiResults.actualCostPerReply)}
                  </div>
                  <div className="text-sm text-purple-600">Coût par réponse</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {roiResults.performanceScore.toFixed(0)}
                  </div>
                  <div className="text-sm text-orange-600">Score performance</div>
                </div>
              </div>

              {/* Insights */}
              {roiResults.insights.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Insights</h5>
                  {roiResults.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`flex items-start p-3 rounded-lg text-sm ${
                        insight.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                      }`}
                    >
                      {insight.icon && <insight.icon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />}
                      <div>
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-xs mt-1">{insight.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommandations */}
              {roiResults.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Recommandations</h5>
                  {roiResults.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{rec.action}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                      </div>
                      <div className="text-gray-600">{rec.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Saisissez votre budget pour voir l'analyse ROI</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ROICalculator;