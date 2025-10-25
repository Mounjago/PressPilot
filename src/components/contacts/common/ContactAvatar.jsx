/**
 * CONTACT AVATAR COMPONENT
 * Displays contact avatar with initials fallback and call status indicator
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ContactAvatar.css';

const ContactAvatar = ({
  contact,
  size = 'medium',
  showCallIndicator = false,
  lastCall = null,
  onClick = null
}) => {
  const getContactInitials = (contact) => {
    if (contact.firstName && contact.lastName) {
      return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
    } else if (contact.name) {
      return contact.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return 'var(--success-color)';
      case 'missed':
      case 'no-answer':
        return 'var(--error-color)';
      case 'busy':
        return 'var(--warning-color)';
      default:
        return 'var(--gray-medium)';
    }
  };

  const getContactName = (contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.name || 'Sans nom';
  };

  return (
    <div
      className={`contact-avatar-container ${size} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="contact-avatar">
        {contact.avatar ? (
          <img
            src={contact.avatar}
            alt={getContactName(contact)}
            className="contact-avatar-image"
          />
        ) : (
          <div className="contact-avatar-placeholder">
            {getContactInitials(contact)}
          </div>
        )}

        {showCallIndicator && lastCall && (
          <div
            className="contact-call-indicator"
            style={{ backgroundColor: getCallStatusColor(lastCall.status) }}
            title={`Dernier appel: ${lastCall.status}`}
          />
        )}
      </div>
    </div>
  );
};

ContactAvatar.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string
  }).isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showCallIndicator: PropTypes.bool,
  lastCall: PropTypes.shape({
    status: PropTypes.string,
    startedAt: PropTypes.string
  }),
  onClick: PropTypes.func
};

export default ContactAvatar;