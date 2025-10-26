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
      alert('Appel enregistre avec succes !');

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
      'interested': 'Interesse',
      'not_interested': 'Pas interesse',
      'callback_requested': 'Rappel demande',
      'follow_up_email': 'Email de suivi',
      'no_response': 'Aucune reponse',
      'wrong_person': 'Mauvaise personne'
    };
    return labels[outcome] || outcome;
  };

  const completeSession = async () => {
    const confirm = window.confirm(
      'Etes-vous sur de vouloir marquer cette session comme terminee ? Cette action est irreversible.'
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

      alert('Session terminee avec succes !');
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
        <div className="session-actions" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {sessionData.status === 'active' && (
            <button
              className="btn-warning"
              onClick={completeSession}
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Terminer la session
            </button>
          )}
          <span className={`session-status status-${sessionData.status}`} style={{
            background: sessionData.status === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                       sessionData.status === 'completed' ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' :
                       sessionData.status === 'paused' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                       '#6b7280',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: sessionData.status === 'active' ? '0 4px 12px rgba(16, 185, 129, 0.3)' :
                      sessionData.status === 'completed' ? '0 4px 12px rgba(107, 114, 128, 0.3)' :
                      sessionData.status === 'paused' ? '0 4px 12px rgba(245, 158, 11, 0.3)' :
                      '0 4px 12px rgba(107, 114, 128, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {sessionData.status === 'active' && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.8)',
                animation: 'pulse 2s infinite'
              }}></div>
            )}
            {sessionData.status === 'active' ? 'En cours' :
             sessionData.status === 'completed' ? 'Terminee' :
             sessionData.status === 'paused' ? 'En pause' : sessionData.status}
          </span>
        </div>
      </div>

      <div className="session-stats-overview" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        margin: '24px 0',
        padding: '0 20px'
      }}>
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
        }}>
          <Phone className="stat-icon" size={32} />
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
              {sessionData.stats?.totalCalls || 0}
            </span>
            <span className="stat-label" style={{ fontSize: '14px', opacity: 0.9 }}>Appels passes</span>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
        }}>
          <CheckCircle className="stat-icon success" size={32} />
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
              {sessionData.stats?.answeredCalls || 0}
            </span>
            <span className="stat-label" style={{ fontSize: '14px', opacity: 0.9 }}>Decroches</span>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          color: '#8B4513',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(252, 182, 159, 0.3)'
        }}>
          <TrendingUp className="stat-icon" size={32} />
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
              {sessionData.successRate || 0}%
            </span>
            <span className="stat-label" style={{ fontSize: '14px', opacity: 0.8 }}>Taux de succes</span>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          color: '#4a5568',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(168, 237, 234, 0.3)'
        }}>
          <Clock className="stat-icon" size={32} />
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
              {formatDuration(sessionData.stats?.totalDuration || 0)}
            </span>
            <span className="stat-label" style={{ fontSize: '14px', opacity: 0.8 }}>Duree totale</span>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          color: '#4a5568',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(255, 154, 158, 0.3)'
        }}>
          <Users className="stat-icon" size={32} />
          <div className="stat-content">
            <span className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
              {pendingContacts.length}
            </span>
            <span className="stat-label" style={{ fontSize: '14px', opacity: 0.8 }}>Contacts restants</span>
          </div>
        </div>
      </div>

      <div className="session-management-content" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
        gap: '32px',
        padding: '0 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Section contacts à appeler */}
        <div className="contacts-to-call-section" style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Users size={24} color="#667eea" />
            Contacts a appeler ({pendingContacts.length})
          </h3>

          {activeCall && (
            <div className="active-call-widget" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              <div className="call-status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div className="call-animation" style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s infinite'
                }}>
                  <Phone className="phone-icon" size={24} />
                </div>
                <div className="call-info">
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    Appel en cours
                  </h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.9 }}>
                    {activeCall.contactName}
                  </p>
                  <p style={{ margin: '0', fontSize: '13px', opacity: 0.8 }}>
                    {activeCall.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="call-controls" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                <button
                  className="btn-success"
                  onClick={() => endCall('answered', Math.floor((new Date() - new Date(activeCall.startTime)) / 1000))}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Repondu
                </button>
                <button
                  className="btn-warning"
                  onClick={() => endCall('no-answer')}
                  style={{
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Pas de reponse
                </button>
                <button
                  className="btn-info"
                  onClick={() => endCall('busy')}
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Occupe
                </button>
                <button
                  className="btn-error"
                  onClick={() => endCall('voicemail')}
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Messagerie
                </button>
              </div>
            </div>
          )}

          <div className="pending-contacts-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {pendingContacts.map((contact, index) => (
              <div key={contact.contactId._id} className="contact-call-item" style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="contact-info" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1
                }}>
                  <div className="contact-avatar" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    {contact.contactId.name.charAt(0)}
                  </div>
                  <div className="contact-details" style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {contact.contactId.name}
                    </h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
                      {contact.contactId.journalism?.mediaName || contact.contactId.company}
                    </p>
                    <p className="contact-phone" style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af' }}>
                      {contact.contactId.phone || 'Telephone non renseigne'}
                    </p>
                    <span className={`priority-badge priority-${contact.priority}`} style={{
                      background: contact.priority === 'high' ? '#fef2f2' :
                                  contact.priority === 'medium' ? '#fef3c7' : '#f0fdf4',
                      color: contact.priority === 'high' ? '#dc2626' :
                             contact.priority === 'medium' ? '#d97706' : '#16a34a',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {contact.priority === 'high' ? 'Haute priorite' :
                       contact.priority === 'medium' ? 'Priorite moyenne' :
                       'Priorite basse'}
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
                    style={{
                      background: activeCall || !contact.contactId.phone ? '#9ca3af' :
                                 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: activeCall || !contact.contactId.phone ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      minWidth: '100px'
                    }}
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
                <p>Tous les contacts ont ete appeles !</p>
              </div>
            )}
          </div>
        </div>

        {/* Section historique des appels */}
        <div className="call-history-section" style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <PhoneCall size={24} color="#667eea" />
            Historique des appels ({sessionData.callLogs?.length || 0})
          </h3>

          <div className="call-logs-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {sessionData.callLogs?.map((call, index) => (
              <div key={index} className="call-log-item" style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s'
              }}>
                <div className="call-log-header">
                  <div className="call-contact-info">
                    {getStatusIcon(call.status)}
                    <div>
                      <h4>{call.contactName}</h4>
                      <p>{call.contactId?.journalism?.mediaName || 'Media non renseigne'}</p>
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
                      <p><strong>Interet :</strong> {call.journalistFeedback.mediaInterest}</p>
                    )}
                    {call.journalistFeedback.preferredFormat && (
                      <p><strong>Format prefere :</strong> {call.journalistFeedback.preferredFormat}</p>
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
                <p>Aucun appel passe pour le moment</p>
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
          <div className="step completed">3. Session creee</div>
          <div className="step active">4. Appels en cours</div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagementPage;