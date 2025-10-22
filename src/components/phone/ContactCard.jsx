/**
 * CONTACT CARD COMPONENT - Carte de contact enrichie avec phoning
 * Affiche les informations contact avec bouton d'appel et historique
 */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  Mail,
  Building,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Star,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import PhoneSystem from './PhoneSystem';
import CallHistory from './CallHistory';
import callsApi from '../../services/callsApi';
import './ContactCard.css';

const ContactCard = ({
  contact,
  onCall,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  showPhoneSystem = false,
  showCallHistory = false
}) => {
  const [lastCall, setLastCall] = useState(null);
  const [callCount, setCallCount] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isPhoneActive, setIsPhoneActive] = useState(false);

  // Chargement des informations d'appel
  useEffect(() => {
    loadCallInfo();
  }, [contact.id]);

  const loadCallInfo = async () => {
    try {
      const calls = await callsApi.getCallsByContact(contact.id);

      if (calls && calls.length > 0) {
        setLastCall(calls[0]); // Le plus récent
        setCallCount(calls.length);
      }
    } catch (error) {
      // Fallback silencieux - les infos d'appel ne sont pas critiques
      console.debug('Pas d\'historique d\'appel pour ce contact');
    }
  };

  const handlePhoneClick = () => {
    if (onCall) {
      onCall(contact);
    }
    setIsPhoneActive(true);
  };

  const handleCallStart = (call) => {
    setIsPhoneActive(true);
    loadCallInfo(); // Refresh pour le nouvel appel
  };

  const handleCallEnd = (call) => {
    setIsPhoneActive(false);
    loadCallInfo(); // Refresh après l'appel
  };

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

  const getContactInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`contact-card ${isSelected ? 'selected' : ''} ${isPhoneActive ? 'phone-active' : ''}`}>
      {/* Header avec avatar et actions */}
      <div className="contact-card-header">
        <div className="contact-avatar-section" onClick={onSelect}>
          <div className="contact-avatar">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} />
            ) : (
              <div className="contact-avatar-placeholder">
                {getContactInitials(contact.name)}
              </div>
            )}
            {lastCall && (
              <div
                className="contact-call-indicator"
                style={{ backgroundColor: getCallStatusColor(lastCall.status) }}
                title={`Dernier appel: ${lastCall.status}`}
              ></div>
            )}
          </div>
        </div>

        <div className="contact-actions">
          {contact.phone && (
            <button
              className="contact-action-btn contact-call-btn"
              onClick={handlePhoneClick}
              title="Appeler ce contact"
            >
              <PhoneCall />
            </button>
          )}

          <div className="contact-action-menu">
            <button
              className="contact-action-btn"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical />
            </button>

            {showActions && (
              <div className="contact-action-dropdown">
                {onEdit && (
                  <button onClick={() => { onEdit(contact); setShowActions(false); }}>
                    <Edit />
                    Modifier
                  </button>
                )}

                {contact.email && (
                  <button onClick={() => window.open(`mailto:${contact.email}`)}>
                    <Mail />
                    Envoyer un email
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => { onDelete(contact); setShowActions(false); }}
                    className="contact-action-delete"
                  >
                    <Trash2 />
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="contact-card-content" onClick={onSelect}>
        <div className="contact-main-info">
          <h3 className="contact-name">{contact.name || 'Sans nom'}</h3>

          {contact.title && (
            <span className="contact-title">{contact.title}</span>
          )}

          {contact.company && (
            <div className="contact-company">
              <Building />
              <span>{contact.company}</span>
            </div>
          )}
        </div>

        {/* Informations de contact */}
        <div className="contact-details">
          {contact.phone && (
            <div className="contact-detail-item">
              <Phone />
              <span>{contact.phone}</span>
            </div>
          )}

          {contact.email && (
            <div className="contact-detail-item">
              <Mail />
              <span>{contact.email}</span>
            </div>
          )}

          {contact.location && (
            <div className="contact-detail-item">
              <MapPin />
              <span>{contact.location}</span>
            </div>
          )}
        </div>

        {/* Statistiques d'appels */}
        {(callCount > 0 || lastCall) && (
          <div className="contact-call-stats">
            {callCount > 0 && (
              <div className="contact-call-count">
                <Clock />
                <span>{callCount} appel{callCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {lastCall && (
              <div className="contact-last-call">
                <Calendar />
                <span>Dernier: {formatLastCallDate(lastCall.startedAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes/Tags */}
        {contact.notes && (
          <div className="contact-notes">
            <MessageSquare />
            <span>{contact.notes}</span>
          </div>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <div className="contact-tags">
            {contact.tags.map((tag, index) => (
              <span key={index} className="contact-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Priorité/Importance */}
        {contact.priority && contact.priority !== 'normal' && (
          <div className={`contact-priority priority-${contact.priority}`}>
            <Star />
            <span>{contact.priority}</span>
          </div>
        )}
      </div>

      {/* Système de phoning intégré */}
      {showPhoneSystem && contact.phone && (
        <div className="contact-phone-section">
          <PhoneSystem
            contact={contact}
            onCallStart={handleCallStart}
            onCallEnd={handleCallEnd}
          />
        </div>
      )}

      {/* Historique des appels */}
      {showCallHistory && (
        <div className="contact-history-section">
          <CallHistory
            contactId={contact.id}
            onCallInitiated={() => setIsPhoneActive(true)}
          />
        </div>
      )}
    </div>
  );
};

export default ContactCard;