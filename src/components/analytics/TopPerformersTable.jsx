import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const TopPerformersTable = ({
  campaigns = [],
  journalists = [],
  onViewDetails = () => {},
  maxItems = 5,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [sortConfig, setSortConfig] = useState({
    key: 'responseRate',
    direction: 'desc'
  });

  // Configuration des colonnes pour les campagnes
  const campaignColumns = [
    {
      key: 'name',
      label: 'Campagne',
      sortable: true,
      render: (campaign) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={campaign.name}>
              {campaign.name}
            </p>
            <p className="text-xs text-gray-500">{campaign.subject}</p>
          </div>
        </div>
      )
    },
    {
      key: 'artist',
      label: 'Artiste',
      sortable: false,
      render: (campaign) => (
        <div className="text-sm text-gray-600">
          {campaign.artist?.name || campaign.artistId?.name || 'N/A'}
        </div>
      )
    },
    {
      key: 'openRate',
      label: 'Ouvertures',
      sortable: true,
      render: (campaign) => (
        <div className="flex items-center space-x-2">
          <EyeIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">
            {(campaign.metrics?.openRate || 0).toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'clickRate',
      label: 'Clics',
      sortable: true,
      render: (campaign) => (
        <div className="flex items-center space-x-2">
          <CursorArrowRaysIcon className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">
            {(campaign.metrics?.clickRate || 0).toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'responseRate',
      label: 'Réponses',
      sortable: true,
      render: (campaign) => (
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">
            {(campaign.metrics?.responseRate || 0).toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'sentAt',
      label: 'Date',
      sortable: true,
      render: (campaign) => (
        <div className="text-sm text-gray-600">
          {new Date(campaign.sentAt).toLocaleDateString('fr-FR')}
        </div>
      )
    }
  ];

  // Configuration des colonnes pour les journalistes
  const journalistColumns = [
    {
      key: 'contact',
      label: 'Journaliste',
      sortable: true,
      render: (journalist) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {journalist.contactId?.firstName} {journalist.contactId?.lastName}
            </p>
            <p className="text-xs text-gray-500">{journalist.contactId?.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'media',
      label: 'Média',
      sortable: false,
      render: (journalist) => (
        <div className="text-sm text-gray-600">
          {journalist.contactId?.media || 'N/A'}
        </div>
      )
    },
    {
      key: 'affinityScore',
      label: 'Affinité',
      sortable: true,
      render: (journalist) => (
        <div className="flex items-center space-x-2">
          <StarIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">
            {(journalist.affinityScore || 0).toFixed(0)}
          </span>
        </div>
      )
    },
    {
      key: 'engagementHistory.averageOpenRate',
      label: 'Taux ouv.',
      sortable: true,
      render: (journalist) => (
        <span className="text-sm">
          {(journalist.engagementHistory?.averageOpenRate || 0).toFixed(1)}%
        </span>
      )
    },
    {
      key: 'engagementHistory.averageResponseRate',
      label: 'Taux rép.',
      sortable: true,
      render: (journalist) => (
        <span className="text-sm font-medium text-purple-600">
          {(journalist.engagementHistory?.averageResponseRate || 0).toFixed(1)}%
        </span>
      )
    },
    {
      key: 'engagementHistory.totalEmailsSent',
      label: 'Interactions',
      sortable: true,
      render: (journalist) => (
        <span className="text-sm text-gray-600">
          {journalist.engagementHistory?.totalEmailsSent || 0}
        </span>
      )
    }
  ];

  // Fonction de tri
  const sortData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      let aValue = getNestedValue(a, config.key);
      let bValue = getNestedValue(b, config.key);

      // Gestion des valeurs null/undefined
      if (aValue === null || aValue === undefined) aValue = 0;
      if (bValue === null || bValue === undefined) bValue = 0;

      // Comparaison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Helper pour récupérer les valeurs imbriquées
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Gestion du tri
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Données triées
  const sortedCampaigns = sortData(campaigns, sortConfig);
  const sortedJournalists = sortData(journalists, sortConfig);

  // Animation variants
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  // Composant pour les en-têtes de colonne
  const ColumnHeader = ({ column, onSort, sortConfig }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
      }`}
      onClick={column.sortable ? () => onSort(column.key) : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{column.label}</span>
        {column.sortable && (
          <div className="flex flex-col">
            <ChevronUpIcon
              className={`w-3 h-3 ${
                sortConfig.key === column.key && sortConfig.direction === 'asc'
                  ? 'text-blue-600'
                  : 'text-gray-300'
              }`}
            />
            <ChevronDownIcon
              className={`w-3 h-3 -mt-1 ${
                sortConfig.key === column.key && sortConfig.direction === 'desc'
                  ? 'text-blue-600'
                  : 'text-gray-300'
              }`}
            />
          </div>
        )}
      </div>
    </th>
  );

  // Composant pour les rangs
  const RankBadge = ({ rank }) => {
    const getBadgeColor = (rank) => {
      switch (rank) {
        case 1:
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 2:
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 3:
          return 'bg-orange-100 text-orange-800 border-orange-200';
        default:
          return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    };

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(rank)}`}>
        {rank <= 3 && <TrophyIcon className="w-3 h-3 mr-1" />}
        #{rank}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header avec onglets */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Top Performers
            </h3>

            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Campagnes ({campaigns.length})
              </button>
              <button
                onClick={() => setActiveTab('journalists')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'journalists'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Journalistes ({journalists.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        {activeTab === 'campaigns' ? (
          <motion.div
            key="campaigns"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {sortedCampaigns.length === 0 ? (
              <div className="p-12 text-center">
                <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h4>
                <p className="text-gray-500">Les campagnes performantes apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rang
                      </th>
                      {campaignColumns.map((column) => (
                        <ColumnHeader
                          key={column.key}
                          column={column}
                          onSort={handleSort}
                          sortConfig={sortConfig}
                        />
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCampaigns.slice(0, maxItems).map((campaign, index) => (
                      <motion.tr
                        key={campaign._id || campaign.id}
                        variants={rowVariants}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RankBadge rank={index + 1} />
                        </td>
                        {campaignColumns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                            {column.render(campaign)}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onViewDetails('campaign', campaign._id || campaign.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
                            Voir
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="journalists"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {sortedJournalists.length === 0 ? (
              <div className="p-12 text-center">
                <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun journaliste</h4>
                <p className="text-gray-500">Les journalistes engagés apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rang
                      </th>
                      {journalistColumns.map((column) => (
                        <ColumnHeader
                          key={column.key}
                          column={column}
                          onSort={handleSort}
                          sortConfig={sortConfig}
                        />
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedJournalists.slice(0, maxItems).map((journalist, index) => (
                      <motion.tr
                        key={journalist._id || journalist.contactId?._id}
                        variants={rowVariants}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RankBadge rank={index + 1} />
                        </td>
                        {journalistColumns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                            {column.render(journalist)}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onViewDetails('journalist', journalist.contactId?._id || journalist._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
                            Profil
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer avec lien vers la vue complète */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {activeTab === 'campaigns' ? Math.min(campaigns.length, maxItems) : Math.min(journalists.length, maxItems)} sur{' '}
            {activeTab === 'campaigns' ? campaigns.length : journalists.length} éléments
          </p>
          <button
            onClick={() => {
              const route = activeTab === 'campaigns' ? '/analytics/campaigns' : '/analytics/journalists';
              window.location.href = route;
            }}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Voir tous les {activeTab === 'campaigns' ? 'campagnes' : 'journalistes'} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopPerformersTable;