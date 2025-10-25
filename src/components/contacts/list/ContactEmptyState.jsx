/**
 * CONTACT EMPTY STATE COMPONENT
 * Displays when no contacts are found or available
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Phone, Search, Plus, Upload } from 'lucide-react';
import './ContactEmptyState.css';

const ContactEmptyState = ({
  type = 'no-results', // no-results | no-contacts | no-matches
  searchTerm = '',
  onCreateContact = null,
  onImportContacts = null,
  onClearFilters = null
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-contacts':
        return {
          icon: <Phone className="empty-state-icon" />,
          title: 'Aucun contact',
          description: 'Vous n\'avez encore aucun contact. Commencez par en créer un ou importer votre carnet d\'adresses.',
          actions: [
            {
              label: 'Créer un contact',
              onClick: onCreateContact,
              icon: <Plus />,
              primary: true
            },
            {
              label: 'Importer des contacts',
              onClick: onImportContacts,
              icon: <Upload />
            }
          ]
        };

      case 'no-matches':
        return {
          icon: <Search className="empty-state-icon" />,
          title: 'Aucun résultat',
          description: `Aucun contact ne correspond aux filtres appliqués.`,
          actions: [
            {
              label: 'Effacer les filtres',
              onClick: onClearFilters,
              primary: true
            },
            {
              label: 'Créer un contact',
              onClick: onCreateContact,
              icon: <Plus />
            }
          ]
        };

      case 'no-results':
      default:
        return {
          icon: <Search className="empty-state-icon" />,
          title: 'Aucun contact trouvé',
          description: searchTerm
            ? `Aucun contact ne correspond à la recherche "${searchTerm}".`
            : 'Aucun contact ne correspond à vos critères de recherche.',
          actions: [
            {
              label: 'Créer ce contact',
              onClick: () => onCreateContact && onCreateContact(searchTerm),
              icon: <Plus />,
              primary: true
            }
          ].filter(action => action.onClick)
        };
    }
  };

  const { icon, title, description, actions = [] } = getEmptyStateContent();

  return (
    <div className="contact-empty-state">
      {icon}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>

      {actions.length > 0 && (
        <div className="empty-state-actions">
          {actions.map((action, index) => (
            action.onClick && (
              <button
                key={index}
                className={`empty-state-btn ${action.primary ? 'primary' : 'secondary'}`}
                onClick={action.onClick}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

ContactEmptyState.propTypes = {
  type: PropTypes.oneOf(['no-results', 'no-contacts', 'no-matches']),
  searchTerm: PropTypes.string,
  onCreateContact: PropTypes.func,
  onImportContacts: PropTypes.func,
  onClearFilters: PropTypes.func
};

export default ContactEmptyState;