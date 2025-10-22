/**
 * PHONE SYSTEM COMPONENT - Interface principale d'appel Ringover
 * Gère l'initiation d'appels, timer, et prise de notes en temps réel
 */

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Pause, Play, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ringoverService from '../../services/ringoverService';
import './PhoneSystem.css';

const PhoneSystem = ({ contact, onCallEnd, onCallStart }) => {
  const [callState, setCallState] = useState('idle'); // idle, connecting, connected, paused, ended
  const [currentCall, setCurrentCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const timerRef = useRef(null);
  const notesRef = useRef(null);

  // Initialisation du service Ringover
  useEffect(() => {
    const initializeService = async () => {
      setIsInitializing(true);
      const success = await ringoverService.initialize();
      if (!success) {
        setError('Impossible d\'initialiser le système d\'appel');
      }
      setIsInitializing(false);
    };

    if (!ringoverService.isInitialized) {
      initializeService();
    }

    // Listeners pour les événements d'appel
    const handleCallStarted = (call) => {
      setCurrentCall(call);
      setCallState('connecting');
      setCallTimer(0);
      setCallNotes('');
      setError(null);
      onCallStart?.(call);
    };

    const handleCallConnected = (call) => {
      setCurrentCall(call);
      setCallState('connected');
      startTimer();
    };

    const handleCallEnded = (call) => {
      setCurrentCall(call);
      setCallState('ended');
      stopTimer();
      onCallEnd?.(call);

      // Reset après 3 secondes
      setTimeout(() => {
        setCallState('idle');
        setCurrentCall(null);
        setCallTimer(0);
        setCallNotes('');
      }, 3000);
    };

    const handleCallError = (error) => {
      setError(error.message || 'Erreur lors de l\'appel');
      setCallState('idle');
      stopTimer();
    };

    const handleDurationUpdated = (call) => {
      setCallTimer(call.duration);
    };

    // Enregistrement des listeners
    ringoverService.on('callStarted', handleCallStarted);
    ringoverService.on('callConnected', handleCallConnected);
    ringoverService.on('callEnded', handleCallEnded);
    ringoverService.on('callError', handleCallError);
    ringoverService.on('callDurationUpdated', handleDurationUpdated);

    return () => {
      // Nettoyage des listeners
      ringoverService.off('callStarted', handleCallStarted);
      ringoverService.off('callConnected', handleCallConnected);
      ringoverService.off('callEnded', handleCallEnded);
      ringoverService.off('callError', handleCallError);
      ringoverService.off('callDurationUpdated', handleDurationUpdated);
      stopTimer();
    };
  }, [onCallStart, onCallEnd]);

  // Mise à jour des notes en temps réel
  useEffect(() => {
    if (currentCall && callNotes !== currentCall.notes) {
      ringoverService.updateCallNotes(callNotes);
    }
  }, [callNotes, currentCall]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMakeCall = async () => {
    if (!contact?.phone) {
      setError('Numéro de téléphone manquant');
      return;
    }

    try {
      setError(null);
      await ringoverService.makeCall(contact.phone, contact.id);
    } catch (error) {
      setError('Impossible d\'initier l\'appel');
    }
  };

  const handleEndCall = async () => {
    try {
      await ringoverService.endCall();
    } catch (error) {
      setError('Erreur lors de la fin d\'appel');
    }
  };

  const handleTogglePause = async () => {
    try {
      await ringoverService.togglePause();
      setCallState(prev => prev === 'connected' ? 'paused' : 'connected');
    } catch (error) {
      setError('Erreur lors de la pause');
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Ici, intégration avec WebRTC pour muter/unmute
  };

  const handleToggleVolume = () => {
    setIsVolumeOn(!isVolumeOn);
    // Ici, intégration avec WebRTC pour volume
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusText = () => {
    switch (callState) {
      case 'connecting':
        return 'Connexion en cours...';
      case 'connected':
        return 'En ligne';
      case 'paused':
        return 'En pause';
      case 'ended':
        return 'Appel terminé';
      default:
        return 'Prêt à appeler';
    }
  };

  const getCallStatusClass = () => {
    switch (callState) {
      case 'connecting':
        return 'phone-status-connecting';
      case 'connected':
        return 'phone-status-connected';
      case 'paused':
        return 'phone-status-paused';
      case 'ended':
        return 'phone-status-ended';
      default:
        return 'phone-status-idle';
    }
  };

  if (isInitializing) {
    return (
      <div className="phone-system phone-system-loading">
        <div className="phone-loading">
          <Phone className="phone-loading-icon" />
          <span>Initialisation du système d'appel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`phone-system ${callState !== 'idle' ? 'phone-system-active' : ''}`}>
      {/* Header avec statut */}
      <div className="phone-header">
        <div className="phone-status">
          <div className={`phone-status-indicator ${getCallStatusClass()}`}></div>
          <span className="phone-status-text">{getCallStatusText()}</span>
        </div>
        {callState !== 'idle' && (
          <div className="phone-timer">
            {formatTime(callTimer)}
          </div>
        )}
      </div>

      {/* Informations contact */}
      {contact && (
        <div className="phone-contact-info">
          <div className="phone-contact-avatar">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} />
            ) : (
              <div className="phone-contact-placeholder">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="phone-contact-details">
            <h3 className="phone-contact-name">{contact.name || 'Contact inconnu'}</h3>
            <span className="phone-contact-number">{contact.phone}</span>
            {contact.company && (
              <span className="phone-contact-company">{contact.company}</span>
            )}
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="phone-error">
          <span>{error}</span>
        </div>
      )}

      {/* Contrôles d'appel */}
      <div className="phone-controls">
        {callState === 'idle' && (
          <button
            className="phone-btn phone-btn-call"
            onClick={handleMakeCall}
            disabled={!contact?.phone || isInitializing}
          >
            <PhoneCall />
            <span>Appeler</span>
          </button>
        )}

        {['connecting', 'connected', 'paused'].includes(callState) && (
          <>
            <div className="phone-call-controls">
              <button
                className={`phone-btn phone-btn-mute ${isMuted ? 'active' : ''}`}
                onClick={handleToggleMute}
                title={isMuted ? 'Activer le micro' : 'Couper le micro'}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </button>

              <button
                className="phone-btn phone-btn-pause"
                onClick={handleTogglePause}
                disabled={callState === 'connecting'}
                title={callState === 'paused' ? 'Reprendre' : 'Pause'}
              >
                {callState === 'paused' ? <Play /> : <Pause />}
              </button>

              <button
                className={`phone-btn phone-btn-volume ${!isVolumeOn ? 'active' : ''}`}
                onClick={handleToggleVolume}
                title={isVolumeOn ? 'Couper le son' : 'Activer le son'}
              >
                {isVolumeOn ? <Volume2 /> : <VolumeX />}
              </button>
            </div>

            <button
              className="phone-btn phone-btn-end"
              onClick={handleEndCall}
            >
              <PhoneOff />
              <span>Raccrocher</span>
            </button>
          </>
        )}
      </div>

      {/* Zone de notes pendant l'appel */}
      {['connected', 'paused'].includes(callState) && (
        <div className="phone-notes">
          <label htmlFor="call-notes" className="phone-notes-label">
            Notes d'appel
          </label>
          <textarea
            id="call-notes"
            ref={notesRef}
            className="phone-notes-textarea"
            placeholder="Prenez des notes pendant l'appel..."
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={4}
          />
          <div className="phone-notes-hint">
            Les notes sont sauvegardées automatiquement
          </div>
        </div>
      )}

      {/* Résumé après appel */}
      {callState === 'ended' && currentCall && (
        <div className="phone-call-summary">
          <h4>Appel terminé</h4>
          <div className="phone-summary-details">
            <span>Durée: {formatTime(currentCall.duration)}</span>
            {currentCall.notes && (
              <div className="phone-summary-notes">
                <strong>Notes:</strong>
                <p>{currentCall.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneSystem;