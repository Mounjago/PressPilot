import React from 'react';
import { Filter } from 'lucide-react';

function FilterBar({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="mb-4">
      {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {/* Mobile filter label */}
        <div className="flex items-center gap-2 mb-2 sm:hidden">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtres</span>
        </div>

        {/* Périodicité */}
        <select
          name="periodicity"
          onChange={handleChange}
          value={filters?.periodicity || ''}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto"
        >
          <option value="">Toutes les périodicités</option>
          <option value="Quotidien">Quotidien</option>
          <option value="Hebdomadaire">Hebdomadaire</option>
          <option value="Mensuel">Mensuel</option>
        </select>

        {/* Zone */}
        <select
          name="zone"
          onChange={handleChange}
          value={filters?.zone || ''}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto"
        >
          <option value="">Toutes les zones</option>
          <option value="National">National</option>
          <option value="Régional">Régional</option>
          <option value="International">International</option>
        </select>

        {/* Clear filters button - Mobile only */}
        {(filters?.periodicity || filters?.zone) && (
          <button
            onClick={() => setFilters({ periodicity: '', zone: '' })}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 sm:hidden"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Active filters indicator - Mobile */}
      <div className="mt-2 sm:hidden">
        {(filters?.periodicity || filters?.zone) && (
          <div className="text-xs text-gray-500">
            Filtres actifs: {[filters.periodicity, filters.zone].filter(Boolean).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;