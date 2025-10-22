/**
 * CALL MODAL COMPONENT - Modal durant l'appel actif
 * Interface minimaliste et efficace pour les appels en cours
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneOff, Pause, Play, Mic, MicOff, Minimize2, Maximize2 } from 'lucide-react';
import ringoverService from '../../services/ringoverService';
import './CallModal.css';

const CallModal = ({ isOpen, call, onClose, onMinimize, isMinimized = false }) => {
  const [callTimer, setCallTimer] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callState, setCallState] = useState('connecting');

  const modalRef = useRef(null);
  const notesRef = useRef(null);

  // Mise à jour du timer et des informations d'appel
  useEffect(() => {
    if (call) {
      setCallTimer(call.duration || 0);
      setCallNotes(call.notes || '');
      setCallState(call.status || 'connecting');
    }
  }, [call]);

  // Listeners pour les événements d'appel
  useEffect(() => {
    const handleCallConnected = (updatedCall) => {
      setCallState('connected');
    };

    const handleCallEnded = (endedCall) => {
      setCallState('ended');
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    const handleCallStatusChanged = (updatedCall) => {
      setCallState(updatedCall.status);
    };

    const handleDurationUpdated = (updatedCall) => {
      setCallTimer(updatedCall.duration);
    };

    const handleCallError = (error) => {
      console.error('Erreur appel modal:', error);
    };

    ringoverService.on('callConnected', handleCallConnected);
    ringoverService.on('callEnded', handleCallEnded);
    ringoverService.on('callStatusChanged', handleCallStatusChanged);
    ringoverService.on('callDurationUpdated', handleDurationUpdated);
    ringoverService.on('callError', handleCallError);

    return () => {
      ringoverService.off('callConnected', handleCallConnected);
      ringoverService.off('callEnded', handleCallEnded);
      ringoverService.off('callStatusChanged', handleCallStatusChanged);
      ringoverService.off('callDurationUpdated', handleDurationUpdated);
      ringoverService.off('callError', handleCallError);
    };
  }, [onClose]);

  // Mise à jour des notes en temps réel
  useEffect(() => {
    if (call && callNotes !== call.notes) {
      ringoverService.updateCallNotes(callNotes);
    }
  }, [callNotes, call]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (isMinimized) {
            onMinimize(false);
          } else {
            onClose();
          }
          break;
        case ' ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleTogglePause();
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleToggleMute();
          }
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleEndCall();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, onClose, onMinimize]);

  const handleEndCall = async () => {
    try {
      await ringoverService.endCall();
    } catch (error) {
      console.error('Erreur fin d\'appel:', error);
    }
  };

  const handleTogglePause = async () => {
    try {
      await ringoverService.togglePause();
    } catch (error) {
      console.error('Erreur pause:', error);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Intégration WebRTC pour mute/unmute
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'connecting':
        return 'Connexion...';
      case 'connected':
        return 'En ligne';
      case 'paused':
        return 'En pause';
      case 'ended':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusClass = () => {
    switch (callState) {
      case 'connecting':
        return 'call-status-connecting';
      case 'connected':
        return 'call-status-connected';
      case 'paused':
        return 'call-status-paused';
      case 'ended':
        return 'call-status-ended';
      default:
        return '';
    }
  };

  if (!isOpen || !call) {
    return null;
  }

  // Version minimisée (coin de l'écran)
  if (isMinimized) {
    return (
      <div className="call-modal-minimized">
        <div className="call-mini-header" onClick={() => onMinimize(false)}>
          <div className={`call-mini-status ${getStatusClass()}`}></div>
          <span className="call-mini-timer">{formatTime(callTimer)}</span>
          <Maximize2 className="call-mini-expand" />
        </div>
        <div className="call-mini-controls">
          <button
            className="call-mini-btn call-mini-btn-end"
            onClick={handleEndCall}
            title="Raccrocher"
          >
            <PhoneOff />
          </button>
        </div>
      </div>
    );
  }

  // Version complète
  return (
    <div className="call-modal-overlay">
      <div className={`call-modal ${getStatusClass()}`} ref={modalRef}>
        {/* Header */}
        <div className="call-modal-header">
          <div className="call-modal-status">
            <div className={`call-status-indicator ${getStatusClass()}`}></div>
            <span className="call-status-text">{getStatusText()}</span>
          </div>

          <div className="call-modal-timer">
            {formatTime(callTimer)}
          </div>

          <div className="call-modal-header-actions">
            <button
              className="call-modal-btn call-modal-btn-minimize"
              onClick={() => onMinimize(true)}
              title="Réduire (Esc)"
            >
              <Minimize2 />
            </button>
            <button
              className="call-modal-btn call-modal-btn-close"
              onClick={onClose}
              title="Fermer"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="call-modal-contact">
          <div className="call-contact-avatar">
            {call.contact?.avatar ? (
              <img src={call.contact.avatar} alt={call.contact.name} />
            ) : (
              <div className="call-contact-placeholder">
                <Phone />
              </div>
            )}
          </div>
          <div className="call-contact-info">
            <h3 className="call-contact-name">
              {call.contact?.name || 'Contact inconnu'}
            </h3>
            <span className="call-contact-number">{call.phoneNumber}</span>
            {call.contact?.company && (
              <span className="call-contact-company">{call.contact.company}</span>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="call-modal-controls">
          <button
            className={`call-control-btn call-control-mute ${isMuted ? 'active' : ''}`}
            onClick={handleToggleMute}
            title={`${isMuted ? 'Activer' : 'Couper'} le micro (Ctrl+M)`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          <button
            className="call-control-btn call-control-pause"
            onClick={handleTogglePause}
            disabled={callState === 'connecting'}
            title={`${callState === 'paused' ? 'Reprendre' : 'Pause'} (Ctrl+Space)`}
          >
            {callState === 'paused' ? <Play /> : <Pause />}
          </button>

          <button
            className="call-control-btn call-control-end"
            onClick={handleEndCall}
            title="Raccrocher (Ctrl+Enter)"
          >
            <PhoneOff />
          </button>
        </div>

        {/* Notes Section */}
        {['connected', 'paused'].includes(callState) && (
          <div className="call-modal-notes">
            <label htmlFor="modal-call-notes" className="call-notes-label">
              Notes d'appel
            </label>
            <textarea
              id="modal-call-notes"
              ref={notesRef}
              className="call-notes-textarea"
              placeholder="Tapez vos notes ici..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Shortcuts Helper */}
        <div className="call-modal-shortcuts">
          <span>Raccourcis:</span>
          <span>Ctrl+M (Mute)</span>
          <span>Ctrl+Space (Pause)</span>
          <span>Ctrl+Enter (Raccrocher)</span>
          <span>Esc (Réduire)</span>
        </div>

        {/* Call End Summary */}
        {callState === 'ended' && (
          <div className="call-end-summary">
            <h4>Appel terminé</h4>
            <p>Durée: {formatTime(callTimer)}</p>
            <p>Sauvegarde automatique en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallModal;