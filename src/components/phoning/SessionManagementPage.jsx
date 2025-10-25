import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Phone, Clock, Users, Target, CheckCircle,
  XCircle, Play, Pause, MessageSquare, TrendingUp,
  Calendar, PhoneCall, UserCheck
} from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import CallCommentModal from './CallCommentModal';
import '../../styles/Dashboard.css';

const SessionManagementPage = ({ session, onBack, onSessionUpdate }) => {
  const [sessionData, setSessionData] = useState(session);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [callToComment, setCallToComment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Recharger les données de la session périodiquement
    const interval = setInterval(() => {
      if (sessionData?._id) {
        loadSessionData();
      }
    }, 30000); // Refresh toutes les 30 secondes

    return () => clearInterval(interval);
  }, [sessionData?._id]);

  const loadSessionData = async () => {
    try {
      // Charger la session depuis localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');
      const updatedSession = allSessions.find(s => s._id === sessionData._id);

      if (updatedSession) {
        setSessionData(updatedSession);
        onSessionUpdate?.(updatedSession);
      }
    } catch (error) {
      console.error('Erreur lors du rechargement de la session:', error);
    }
  };

  const startCall = (contact) => {
    const callData = {
      contactId: contact.contactId._id,
      contactName: contact.contactId.name,
      phoneNumber: contact.contactId.phone || 'Non renseigné',
      startTime: new Date(),
      status: 'calling'
    };

    setActiveCall(callData);
    setSelectedContact(contact);
  };

  const endCall = (status, duration = 0) => {
    if (!activeCall) return;

    const callEndData = {
      ...activeCall,
      endTime: new Date(),
      duration,
      status
    };

    setCallToComment(callEndData);
    setShowCommentModal(true);
  };

  const saveCallWithComment = async (callData, comments, outcome, journalistFeedback = {}) => {
    try {
      setLoading(true);

      const finalCallData = {
        ...callData,
        comments,
        outcome,
        journalistFeedback,
        id: Date.now().toString(), // Générer un ID unique pour l'appel
        recordedAt: new Date().toISOString()
      };

      // Charger toutes les sessions depuis localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');
      const sessionIndex = allSessions.findIndex(s => s._id === sessionData._id);

      if (sessionIndex === -1) {
        throw new Error('Session non trouvée');
      }

      // Ajouter l'appel à la session
      const updatedSession = { ...allSessions[sessionIndex] };
      if (!updatedSession.callLogs) {
        updatedSession.callLogs = [];
      }
      updatedSession.callLogs.push(finalCallData);

      // Mettre à jour les statistiques de la session
      const answeredCall = finalCallData.status === 'answered';
      updatedSession.stats = {
        ...updatedSession.stats,
        totalCalls: (updatedSession.stats?.totalCalls || 0) + 1,
        answeredCalls: (updatedSession.stats?.answeredCalls || 0) + (answeredCall ? 1 : 0),
        totalDuration: (updatedSession.stats?.totalDuration || 0) + (finalCallData.duration || 0)
      };

      // Calculer le taux de succès
      if (updatedSession.stats.totalCalls > 0) {
        updatedSession.successRate = Math.round((updatedSession.stats.answeredCalls / updatedSession.stats.totalCalls) * 100);
      }

      // Marquer le contact comme appelé
      if (updatedSession.targetContacts) {
        updatedSession.targetContacts = updatedSession.targetContacts.map(tc => {
          if (tc.contactId._id === finalCallData.contactId || tc.contactId === finalCallData.contactId) {
            return { ...tc, status: 'called', lastCallAt: new Date().toISOString() };
          }
          return tc;
        });
      }

      // Sauvegarder dans la liste générale des sessions
      allSessions[sessionIndex] = updatedSession;
      localStorage.setItem('presspilot-all-sessions', JSON.stringify(allSessions));

      // Sauvegarder aussi dans les sessions du projet spécifique
      if (updatedSession.projectId) {
        const projectSessions = JSON.parse(localStorage.getItem(`presspilot-sessions-${updatedSession.projectId}`) || '[]');
        const projectSessionIndex = projectSessions.findIndex(s => s._id === sessionData._id);
        if (projectSessionIndex !== -1) {
          projectSessions[projectSessionIndex] = updatedSession;
          localStorage.setItem(`presspilot-sessions-${updatedSession.projectId}`, JSON.stringify(projectSessions));
        }
      }

      setSessionData(updatedSession);
      onSessionUpdate?.(updatedSession);

      // Reset des états
      setActiveCall(null);
      setSelectedContact(null);
      setCallToComment(null);
      setShowCommentModal(false);

      // Notification de succès
      alert('Appel enregistré avec succès !');

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'appel:', error);
      alert('Erreur lors de l\'enregistrement de l\'appel');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'answered': <CheckCircle className="status-icon success" />,
      'no-answer': <XCircle className="status-icon warning" />,
      'busy': <Clock className="status-icon error" />,
      'voicemail': <MessageSquare className="status-icon info" />,
      'failed': <XCircle className="status-icon error" />
    };
    return icons[status] || <Phone className="status-icon" />;
  };

  const getOutcomeColor = (outcome) => {
    const colors = {
      'interested': '#10B981',
      'not_interested': '#EF4444',
      'callback_requested': '#F59E0B',
      'follow_up_email': '#3B82F6',
      'no_response': '#6B7280',
      'wrong_person': '#9CA3AF'
    };
    return colors[outcome] || '#6B7280';
  };

  const getOutcomeLabel = (outcome) => {
    const labels = {
      'interested': 'Intéressé',
      'not_interested': 'Pas intéressé',
      'callback_requested': 'Rappel demandé',
      'follow_up_email': 'Email de suivi',
      'no_response': 'Aucune réponse',
      'wrong_person': 'Mauvaise personne'
    };
    return labels[outcome] || outcome;
  };

  const completeSession = async () => {
    const confirm = window.confirm(
      'Êtes-vous sûr de vouloir marquer cette session comme terminée ? Cette action est irréversible.'
    );

    if (!confirm) return;

    try {
      setLoading(true);

      // Charger toutes les sessions depuis localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');
      const sessionIndex = allSessions.findIndex(s => s._id === sessionData._id);

      if (sessionIndex === -1) {
        throw new Error('Session non trouvée');
      }

      // Marquer la session comme terminée
      const updatedSession = {
        ...allSessions[sessionIndex],
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      // Sauvegarder dans la liste générale des sessions
      allSessions[sessionIndex] = updatedSession;
      localStorage.setItem('presspilot-all-sessions', JSON.stringify(allSessions));

      // Sauvegarder aussi dans les sessions du projet spécifique
      if (updatedSession.projectId) {
        const projectSessions = JSON.parse(localStorage.getItem(`presspilot-sessions-${updatedSession.projectId}`) || '[]');
        const projectSessionIndex = projectSessions.findIndex(s => s._id === sessionData._id);
        if (projectSessionIndex !== -1) {
          projectSessions[projectSessionIndex] = updatedSession;
          localStorage.setItem(`presspilot-sessions-${updatedSession.projectId}`, JSON.stringify(projectSessions));
        }
      }

      setSessionData(updatedSession);
      onSessionUpdate?.(updatedSession);

      alert('Session terminée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la finalisation de la session:', error);
      alert('Erreur lors de la finalisation de la session');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionData) {
    return (
      <div className="phoning-workflow-step">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingContacts = sessionData.targetContacts?.filter(tc => tc.status === 'pending') || [];
  const calledContacts = sessionData.targetContacts?.filter(tc => tc.status === 'called') || [];

  return (
    <div className="phoning-workflow-step">
      <div className="step-header">
        <div>
          <button className="btn-icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="step-title-section">
            <h2>{sessionData.sessionName}</h2>
            <p className="step-description">
              Session pour <strong>{sessionData.projectName}</strong> de <strong>{sessionData.artistName}</strong>
            </p>
          </div>
        </div>
        <div className="session-actions">
          {sessionData.status === 'active' && (
            <button className="btn-warning" onClick={completeSession} disabled={loading}>
              Terminer la session
            </button>
          )}
          <span className={`session-status status-${sessionData.status}`}>
            {sessionData.status === 'active' ? 'En cours' :
             sessionData.status === 'completed' ? 'Terminée' :
             sessionData.status === 'paused' ? 'En pause' : sessionData.status}
          </span>
        </div>
      </div>

      <div className="session-stats-overview">
        <div className="stat-card">
          <Phone className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{sessionData.stats?.totalCalls || 0}</span>
            <span className="stat-label">Appels passés</span>
          </div>
        </div>

        <div className="stat-card">
          <CheckCircle className="stat-icon success" />
          <div className="stat-content">
            <span className="stat-value">{sessionData.stats?.answeredCalls || 0}</span>
            <span className="stat-label">Décrochés</span>
          </div>
        </div>

        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{sessionData.successRate || 0}%</span>
            <span className="stat-label">Taux de succès</span>
          </div>
        </div>

        <div className="stat-card">
          <Clock className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatDuration(sessionData.stats?.totalDuration || 0)}</span>
            <span className="stat-label">Durée totale</span>
          </div>
        </div>

        <div className="stat-card">
          <Users className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{pendingContacts.length}</span>
            <span className="stat-label">Contacts restants</span>
          </div>
        </div>
      </div>

      <div className="session-management-content">
        {/* Section contacts à appeler */}
        <div className="contacts-to-call-section">
          <h3>Contacts à appeler ({pendingContacts.length})</h3>

          {activeCall && (
            <div className="active-call-widget">
              <div className="call-status">
                <div className="call-animation">
                  <Phone className="phone-icon" />
                </div>
                <div className="call-info">
                  <h4>Appel en cours</h4>
                  <p>{activeCall.contactName}</p>
                  <p>{activeCall.phoneNumber}</p>
                </div>
              </div>

              <div className="call-controls">
                <button
                  className="btn-success"
                  onClick={() => endCall('answered', Math.floor((new Date() - new Date(activeCall.startTime)) / 1000))}
                >
                  Répondu
                </button>
                <button
                  className="btn-warning"
                  onClick={() => endCall('no-answer')}
                >
                  Pas de réponse
                </button>
                <button
                  className="btn-info"
                  onClick={() => endCall('busy')}
                >
                  Occupé
                </button>
                <button
                  className="btn-error"
                  onClick={() => endCall('voicemail')}
                >
                  Messagerie
                </button>
              </div>
            </div>
          )}

          <div className="pending-contacts-list">
            {pendingContacts.map((contact, index) => (
              <div key={contact.contactId._id} className="contact-call-item">
                <div className="contact-info">
                  <div className="contact-avatar">
                    {contact.contactId.name.charAt(0)}
                  </div>
                  <div className="contact-details">
                    <h4>{contact.contactId.name}</h4>
                    <p>{contact.contactId.journalism?.mediaName || contact.contactId.company}</p>
                    <p className="contact-phone">{contact.contactId.phone || 'Téléphone non renseigné'}</p>
                    <span className={`priority-badge priority-${contact.priority}`}>
                      {contact.priority === 'high' ? 'Haute priorité' :
                       contact.priority === 'medium' ? 'Priorité moyenne' :
                       'Priorité basse'}
                    </span>
                  </div>
                </div>

                {contact.notes && (
                  <div className="contact-notes">
                    <strong>Notes :</strong> {contact.notes}
                  </div>
                )}

                <div className="contact-actions">
                  <button
                    className="btn-primary call-btn"
                    onClick={() => startCall(contact)}
                    disabled={!!activeCall || !contact.contactId.phone}
                  >
                    <Phone size={16} />
                    Appeler
                  </button>
                </div>
              </div>
            ))}

            {pendingContacts.length === 0 && (
              <div className="no-contacts">
                <UserCheck size={48} className="empty-icon" />
                <p>Tous les contacts ont été appelés !</p>
              </div>
            )}
          </div>
        </div>

        {/* Section historique des appels */}
        <div className="call-history-section">
          <h3>Historique des appels ({sessionData.callLogs?.length || 0})</h3>

          <div className="call-logs-list">
            {sessionData.callLogs?.map((call, index) => (
              <div key={index} className="call-log-item">
                <div className="call-log-header">
                  <div className="call-contact-info">
                    {getStatusIcon(call.status)}
                    <div>
                      <h4>{call.contactName}</h4>
                      <p>{call.contactId?.journalism?.mediaName || 'Media non renseigné'}</p>
                    </div>
                  </div>
                  <div className="call-log-meta">
                    <span className="call-time">
                      {new Date(call.startTime).toLocaleString('fr-FR')}
                    </span>
                    {call.duration > 0 && (
                      <span className="call-duration">
                        {formatDuration(call.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {call.outcome && (
                  <div className="call-outcome">
                    <span
                      className="outcome-badge"
                      style={{ backgroundColor: getOutcomeColor(call.outcome) }}
                    >
                      {getOutcomeLabel(call.outcome)}
                    </span>
                  </div>
                )}

                <div className="call-comments">
                  <strong>Commentaires :</strong>
                  <p>{call.comments}</p>
                </div>

                {call.journalistFeedback && Object.keys(call.journalistFeedback).some(key => call.journalistFeedback[key]) && (
                  <div className="journalist-feedback">
                    <strong>Feedback journaliste :</strong>
                    {call.journalistFeedback.mediaInterest && (
                      <p><strong>Intérêt :</strong> {call.journalistFeedback.mediaInterest}</p>
                    )}
                    {call.journalistFeedback.preferredFormat && (
                      <p><strong>Format préféré :</strong> {call.journalistFeedback.preferredFormat}</p>
                    )}
                    {call.journalistFeedback.deadline && (
                      <p><strong>Deadline :</strong> {new Date(call.journalistFeedback.deadline).toLocaleDateString('fr-FR')}</p>
                    )}
                    {call.journalistFeedback.additionalRequests && (
                      <p><strong>Demandes :</strong> {call.journalistFeedback.additionalRequests}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {(!sessionData.callLogs || sessionData.callLogs.length === 0) && (
              <div className="no-calls">
                <PhoneCall size={48} className="empty-icon" />
                <p>Aucun appel passé pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de commentaire obligatoire */}
      {showCommentModal && callToComment && (
        <CallCommentModal
          callData={callToComment}
          onSave={saveCallWithComment}
          onCancel={() => {
            setShowCommentModal(false);
            setCallToComment(null);
            setActiveCall(null);
          }}
        />
      )}

      <div className="workflow-info">
        <div className="workflow-steps">
          <div className="step completed">1. Artiste: {sessionData.artistName}</div>
          <div className="step completed">2. Projet: {sessionData.projectName}</div>
          <div className="step completed">3. Session créée</div>
          <div className="step active">4. Appels en cours</div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagementPage;