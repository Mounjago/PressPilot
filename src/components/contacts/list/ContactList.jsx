/**
 * CONTACT LIST COMPONENT
 * Renders the list of contacts with different view modes
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContactCard from '../card/ContactCard';
import ContactEmptyState from './ContactEmptyState';
import './ContactList.css';

const ContactList = ({
  contacts,
  selectedContact,
  onContactSelect,
  onContactCall,
  onContactEdit,
  onContactDelete,
  onContactEmail,
  viewMode = 'grid',
  searchTerm = '',
  filterStatus = 'all',
  onCreateContact,
  onImportContacts,
  onClearFilters,
  loading = false
}) => {
  // Determine empty state type
  const getEmptyStateType = () => {
    if (contacts.length === 0) {
      return 'no-contacts';
    }
    if (searchTerm || filterStatus !== 'all') {
      return 'no-matches';
    }
    return 'no-results';
  };

  if (loading) {
    return (
      <div className="contact-list-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des contacts...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="contact-list-empty">
        <ContactEmptyState
          type={getEmptyStateType()}
          searchTerm={searchTerm}
          onCreateContact={onCreateContact}
          onImportContacts={onImportContacts}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className={`contact-list ${viewMode}`}>
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          isSelected={selectedContact?.id === contact.id}
          onSelect={() => onContactSelect(contact)}
          onCall={onContactCall}
          onEdit={onContactEdit}
          onDelete={onContactDelete}
          onEmail={onContactEmail}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};

ContactList.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ).isRequired,
  selectedContact: PropTypes.object,
  onContactSelect: PropTypes.func.isRequired,
  onContactCall: PropTypes.func,
  onContactEdit: PropTypes.func,
  onContactDelete: PropTypes.func,
  onContactEmail: PropTypes.func,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  searchTerm: PropTypes.string,
  filterStatus: PropTypes.string,
  onCreateContact: PropTypes.func,
  onImportContacts: PropTypes.func,
  onClearFilters: PropTypes.func,
  loading: PropTypes.bool
};

export default ContactList;