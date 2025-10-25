import React, { useState, useEffect } from 'react';
import { Phone, Clock, Users, TrendingUp, ArrowRight, Calendar, Target } from 'lucide-react';
import Layout from '../components/Layout';
import '../styles/Dashboard.css';
import ArtistSelectionPage from '../components/phoning/ArtistSelectionPage';
import ProjectSelectionPage from '../components/phoning/ProjectSelectionPage';
import SessionCreationPage from '../components/phoning/SessionCreationPage';
import SessionManagementPage from '../components/phoning/SessionManagementPage';
import LoadingSpinner from '../components/LoadingSpinner';

const Phoning = () => {
  // Workflow state management
  const [currentStep, setCurrentStep] = useState('dashboard'); // dashboard, artist-selection, project-selection, session-creation, session-management
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  // Dashboard data
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [callStats, setCallStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalCalls: 0,
    answeredCalls: 0,
    totalDuration: 0,
    avgSuccessRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger toutes les sessions depuis localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');

      // Filtrer les sessions actives
      const activeSessions = allSessions.filter(session => session.status === 'active').slice(0, 10);
      setActiveSessions(activeSessions);

      // Sessions récentes (5 dernières par date de création)
      const recentSessions = allSessions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentSessions(recentSessions);

      // Calculer les statistiques
      const stats = {
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        totalCalls: allSessions.reduce((sum, session) => sum + (session.stats?.totalCalls || 0), 0),
        answeredCalls: allSessions.reduce((sum, session) => sum + (session.stats?.answeredCalls || 0), 0),
        totalDuration: allSessions.reduce((sum, session) => sum + (session.stats?.duration || 0), 0),
        avgSuccessRate: allSessions.length > 0 ?
          allSessions.reduce((sum, session) => {
            const rate = session.stats?.totalCalls > 0 ?
              (session.stats.answeredCalls / session.stats.totalCalls) : 0;
            return sum + rate;
          }, 0) / allSessions.length : 0
      };

      setCallStats(stats);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Workflow navigation functions
  const startNewSession = () => {
    setCurrentStep('artist-selection');
    setSelectedArtist(null);
    setSelectedProject(null);
    setCurrentSession(null);
  };

  const handleArtistSelected = (artist) => {
    setSelectedArtist(artist);
    setCurrentStep('project-selection');
  };

  const handleProjectSelected = (project) => {
    setSelectedProject(project);
    setCurrentStep('session-creation');
  };

  const handleSessionCreated = async (sessionData) => {
    try {
      // Enrichir les données de session avec les informations du projet et de l'artiste
      const enrichedSessionData = {
        ...sessionData,
        artistId: selectedArtist.id,
        artistName: selectedArtist.name,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        projectGenre: selectedProject.genre,
        status: 'active',
        createdAt: new Date().toISOString(),
        stats: {
          totalCalls: 0,
          answeredCalls: 0,
          voicemails: 0,
          noAnswers: 0,
          duration: 0
        },
        calls: []
      };

      // Stocker la session dans localStorage avec liaison au projet
      const sessionId = Date.now().toString();
      const sessionWithId = {
        ...enrichedSessionData,
        _id: sessionId,
        id: sessionId
      };

      // Sauvegarder dans localStorage pour le projet
      const existingSessions = JSON.parse(localStorage.getItem(`presspilot-sessions-${selectedProject.id}`) || '[]');
      existingSessions.push(sessionWithId);
      localStorage.setItem(`presspilot-sessions-${selectedProject.id}`, JSON.stringify(existingSessions));

      // Sauvegarder aussi dans la liste générale des sessions
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');
      allSessions.push(sessionWithId);
      localStorage.setItem('presspilot-all-sessions', JSON.stringify(allSessions));

      setCurrentSession(sessionWithId);
      setCurrentStep('session-management');

      // Recharger les données du dashboard
      loadDashboardData();
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      throw error;
    }
  };

  const handleSessionUpdate = (updatedSession) => {
    setCurrentSession(updatedSession);
    loadDashboardData(); // Recharger les données du dashboard
  };

  const openExistingSession = (session) => {
    setCurrentSession(session);
    setSelectedArtist({ name: session.artistName });
    setSelectedProject({ name: session.projectName, _id: session.projectId });
    setCurrentStep('session-management');
  };

  const backToDashboard = () => {
    setCurrentStep('dashboard');
    setSelectedArtist(null);
    setSelectedProject(null);
    setCurrentSession(null);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render different workflow steps
  if (currentStep === 'artist-selection') {
    return (
      <Layout title="PHONING" subtitle="Workflow d'appels par projet">
        <ArtistSelectionPage
          onSelectArtist={handleArtistSelected}
          onBack={backToDashboard}
        />
      </Layout>
    );
  }

  if (currentStep === 'project-selection') {
    return (
      <Layout title="PHONING" subtitle="Workflow d'appels par projet">
        <ProjectSelectionPage
          artist={selectedArtist}
          onSelectProject={handleProjectSelected}
          onBack={() => setCurrentStep('artist-selection')}
        />
      </Layout>
    );
  }

  if (currentStep === 'session-creation') {
    return (
      <Layout title="PHONING" subtitle="Workflow d'appels par projet">
        <SessionCreationPage
          artist={selectedArtist}
          project={selectedProject}
          onCreateSession={handleSessionCreated}
          onBack={() => setCurrentStep('project-selection')}
        />
      </Layout>
    );
  }

  if (currentStep === 'session-management') {
    return (
      <Layout title="PHONING" subtitle="Workflow d'appels par projet">
        <SessionManagementPage
          session={currentSession}
          onBack={backToDashboard}
          onSessionUpdate={handleSessionUpdate}
        />
      </Layout>
    );
  }

  // Default dashboard view
  if (loading) {
    return (
      <Layout title="PHONING" subtitle="Centre d'appels par projet">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="PHONING" subtitle="Centre d'appels par projet">
      <div className="phoning-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h2>Tableau de bord des appels</h2>
            <p>Gérez vos sessions d'appels par artiste et projet</p>
          </div>
          <button className="btn-primary" onClick={startNewSession}>
            + Nouvelle session d'appels
          </button>
        </div>

        {/* Statistiques globales */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Target className="metric-icon" />
              <span className="metric-label">Sessions totales</span>
            </div>
            <div className="metric-value">{callStats.totalSessions}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Phone className="metric-icon" />
              <span className="metric-label">Appels passés</span>
            </div>
            <div className="metric-value">{callStats.totalCalls}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <TrendingUp className="metric-icon" />
              <span className="metric-label">Décrochés</span>
            </div>
            <div className="metric-value">{callStats.answeredCalls}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Clock className="metric-icon" />
              <span className="metric-label">Durée totale</span>
            </div>
            <div className="metric-value">{formatDuration(callStats.totalDuration)}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Users className="metric-icon" />
              <span className="metric-label">Sessions actives</span>
            </div>
            <div className="metric-value">{callStats.activeSessions}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <TrendingUp className="metric-icon" />
              <span className="metric-label">Taux de succès</span>
            </div>
            <div className="metric-value">{Math.round(callStats.avgSuccessRate * 100)}%</div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Sessions actives */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>Sessions actives ({activeSessions.length})</h3>
              {activeSessions.length > 0 && (
                <button className="btn-secondary" onClick={() => window.location.href = '/analytics'}>
                  Voir toutes les analyses
                </button>
              )}
            </div>

            {activeSessions.length === 0 ? (
              <div className="empty-state">
                <Phone size={48} className="empty-icon" />
                <h4>Aucune session active</h4>
                <p>Créez votre première session d'appels pour commencer</p>
                <button className="btn-primary" onClick={startNewSession}>
                  Créer une session
                </button>
              </div>
            ) : (
              <div className="sessions-grid">
                {activeSessions.map((session) => (
                  <div key={session._id} className="session-card">
                    <div className="session-header">
                      <div className="session-info">
                        <h4>{session.sessionName}</h4>
                        <p>{session.artistName} • {session.projectName}</p>
                      </div>
                      <span className="session-status active">En cours</span>
                    </div>

                    <div className="session-progress">
                      <div className="progress-stats">
                        <span>Progression: {session.completionRate || 0}%</span>
                        <span>{session.stats?.totalCalls || 0} appels</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${session.completionRate || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="session-stats">
                      <div className="stat">
                        <span className="stat-value">{session.stats?.answeredCalls || 0}</span>
                        <span className="stat-label">Réponses</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{session.remainingContacts || 0}</span>
                        <span className="stat-label">Restants</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{session.successRate || 0}%</span>
                        <span className="stat-label">Succès</span>
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        className="btn-primary"
                        onClick={() => openExistingSession(session)}
                      >
                        <ArrowRight size={16} />
                        Continuer la session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions récentes */}
          {recentSessions.length > 0 && (
            <div className="dashboard-section">
              <div className="section-header">
                <h3>Sessions récentes</h3>
              </div>

              <div className="recent-sessions-list">
                {recentSessions.map((session) => (
                  <div key={session._id} className="recent-session-item">
                    <div className="session-info">
                      <h4>{session.sessionName}</h4>
                      <p>{session.artistName} • {session.projectName}</p>
                      <span className="session-date">{formatDate(session.createdAt)}</span>
                    </div>

                    <div className="session-quick-stats">
                      <span>{session.stats?.totalCalls || 0} appels</span>
                      <span>{session.stats?.answeredCalls || 0} réponses</span>
                      <span className={`session-status ${session.status}`}>
                        {session.status === 'completed' ? 'Terminée' :
                         session.status === 'active' ? 'Active' :
                         session.status === 'paused' ? 'Pause' : session.status}
                      </span>
                    </div>

                    <div className="session-actions">
                      {session.status === 'active' && (
                        <button
                          className="btn-secondary"
                          onClick={() => openExistingSession(session)}
                        >
                          Reprendre
                        </button>
                      )}
                      <button className="btn-tertiary">
                        Voir détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="getting-started">
          <h3>Comment ça marche ?</h3>
          <div className="workflow-steps-guide">
            <div className="step-guide">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Sélectionnez un artiste</h4>
                <p>Choisissez l'artiste pour lequel vous voulez faire des appels</p>
              </div>
            </div>
            <div className="step-guide">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Choisissez le projet</h4>
                <p>Sélectionnez le projet spécifique à promouvoir</p>
              </div>
            </div>
            <div className="step-guide">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Créez la session</h4>
                <p>Configurez vos objectifs et sélectionnez vos contacts</p>
              </div>
            </div>
            <div className="step-guide">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Passez vos appels</h4>
                <p>Appelez vos contacts et documentez chaque interaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Phoning;