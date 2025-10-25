/**
 * CONTACT DETAILS COMPONENT
 * Sidebar component showing detailed contact information with phone system integration
 */

import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import PhoneSystem from '../../phone/PhoneSystem';
import CallHistory from '../../phone/CallHistory';
import './ContactDetails.css';

const ContactDetails = ({
  contact,
  onClose,
  showPhoneSystem = true,
  onCallStart,
  onCallEnd
}) => {
  if (!contact) return null;

  return (
    <div className="contact-details-sidebar">
      {/* Header */}
      <div className="contact-details-header">
        <h3>Détails du contact</h3>
        <button
          className="contact-details-close"
          onClick={onClose}
          title="Fermer les détails"
        >
          <X />
        </button>
      </div>

      {/* Content */}
      <div className="contact-details-content">
        {/* Phone System Section */}
        {showPhoneSystem && contact.phone && (
          <div className="contact-details-section">
            <h4 className="section-title">Système d'appel</h4>
            <div className="contact-phone-section">
              <PhoneSystem
                contact={contact}
                onCallStart={onCallStart}
                onCallEnd={onCallEnd}
              />
            </div>
          </div>
        )}

        {/* Call History Section */}
        <div className="contact-details-section">
          <h4 className="section-title">Historique des appels</h4>
          <div className="contact-history-section">
            <CallHistory
              contactId={contact.id}
              onCallInitiated={() => {
                // Optional callback when call is initiated from history
              }}
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="contact-details-section">
          <h4 className="section-title">Informations</h4>
          <div className="contact-info-grid">
            {contact.email && (
              <div className="info-item">
                <label>Email</label>
                <span>{contact.email}</span>
              </div>
            )}

            {contact.phone && (
              <div className="info-item">
                <label>Téléphone</label>
                <span>{contact.phone}</span>
              </div>
            )}

            {contact.company && (
              <div className="info-item">
                <label>Entreprise</label>
                <span>{contact.company}</span>
              </div>
            )}

            {contact.jobTitle && (
              <div className="info-item">
                <label>Fonction</label>
                <span>{contact.jobTitle}</span>
              </div>
            )}

            {contact.media?.type && (
              <div className="info-item">
                <label>Type de média</label>
                <span>{contact.media.type}</span>
              </div>
            )}

            {contact.location && (
              <div className="info-item">
                <label>Localisation</label>
                <span>{contact.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {contact.notes && (
          <div className="contact-details-section">
            <h4 className="section-title">Notes</h4>
            <div className="contact-notes">
              <p>{contact.notes}</p>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="contact-details-section">
            <h4 className="section-title">Tags</h4>
            <div className="contact-tags">
              {contact.tags.map((tag, index) => (
                <span key={index} className="contact-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ContactDetails.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    company: PropTypes.string,
    jobTitle: PropTypes.string,
    location: PropTypes.string,
    notes: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    media: PropTypes.shape({
      type: PropTypes.string,
      name: PropTypes.string
    })
  }),
  onClose: PropTypes.func.isRequired,
  showPhoneSystem: PropTypes.bool,
  onCallStart: PropTypes.func,
  onCallEnd: PropTypes.func
};

export default ContactDetails;