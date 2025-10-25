/**
 * CONTACT STATS COMPONENT
 * Displays call statistics and last contact information
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Clock, Calendar, Phone } from 'lucide-react';
import './ContactStats.css';

const ContactStats = ({ callCount, lastCall, showIcons = true }) => {
  const formatLastCallDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a moins d\'1h';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours}h`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `Il y a ${days}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  if (!callCount && !lastCall) {
    return null;
  }

  return (
    <div className="contact-stats">
      {callCount > 0 && (
        <div className="contact-stat-item">
          {showIcons && <Clock className="contact-stat-icon" />}
          <span className="contact-stat-text">
            {callCount} appel{callCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {lastCall && (
        <div className="contact-stat-item">
          {showIcons && <Calendar className="contact-stat-icon" />}
          <span className="contact-stat-text">
            Dernier: {formatLastCallDate(lastCall.startedAt)}
          </span>
        </div>
      )}
    </div>
  );
};

ContactStats.propTypes = {
  callCount: PropTypes.number,
  lastCall: PropTypes.shape({
    status: PropTypes.string,
    startedAt: PropTypes.string
  }),
  showIcons: PropTypes.bool
};

export default ContactStats;