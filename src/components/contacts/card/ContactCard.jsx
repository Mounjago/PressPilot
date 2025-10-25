/**
 * REFACTORED CONTACT CARD COMPONENT
 * Modular contact card using smaller components
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Building, Star } from 'lucide-react';
import ContactAvatar from '../common/ContactAvatar';
import ContactActions from '../common/ContactActions';
import ContactStats from '../common/ContactStats';
import ContactTags from '../common/ContactTags';
import callsApi from '../../../services/callsApi';
import './ContactCard.css';

const ContactCard = ({
  contact,
  isSelected = false,
  onSelect,
  onCall,
  onEdit,
  onDelete,
  onEmail,
  viewMode = 'grid' // grid | list
}) => {
  const [lastCall, setLastCall] = useState(null);
  const [callCount, setCallCount] = useState(0);
  const [isPhoneActive, setIsPhoneActive] = useState(false);

  // Load call information
  useEffect(() => {
    let isMounted = true;

    const loadCallInfo = async () => {
      try {
        const calls = await callsApi.getCallsByContact(contact.id);

        if (isMounted && calls && calls.length > 0) {
          setLastCall(calls[0]); // Most recent
          setCallCount(calls.length);
        }
      } catch (error) {
        // Silent fallback - call info is not critical
        console.debug('No call history for this contact');
        if (isMounted) {
          setLastCall(null);
          setCallCount(0);
        }
      }
    };

    // Only load if contact ID exists
    if (contact.id) {
      loadCallInfo();
    }

    return () => {
      isMounted = false;
    };
  }, [contact.id]);

  const handleCall = () => {
    if (onCall) {
      onCall(contact);
    }
    setIsPhoneActive(true);
  };

  const getContactName = (contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.name || 'Sans nom';
  };

  const getContactInfo = () => {
    const info = [];
    if (contact.phone) info.push(contact.phone);
    if (contact.email) info.push(contact.email);
    return info;
  };

  return (
    <div
      className={`
        contact-card
        ${viewMode}
        ${isSelected ? 'selected' : ''}
        ${isPhoneActive ? 'phone-active' : ''}
      `}
    >
      {/* Header with avatar and actions */}
      <div className="contact-card-header">
        <div className="contact-avatar-section" onClick={onSelect}>
          <ContactAvatar
            contact={contact}
            size="medium"
            showCallIndicator={true}
            lastCall={lastCall}
            onClick={onSelect}
          />
        </div>

        <ContactActions
          contact={contact}
          onCall={handleCall}
          onEdit={onEdit}
          onDelete={onDelete}
          onEmail={onEmail}
          showCallButton={true}
          showDropdown={true}
        />
      </div>

      {/* Main content */}
      <div className="contact-card-content" onClick={onSelect}>
        {/* Basic information */}
        <div className="contact-main-info">
          <h3 className="contact-name">{getContactName(contact)}</h3>

          {contact.jobTitle && (
            <span className="contact-title">{contact.jobTitle}</span>
          )}

          {contact.company && (
            <div className="contact-company">
              <Building className="company-icon" />
              <span>{contact.company}</span>
            </div>
          )}
        </div>

        {/* Contact details */}
        {viewMode === 'list' && (
          <div className="contact-details">
            {getContactInfo().map((info, index) => (
              <span key={index} className="contact-detail-item">
                {info}
              </span>
            ))}
          </div>
        )}

        {/* Call statistics */}
        <ContactStats
          callCount={callCount}
          lastCall={lastCall}
          showIcons={viewMode === 'grid'}
        />

        {/* Notes preview (grid view only) */}
        {viewMode === 'grid' && contact.notes && (
          <div className="contact-notes-preview">
            <p>{contact.notes.length > 60 ? `${contact.notes.substring(0, 60)}...` : contact.notes}</p>
          </div>
        )}

        {/* Tags */}
        <ContactTags
          tags={contact.tags}
          maxVisible={viewMode === 'list' ? 2 : 3}
        />

        {/* Priority indicator */}
        {contact.priority && contact.priority !== 'normal' && (
          <div className={`contact-priority priority-${contact.priority}`}>
            <Star className="priority-icon" />
            <span>{contact.priority}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ContactCard.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    company: PropTypes.string,
    jobTitle: PropTypes.string,
    title: PropTypes.string,
    notes: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    priority: PropTypes.string,
    avatar: PropTypes.string
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  onCall: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onEmail: PropTypes.func,
  viewMode: PropTypes.oneOf(['grid', 'list'])
};

export default ContactCard;