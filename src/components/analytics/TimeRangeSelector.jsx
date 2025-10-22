import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const TimeRangeSelector = ({
  value = '30d',
  onChange = () => {},
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Options de période prédéfinies
  const timeRangeOptions = [
    { value: '7d', label: '7 derniers jours', description: 'Semaine actuelle' },
    { value: '30d', label: '30 derniers jours', description: 'Mois actuel' },
    { value: '90d', label: '90 derniers jours', description: 'Trimestre actuel' },
    { value: '1y', label: '1 an', description: 'Année actuelle' },
    { value: 'custom', label: 'Période personnalisée', description: 'Choisir les dates' }
  ];

  // Configuration des tailles
  const sizeClasses = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      dropdown: 'mt-1',
      option: 'px-3 py-2 text-sm'
    },
    md: {
      button: 'px-4 py-2 text-sm',
      dropdown: 'mt-2',
      option: 'px-4 py-3 text-sm'
    },
    lg: {
      button: 'px-6 py-3 text-base',
      dropdown: 'mt-2',
      option: 'px-6 py-4 text-base'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Obtenir le label de l'option sélectionnée
  const selectedOption = timeRangeOptions.find(option => option.value === value);

  // Gestion du changement de sélection
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.1
      }
    }
  };

  const optionVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center justify-between w-full
          ${sizes.button}
          bg-white border border-gray-300 rounded-lg shadow-sm
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors duration-200
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <CalendarDaysIcon className="w-4 h-4 text-gray-500 mr-2" />
          <span className="font-medium text-gray-900">
            {selectedOption?.label || 'Sélectionner une période'}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 ml-2 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay pour fermer le dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu dropdown */}
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`
                absolute right-0 z-20 w-72
                ${sizes.dropdown}
                bg-white rounded-lg shadow-lg border border-gray-200
                focus:outline-none
              `}
            >
              <div className="py-1">
                {timeRangeOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full text-left ${sizes.option}
                      hover:bg-gray-50 transition-colors duration-150
                      ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                      flex items-center justify-between
                    `}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </div>
                    </div>

                    {value === option.value && (
                      <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-100 my-1" />

              {/* Options rapides */}
              <div className="px-4 py-3 bg-gray-50">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Périodes populaires
                </div>
                <div className="flex flex-wrap gap-2">
                  {['7d', '30d', '90d'].map((period) => {
                    const option = timeRangeOptions.find(o => o.value === period);
                    return (
                      <button
                        key={period}
                        onClick={() => handleSelect(period)}
                        className={`
                          px-2 py-1 rounded text-xs font-medium transition-colors
                          ${value === period
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {option?.label.replace(' derniers jours', 'j').replace(' derniers ', '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Composant pour sélecteur de période personnalisée
export const CustomDateRangeSelector = ({
  startDate,
  endDate,
  onChange = () => {},
  className = ''
}) => {
  const [localStartDate, setLocalStartDate] = useState(
    startDate ? new Date(startDate).toISOString().split('T')[0] : ''
  );
  const [localEndDate, setLocalEndDate] = useState(
    endDate ? new Date(endDate).toISOString().split('T')[0] : ''
  );

  const handleApply = () => {
    if (localStartDate && localEndDate) {
      onChange({
        startDate: new Date(localStartDate),
        endDate: new Date(localEndDate)
      });
    }
  };

  const handleReset = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onChange({ startDate: null, endDate: null });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            min={localStartDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleApply}
            disabled={!localStartDate || !localEndDate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Appliquer
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant pour affichage de la période sélectionnée
export const SelectedPeriodDisplay = ({
  timeRange,
  startDate,
  endDate,
  className = ''
}) => {
  const formatPeriodDisplay = () => {
    if (timeRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('fr-FR');
      const end = new Date(endDate).toLocaleDateString('fr-FR');
      return `Du ${start} au ${end}`;
    }

    switch (timeRange) {
      case '7d':
        return 'Les 7 derniers jours';
      case '30d':
        return 'Les 30 derniers jours';
      case '90d':
        return 'Les 90 derniers jours';
      case '1y':
        return 'La dernière année';
      default:
        return 'Période non définie';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm ${className}`}>
      <CalendarDaysIcon className="w-4 h-4 mr-2" />
      <span className="font-medium">{formatPeriodDisplay()}</span>
    </div>
  );
};

export default TimeRangeSelector;