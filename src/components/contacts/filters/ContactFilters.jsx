/**
 * CONTACT FILTERS COMPONENT
 * Search bar and filter controls for contacts
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import './ContactFilters.css';

const ContactFilters = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalContacts,
  filteredCount,
  onClearFilters
}) => {
  const filterOptions = [
    { value: 'all', label: 'Tous les contacts' },
    { value: 'with-phone', label: 'Avec téléphone' },
    { value: 'high-priority', label: 'Priorité élevée' },
    { value: 'recent-calls', label: 'Appels récents' }
  ];

  const hasActiveFilters = searchTerm || filterStatus !== 'all';
  const showingFiltered = filteredCount !== totalContacts;

  return (
    <section className="contacts-filters">
      {/* Search bar */}
      <div className="contacts-search">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher un contact..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={() => onSearchChange('')}
            title="Effacer la recherche"
          >
            <X />
          </button>
        )}
      </div>

      {/* Filter controls */}
      <div className="contacts-filter-controls">
        {/* Status filter */}
        <div className="filter-select-wrapper">
          <Filter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="contacts-filter-select"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            className="clear-filters-btn"
            onClick={onClearFilters}
            title="Effacer tous les filtres"
          >
            <X />
            <span>Effacer</span>
          </button>
        )}

        {/* View mode toggle */}
        <div className="contacts-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Affichage en grille"
          >
            <Grid />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="Affichage en liste"
          >
            <List />
          </button>
        </div>
      </div>

      {/* Results count */}
      {showingFiltered && (
        <div className="filter-results">
          <span className="results-count">
            {filteredCount} sur {totalContacts} contact{totalContacts > 1 ? 's' : ''}
            {hasActiveFilters && ' trouvé' + (filteredCount > 1 ? 's' : '')}
          </span>
        </div>
      )}
    </section>
  );
};

ContactFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  totalContacts: PropTypes.number.isRequired,
  filteredCount: PropTypes.number.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default ContactFilters;