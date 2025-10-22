/**
 * CALL HISTORY COMPONENT - Historique des appels pour un contact
 * Affiche les appels passés avec détails, possibilité de rappel et notes
 */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  MessageSquare,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import callsApi from '../../services/callsApi';
import ringoverService from '../../services/ringoverService';
import './CallHistory.css';

const CallHistory = ({ contactId, onCallInitiated }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showNoteEdit, setShowNoteEdit] = useState(null);
  const [editNote, setEditNote] = useState('');

  // Chargement de l'historique des appels
  useEffect(() => {
    loadCallHistory();
  }, [contactId]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let callHistory = [];

      if (contactId) {
        // Chargement pour un contact spécifique
        try {
          callHistory = await callsApi.getCallsByContact(contactId);
        } catch (apiError) {
          // Fallback vers localStorage
          callHistory = ringoverService.getCallHistoryLocally(contactId);
        }
      } else {
        // Chargement de tous les appels récents
        try {
          const response = await callsApi.getRecentCalls(50);
          callHistory = response.calls || response;
        } catch (apiError) {
          // Fallback vers localStorage
          callHistory = ringoverService.getCallHistoryLocally();
        }
      }

      // Tri par date décroissante
      callHistory.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

      setCalls(callHistory);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setError('Impossible de charger l\'historique des appels');
    } finally {
      setLoading(false);
    }
  };

  const handleCallAgain = async (call) => {
    try {
      if (onCallInitiated) {
        onCallInitiated();
      }

      await ringoverService.makeCall(call.phoneNumber, call.contactId);
    } catch (error) {
      console.error('Erreur rappel:', error);
      setError('Impossible d\'initier l\'appel');
    }
  };

  const handleUpdateNote = async (callId, newNote) => {
    try {
      await callsApi.updateNotes(callId, newNote);

      // Mise à jour locale
      setCalls(prevCalls =>
        prevCalls.map(call =>
          call.id === callId
            ? { ...call, notes: newNote }
            : call
        )
      );

      setShowNoteEdit(null);
      setEditNote('');
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      setError('Impossible de mettre à jour la note');
    }
  };

  const handleDeleteCall = async (callId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet appel ?')) {
      return;
    }

    try {
      await callsApi.deleteCall(callId);
      setCalls(prevCalls => prevCalls.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Erreur suppression appel:', error);
      setError('Impossible de supprimer l\'appel');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs}s`;
    }

    return `${mins}m ${secs}s`;
  };

  const getCallIcon = (status, type = 'outgoing') => {
    switch (status) {
      case 'connected':
      case 'ended':
        return type === 'incoming' ? <PhoneIncoming /> : <PhoneOutgoing />;
      case 'missed':
      case 'no-answer':
        return <PhoneMissed />;
      default:
        return <Phone />;
    }
  };

  const getCallStatusClass = (status) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return 'call-status-success';
      case 'missed':
      case 'no-answer':
        return 'call-status-missed';
      case 'busy':
        return 'call-status-busy';
      default:
        return 'call-status-unknown';
    }
  };

  const getCallStatusText = (status) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return 'Répondu';
      case 'missed':
        return 'Manqué';
      case 'no-answer':
        return 'Pas de réponse';
      case 'busy':
        return 'Occupé';
      default:
        return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div className="call-history-loading">
        <div className="call-history-spinner"></div>
        <span>Chargement de l'historique...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-history-error">
        <span>{error}</span>
        <button
          className="call-history-retry"
          onClick={loadCallHistory}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="call-history-empty">
        <Phone className="call-history-empty-icon" />
        <h3>Aucun appel</h3>
        <p>
          {contactId
            ? 'Aucun appel avec ce contact pour le moment'
            : 'Aucun appel récent'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="call-history">
      <div className="call-history-header">
        <h3>
          <Clock />
          {contactId ? 'Historique d\'appels' : 'Appels récents'}
        </h3>
        <span className="call-history-count">
          {calls.length} appel{calls.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="call-history-list">
        {calls.map((call) => (
          <div key={call.id} className="call-history-item">
            <div className="call-item-icon">
              <span className={`call-icon ${getCallStatusClass(call.status)}`}>
                {getCallIcon(call.status, call.type)}
              </span>
            </div>

            <div className="call-item-content">
              <div className="call-item-header">
                <div className="call-item-info">
                  <span className="call-item-number">{call.phoneNumber}</span>
                  <span className={`call-item-status ${getCallStatusClass(call.status)}`}>
                    {getCallStatusText(call.status)}
                  </span>
                </div>
                <div className="call-item-meta">
                  <span className="call-item-date">
                    <Calendar />
                    {formatDateTime(call.startedAt)}
                  </span>
                  <span className="call-item-duration">
                    <Clock />
                    {formatDuration(call.duration)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {(call.notes || showNoteEdit === call.id) && (
                <div className="call-item-notes">
                  {showNoteEdit === call.id ? (
                    <div className="call-note-edit">
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Ajouter une note..."
                        rows={2}
                      />
                      <div className="call-note-actions">
                        <button
                          className="call-note-save"
                          onClick={() => handleUpdateNote(call.id, editNote)}
                        >
                          Sauver
                        </button>
                        <button
                          className="call-note-cancel"
                          onClick={() => {
                            setShowNoteEdit(null);
                            setEditNote('');
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="call-note-display">
                      <MessageSquare />
                      <span>{call.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="call-item-actions">
              <button
                className="call-action-btn call-action-call"
                onClick={() => handleCallAgain(call)}
                title="Rappeler"
              >
                <PhoneCall />
              </button>

              <div className="call-action-menu">
                <button
                  className="call-action-btn call-action-more"
                  onClick={() => {
                    if (selectedCall === call.id) {
                      setSelectedCall(null);
                    } else {
                      setSelectedCall(call.id);
                    }
                  }}
                >
                  <MoreVertical />
                </button>

                {selectedCall === call.id && (
                  <div className="call-action-dropdown">
                    <button
                      onClick={() => {
                        setShowNoteEdit(call.id);
                        setEditNote(call.notes || '');
                        setSelectedCall(null);
                      }}
                    >
                      <Edit />
                      {call.notes ? 'Modifier la note' : 'Ajouter une note'}
                    </button>

                    {call.recordingUrl && (
                      <button
                        onClick={() => window.open(call.recordingUrl, '_blank')}
                      >
                        <Play />
                        Écouter l'enregistrement
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleDeleteCall(call.id);
                        setSelectedCall(null);
                      }}
                      className="call-action-delete"
                    >
                      <Trash2 />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {calls.length >= 50 && (
        <div className="call-history-footer">
          <button
            className="call-history-load-more"
            onClick={() => {
              // Logique pour charger plus d'appels
              console.log('Charger plus d\'appels');
            }}
          >
            Voir plus d'appels
          </button>
        </div>
      )}
    </div>
  );
};

export default CallHistory;