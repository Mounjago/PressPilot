import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FireIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const HeatmapView = ({
  title = "Heatmap Analytics",
  data = [],
  xAxisKey = 'hour',
  yAxisKey = 'dayOfWeek',
  valueKey = 'openRate',
  colorScale = ['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626'],
  width = 'auto',
  height = 400,
  showTooltip = true,
  showLegend = true,
  className = ''
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Configuration des axes
  const axisConfigs = {
    hour: {
      label: 'Heure',
      values: Array.from({ length: 24 }, (_, i) => i),
      formatter: (value) => `${value}h`
    },
    dayOfWeek: {
      label: 'Jour',
      values: [1, 2, 3, 4, 5, 6, 7],
      formatter: (value) => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[value - 1] || 'N/A';
      }
    },
    month: {
      label: 'Mois',
      values: Array.from({ length: 12 }, (_, i) => i + 1),
      formatter: (value) => {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                       'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return months[value - 1] || 'N/A';
      }
    }
  };

  // Traitement des données pour la heatmap
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const xConfig = axisConfigs[xAxisKey];
    const yConfig = axisConfigs[yAxisKey];

    if (!xConfig || !yConfig) return [];

    // Créer une matrice avec toutes les combinaisons possibles
    const matrix = [];
    yConfig.values.forEach(yValue => {
      const row = [];
      xConfig.values.forEach(xValue => {
        // Trouver la donnée correspondante
        const dataPoint = data.find(d =>
          d[xAxisKey] === xValue && d[yAxisKey] === yValue
        );

        row.push({
          x: xValue,
          y: yValue,
          value: dataPoint ? (dataPoint[valueKey] || 0) : 0,
          rawData: dataPoint || null,
          xLabel: xConfig.formatter(xValue),
          yLabel: yConfig.formatter(yValue)
        });
      });
      matrix.push(row);
    });

    return matrix;
  }, [data, xAxisKey, yAxisKey, valueKey]);

  // Calcul des valeurs min/max pour la normalisation des couleurs
  const { minValue, maxValue } = useMemo(() => {
    if (heatmapData.length === 0) return { minValue: 0, maxValue: 100 };

    const allValues = heatmapData.flat().map(cell => cell.value).filter(v => v > 0);

    return {
      minValue: Math.min(...allValues, 0),
      maxValue: Math.max(...allValues, 1)
    };
  }, [heatmapData]);

  // Fonction pour obtenir la couleur d'une cellule
  const getCellColor = (value) => {
    if (value === 0 || maxValue === minValue) {
      return '#F9FAFB'; // Gris très clair pour les valeurs nulles
    }

    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const colorIndex = Math.floor(normalizedValue * (colorScale.length - 1));
    return colorScale[Math.min(colorIndex, colorScale.length - 1)];
  };

  // Fonction pour formater les valeurs
  const formatValue = (value) => {
    if (value === 0) return '0';

    if (valueKey.includes('Rate') || valueKey.includes('Percentage')) {
      return `${value.toFixed(1)}%`;
    }

    return value.toLocaleString('fr-FR');
  };

  // Composant Tooltip
  const Tooltip = ({ cell, position }) => {
    if (!cell || !position) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
        style={{
          left: position.x + 10,
          top: position.y - 10,
          transform: 'translateY(-100%)'
        }}
      >
        <div className="font-medium mb-1">
          {cell.yLabel} - {cell.xLabel}
        </div>
        <div className="text-gray-300">
          Valeur: {formatValue(cell.value)}
        </div>
        {cell.rawData && (
          <div className="text-xs text-gray-400 mt-1">
            {Object.keys(cell.rawData)
              .filter(key => !['_id', xAxisKey, yAxisKey].includes(key))
              .slice(0, 2)
              .map(key => (
                <div key={key}>
                  {key}: {typeof cell.rawData[key] === 'number'
                    ? cell.rawData[key].toFixed(1)
                    : cell.rawData[key]
                  }
                </div>
              ))
            }
          </div>
        )}

        {/* Flèche du tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </motion.div>
    );
  };

  // Légende des couleurs
  const ColorLegend = () => (
    <div className="flex items-center space-x-4 mt-4">
      <span className="text-sm text-gray-600">Faible</span>
      <div className="flex space-x-1">
        {colorScale.map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">Élevé</span>
      <div className="ml-4 text-xs text-gray-500">
        Min: {formatValue(minValue)} | Max: {formatValue(maxValue)}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FireIcon className="w-5 h-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>
          <div className="text-sm text-gray-500">
            {heatmapData.flat().filter(cell => cell.value > 0).length} données
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative overflow-x-auto">
        {heatmapData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FireIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Aucune donnée disponible</p>
            <p className="text-sm">Les données de heatmap apparaîtront ici</p>
          </div>
        ) : (
          <div className="inline-block min-w-full">
            {/* En-têtes X */}
            <div className="flex">
              <div className="w-16 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                {axisConfigs[yAxisKey]?.label}
              </div>
              {heatmapData[0]?.map((cell, xIndex) => (
                <div
                  key={xIndex}
                  className="w-12 h-8 flex items-center justify-center text-xs font-medium text-gray-500 border-b border-gray-200"
                >
                  {cell.xLabel}
                </div>
              ))}
            </div>

            {/* Grille de la heatmap */}
            {heatmapData.map((row, yIndex) => (
              <div key={yIndex} className="flex">
                {/* En-tête Y */}
                <div className="w-16 h-12 flex items-center justify-center text-xs font-medium text-gray-500 border-r border-gray-200">
                  {row[0]?.yLabel}
                </div>

                {/* Cellules */}
                {row.map((cell, xIndex) => (
                  <motion.div
                    key={`${yIndex}-${xIndex}`}
                    className="w-12 h-12 border border-gray-100 cursor-pointer relative"
                    style={{
                      backgroundColor: getCellColor(cell.value)
                    }}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                    onMouseEnter={(e) => {
                      if (showTooltip) {
                        const rect = e.target.getBoundingClientRect();
                        setHoveredCell({
                          cell,
                          position: {
                            x: rect.left + rect.width / 2,
                            y: rect.top
                          }
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => setSelectedCell(selectedCell === cell ? null : cell)}
                  >
                    {/* Valeur dans la cellule */}
                    {cell.value > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-800">
                          {cell.value.toFixed(0)}
                        </span>
                      </div>
                    )}

                    {/* Indicateur de sélection */}
                    {selectedCell === cell && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded" />
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Légende */}
      {showLegend && heatmapData.length > 0 && <ColorLegend />}

      {/* Tooltip */}
      {showTooltip && hoveredCell && (
        <Tooltip
          cell={hoveredCell.cell}
          position={hoveredCell.position}
        />
      )}

      {/* Informations sur la cellule sélectionnée */}
      {selectedCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">
              Détails: {selectedCell.yLabel} - {selectedCell.xLabel}
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Valeur principale:</span>
              <div className="text-blue-900">{formatValue(selectedCell.value)}</div>
            </div>

            {selectedCell.rawData && Object.entries(selectedCell.rawData)
              .filter(([key]) => !['_id', xAxisKey, yAxisKey].includes(key))
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key}>
                  <span className="text-blue-600 font-medium capitalize">{key}:</span>
                  <div className="text-blue-900">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </div>
                </div>
              ))
            }
          </div>

          {selectedCell.rawData && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Voir plus de détails →
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Statistiques rapides */}
      {heatmapData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {heatmapData.flat().filter(cell => cell.value > 0).length}
              </div>
              <div className="text-xs text-gray-500">Points de données</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {formatValue(maxValue)}
              </div>
              <div className="text-xs text-gray-500">Valeur max</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {formatValue(
                  heatmapData.flat()
                    .filter(cell => cell.value > 0)
                    .reduce((sum, cell) => sum + cell.value, 0) /
                  heatmapData.flat().filter(cell => cell.value > 0).length || 0
                )}
              </div>
              <div className="text-xs text-gray-500">Moyenne</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {Math.max(...heatmapData.flat().map(cell => cell.x))} × {Math.max(...heatmapData.flat().map(cell => cell.y))}
              </div>
              <div className="text-xs text-gray-500">Dimensions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapView;