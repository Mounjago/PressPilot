/**
 * CONTACT ACTIONS COMPONENT
 * Action buttons for calling, emailing, editing, and deleting contacts
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  PhoneCall,
  Mail,
  Edit,
  Trash2,
  MoreVertical,
  MessageSquare,
  Copy
} from 'lucide-react';
import './ContactActions.css';

const ContactActions = ({
  contact,
  onCall,
  onEdit,
  onDelete,
  onEmail,
  onMessage,
  showCallButton = true,
  showDropdown = true,
  orientation = 'horizontal' // horizontal | vertical
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCall = () => {
    if (onCall && contact.phone) {
      onCall(contact);
    }
  };

  const handleEmail = () => {
    if (onEmail && contact.email) {
      onEmail(contact);
    } else if (contact.email) {
      window.open(`mailto:${contact.email}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact);
    }
    setShowActionsDropdown(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(contact);
    }
    setShowActionsDropdown(false);
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(contact);
    }
    setShowActionsDropdown(false);
  };

  const handleCopyPhone = () => {
    if (contact.phone) {
      navigator.clipboard.writeText(contact.phone);
      setShowActionsDropdown(false);
    }
  };

  const handleCopyEmail = () => {
    if (contact.email) {
      navigator.clipboard.writeText(contact.email);
      setShowActionsDropdown(false);
    }
  };

  return (
    <div className={`contact-actions ${orientation}`}>
      {/* Primary call button */}
      {showCallButton && contact.phone && (
        <button
          className="contact-action-btn contact-call-btn primary"
          onClick={handleCall}
          title="Appeler ce contact"
        >
          <PhoneCall />
        </button>
      )}

      {/* Secondary actions dropdown */}
      {showDropdown && (
        <div className="contact-action-menu" ref={dropdownRef}>
          <button
            className="contact-action-btn"
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            title="Plus d'actions"
          >
            <MoreVertical />
          </button>

          {showActionsDropdown && (
            <div className="contact-action-dropdown">
              {/* Edit action */}
              {onEdit && (
                <button
                  className="dropdown-item"
                  onClick={handleEdit}
                >
                  <Edit />
                  <span>Modifier</span>
                </button>
              )}

              {/* Email action */}
              {contact.email && (
                <button
                  className="dropdown-item"
                  onClick={handleEmail}
                >
                  <Mail />
                  <span>Envoyer un email</span>
                </button>
              )}

              {/* Call action (if not primary button) */}
              {!showCallButton && contact.phone && (
                <button
                  className="dropdown-item"
                  onClick={handleCall}
                >
                  <PhoneCall />
                  <span>Appeler</span>
                </button>
              )}

              {/* Message action */}
              {onMessage && (
                <button
                  className="dropdown-item"
                  onClick={handleMessage}
                >
                  <MessageSquare />
                  <span>Envoyer un message</span>
                </button>
              )}

              {/* Copy actions */}
              {contact.phone && (
                <button
                  className="dropdown-item"
                  onClick={handleCopyPhone}
                >
                  <Copy />
                  <span>Copier le téléphone</span>
                </button>
              )}

              {contact.email && (
                <button
                  className="dropdown-item"
                  onClick={handleCopyEmail}
                >
                  <Copy />
                  <span>Copier l'email</span>
                </button>
              )}

              {/* Delete action */}
              {onDelete && (
                <>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item delete"
                    onClick={handleDelete}
                  >
                    <Trash2 />
                    <span>Supprimer</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ContactActions.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    phone: PropTypes.string,
    email: PropTypes.string
  }).isRequired,
  onCall: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onEmail: PropTypes.func,
  onMessage: PropTypes.func,
  showCallButton: PropTypes.bool,
  showDropdown: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical'])
};

export default ContactActions;