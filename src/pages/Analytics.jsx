import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, TrendingDown, Users, Mail, Phone, Calendar, Target, Filter, Download, Music } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Dashboard.css';
import '../styles/Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [analyticsType, setAnalyticsType] = useState('overview'); // overview, emails, calls, projects

  // Data states
  const [artists, setArtists] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  const [metrics, setMetrics] = useState({
    // Email metrics
    totalCampaigns: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    avgOpenRate: 0,
    avgReplyRate: 0,

    // Call metrics
    totalSessions: 0,
    totalCalls: 0,
    answeredCalls: 0,
    successfulCalls: 0,
    avgCallDuration: 0,
    avgSuccessRate: 0,

    // Contact metrics
    totalContacts: 0,
    uniqueMedias: 0,

    // Combined metrics
    responseRate: 0,
    conversionRate: 0
  });

  const [projectAnalytics, setProjectAnalytics] = useState([]);
  const [callAnalytics, setCallAnalytics] = useState([]);
  const [emailAnalytics, setEmailAnalytics] = useState([]);

  useEffect(() => {
    loadInitialData();

    // Vérifier les paramètres URL pour pré-sélectionner un projet
    const urlParams = new URLSearchParams(window.location.search);
    const projectParam = urlParams.get('project');
    if (projectParam) {
      setSelectedProject(projectParam);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange, selectedArtist, selectedProject, analyticsType]);

  useEffect(() => {
    // Filter projects when artist changes
    if (selectedArtist === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(p => p.artist === selectedArtist));
    }
    setSelectedProject('all');
  }, [selectedArtist, projects]);

  const loadInitialData = async () => {
    try {
      // Charger les artistes depuis localStorage
      const savedArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      setArtists(savedArtists.map(artist => artist.name).sort());

      // Charger tous les projets depuis localStorage
      let allProjects = [];
      for (const artist of savedArtists) {
        const artistProjects = JSON.parse(localStorage.getItem(`presspilot-projects-${artist.id}`) || '[]');
        const enrichedProjects = artistProjects.map(project => ({
          ...project,
          artist: artist.name,
          artistId: artist.id
        }));
        allProjects = [...allProjects, ...enrichedProjects];
      }

      setProjects(allProjects);
      setFilteredProjects(allProjects);
    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Charger toutes les sessions depuis localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');

      // Filtrer par dates
      const startDate = new Date(getStartDate());
      const endDate = new Date();
      const filteredSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Filtrer par projet si sélectionné
      let projectFilteredSessions = filteredSessions;
      if (selectedProject !== 'all') {
        projectFilteredSessions = filteredSessions.filter(session => session.projectId === selectedProject);
      } else if (selectedArtist !== 'all') {
        const artistProjects = filteredProjects.filter(p => p.artist === selectedArtist).map(p => p._id);
        projectFilteredSessions = filteredSessions.filter(session => artistProjects.includes(session.projectId));
      }

      // Calculer les métriques d'appels
      const callMetrics = projectFilteredSessions.reduce((acc, session) => {
        const totalCalls = session.stats?.totalCalls || 0;
        const answeredCalls = session.stats?.answeredCalls || 0;
        const duration = session.stats?.totalDuration || 0;

        return {
          totalSessions: acc.totalSessions + 1,
          totalCalls: acc.totalCalls + totalCalls,
          answeredCalls: acc.answeredCalls + answeredCalls,
          totalDuration: acc.totalDuration + duration,
          successfulCalls: acc.successfulCalls + (session.callLogs?.filter(call => call.outcome === 'interested').length || 0)
        };
      }, { totalSessions: 0, totalCalls: 0, answeredCalls: 0, totalDuration: 0, successfulCalls: 0 });

      // Analyser les appels par projet
      const projectCallAnalytics = [];
      const projectGroups = {};

      projectFilteredSessions.forEach(session => {
        if (!projectGroups[session.projectId]) {
          projectGroups[session.projectId] = {
            projectId: session.projectId,
            projectName: session.projectName,
            artistName: session.artistName,
            sessions: []
          };
        }
        projectGroups[session.projectId].sessions.push(session);
      });

      Object.values(projectGroups).forEach(group => {
        const totalCalls = group.sessions.reduce((sum, s) => sum + (s.stats?.totalCalls || 0), 0);
        const answeredCalls = group.sessions.reduce((sum, s) => sum + (s.stats?.answeredCalls || 0), 0);
        const successfulCalls = group.sessions.reduce((sum, s) => sum + (s.callLogs?.filter(call => call.outcome === 'interested').length || 0), 0);
        const totalDuration = group.sessions.reduce((sum, s) => sum + (s.stats?.totalDuration || 0), 0);

        const uniqueContacts = new Set();
        group.sessions.forEach(session => {
          session.callLogs?.forEach(call => {
            uniqueContacts.add(call.contactId);
          });
        });

        projectCallAnalytics.push({
          ...group,
          totalCalls,
          answeredCalls,
          successfulCalls,
          avgDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
          successRate: totalCalls > 0 ? answeredCalls / totalCalls : 0,
          uniqueContactsCount: uniqueContacts.size
        });
      });

      setCallAnalytics(projectCallAnalytics);

      // Charger les contacts depuis localStorage pour les métriques
      const savedContacts = JSON.parse(localStorage.getItem('presspilot-contacts') || '[]');
      const uniqueMedias = new Set(savedContacts.map(c => c.journalism?.mediaName).filter(Boolean)).size;

      // Charger les campagnes email depuis localStorage (si elles existent)
      const savedCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');

      // Filtrer les campagnes par projet si nécessaire
      let filteredCampaigns = savedCampaigns;
      if (selectedProject !== 'all') {
        filteredCampaigns = savedCampaigns.filter(c => c.projectId === selectedProject);
      } else if (selectedArtist !== 'all') {
        const artistProjects = filteredProjects.filter(p => p.artist === selectedArtist).map(p => p._id);
        filteredCampaigns = savedCampaigns.filter(c => artistProjects.includes(c.projectId));
      }

      // Calculer les métriques email
      const emailMetrics = filteredCampaigns.reduce((acc, campaign) => ({
        totalCampaigns: acc.totalCampaigns + 1,
        emailsSent: acc.emailsSent + (campaign.stats?.emailsSent || 0),
        emailsOpened: acc.emailsOpened + (campaign.stats?.emailsOpened || 0),
        emailsReplied: acc.emailsReplied + (campaign.stats?.emailsReplied || 0)
      }), { totalCampaigns: 0, emailsSent: 0, emailsOpened: 0, emailsReplied: 0 });

      setEmailAnalytics(filteredCampaigns);

      // Mettre à jour toutes les métriques
      setMetrics({
        // Email metrics
        ...emailMetrics,
        avgOpenRate: emailMetrics.emailsSent > 0 ? Math.round((emailMetrics.emailsOpened / emailMetrics.emailsSent) * 100) : 0,
        avgReplyRate: emailMetrics.emailsSent > 0 ? Math.round((emailMetrics.emailsReplied / emailMetrics.emailsSent) * 100) : 0,

        // Call metrics
        ...callMetrics,
        avgCallDuration: callMetrics.totalCalls > 0 ? callMetrics.totalDuration / callMetrics.totalCalls : 0,
        avgSuccessRate: callMetrics.totalCalls > 0 ? callMetrics.answeredCalls / callMetrics.totalCalls : 0,

        // Contact metrics
        totalContacts: savedContacts.length,
        uniqueMedias,

        // Combined metrics
        responseRate: callMetrics.totalCalls > 0 ? Math.round((callMetrics.answeredCalls / callMetrics.totalCalls) * 100) : 0,
        conversionRate: callMetrics.totalCalls > 0 ? Math.round((callMetrics.successfulCalls / callMetrics.totalCalls) * 100) : 0
      });

    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const exportData = async () => {
    try {
      // Générer un rapport complet basé sur localStorage
      const allSessions = JSON.parse(localStorage.getItem('presspilot-all-sessions') || '[]');
      const allContacts = JSON.parse(localStorage.getItem('presspilot-contacts') || '[]');
      const allCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');

      // Filtrer par projet si sélectionné
      let targetProject = null;
      let reportTitle = 'Rapport Analytics Global';
      let filteredSessions = allSessions;
      let filteredCampaigns = allCampaigns;

      if (selectedProject !== 'all') {
        targetProject = projects.find(p => p._id === selectedProject);
        filteredSessions = allSessions.filter(s => s.projectId === selectedProject);
        filteredCampaigns = allCampaigns.filter(c => c.projectId === selectedProject);
        reportTitle = `Rapport de Projet: ${targetProject?.name || 'Projet inconnu'}`;
      } else if (selectedArtist !== 'all') {
        const artistProjects = filteredProjects.filter(p => p.artist === selectedArtist).map(p => p._id);
        filteredSessions = allSessions.filter(s => artistProjects.includes(s.projectId));
        filteredCampaigns = allCampaigns.filter(c => artistProjects.includes(c.projectId));
        reportTitle = `Rapport Artiste: ${selectedArtist}`;
      }

      // Créer le rapport consolidé
      const report = {
        titre: reportTitle,
        periode: {
          debut: getStartDate(),
          fin: new Date().toISOString().split('T')[0]
        },
        artiste: selectedArtist !== 'all' ? selectedArtist : 'Tous les artistes',
        projet: targetProject ? {
          nom: targetProject.name,
          type: targetProject.type,
          genre: targetProject.genre,
          sortie: targetProject.releaseDate,
          statut: targetProject.status
        } : null,

        // Métriques consolidées
        metriques: {
          appels: {
            totalSessions: filteredSessions.length,
            totalAppels: filteredSessions.reduce((sum, s) => sum + (s.stats?.totalCalls || 0), 0),
            reponsesObtenues: filteredSessions.reduce((sum, s) => sum + (s.stats?.answeredCalls || 0), 0),
            dureeTotal: filteredSessions.reduce((sum, s) => sum + (s.stats?.totalDuration || 0), 0),
            tauxReponse: metrics.responseRate
          },
          emails: {
            totalCampagnes: filteredCampaigns.length,
            emailsEnvoyes: filteredCampaigns.reduce((sum, c) => sum + (c.stats?.emailsSent || 0), 0),
            ouvertures: filteredCampaigns.reduce((sum, c) => sum + (c.stats?.emailsOpened || 0), 0),
            reponses: filteredCampaigns.reduce((sum, c) => sum + (c.stats?.emailsReplied || 0), 0),
            tauxOuverture: metrics.avgOpenRate
          },
          contacts: {
            total: allContacts.length,
            mediasUniques: metrics.uniqueMedias
          }
        },

        // Détail des sessions d'appels
        detailAppels: filteredSessions.map(session => ({
          nom: session.sessionName,
          dateCreation: session.createdAt,
          statut: session.status,
          appels: session.callLogs?.map(call => ({
            contact: call.contactName,
            media: call.contactId?.journalism?.mediaName || 'Non renseigné',
            statut: call.status,
            duree: call.duration,
            resultat: call.outcome,
            commentaires: call.comments,
            feedbackJournaliste: call.journalistFeedback
          })) || []
        })),

        // Détail des campagnes email
        detailEmails: filteredCampaigns.map(campaign => ({
          nom: campaign.name,
          sujet: campaign.subject,
          dateEnvoi: campaign.sentAt,
          statut: campaign.status,
          statistiques: campaign.stats || {},
          tauxOuverture: campaign.openRate || 0
        })),

        // Médias contactés
        mediasContactes: [...new Set(
          filteredSessions.flatMap(session =>
            session.callLogs?.map(call => call.contactId?.journalism?.mediaName).filter(Boolean) || []
          )
        )].sort(),

        // Résumé des résultats par média
        resultatParMedia: {},

        // Généré le
        dateGeneration: new Date().toISOString(),
        filtres: {
          periode: selectedTimeRange,
          artiste: selectedArtist,
          projet: selectedProject
        }
      };

      // Calculer les résultats par média
      const mediaResults = {};
      filteredSessions.forEach(session => {
        session.callLogs?.forEach(call => {
          const mediaName = call.contactId?.journalism?.mediaName || 'Non renseigné';
          if (!mediaResults[mediaName]) {
            mediaResults[mediaName] = {
              appels: 0,
              reponses: 0,
              interesses: 0,
              commentaires: []
            };
          }
          mediaResults[mediaName].appels++;
          if (call.status === 'answered') mediaResults[mediaName].reponses++;
          if (call.outcome === 'interested') mediaResults[mediaName].interesses++;
          if (call.comments) mediaResults[mediaName].commentaires.push(call.comments);
        });
      });
      report.resultatParMedia = mediaResults;

      // Créer et télécharger le rapport
      const reportStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([reportStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-analytics-${selectedProject !== 'all' ? selectedProject : 'tous-projets'}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      alert('Rapport téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  if (loading) {
    return (
      <Layout title="ANALYTICS" subtitle="Analysez vos performances par artiste et projet">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="ANALYTICS" subtitle="Analysez vos performances par artiste et projet">
      <div className="analytics-container">
        {/* Filters and controls */}
        <div className="analytics-controls">
          <div className="filters-grid">
            <div className="filter-item">
              <label className="filter-label">Période</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="filter-select"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="1y">1 an</option>
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Artiste</label>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les artistes</option>
                {artists.map(artist => (
                  <option key={artist} value={artist}>{artist}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Projet</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="filter-select"
                disabled={filteredProjects.length === 0}
              >
                <option value="all">Tous les projets</option>
                {filteredProjects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Vue</label>
              <select
                value={analyticsType}
                onChange={(e) => setAnalyticsType(e.target.value)}
                className="filter-select"
              >
                <option value="overview">Vue d'ensemble</option>
                <option value="calls">Appels détaillés</option>
                <option value="emails">Emails détaillés</option>
                <option value="projects">Par projet</option>
              </select>
            </div>

            <div className="filter-item actions-item">
              <button className="btn-export" onClick={exportData}>
                <Download size={16} />
                Exporter
              </button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="metrics-grid">
          {/* Email Metrics */}
          <div className="metric-card">
            <div className="metric-header">
              <Mail className="metric-icon" />
              <span className="metric-label">Emails envoyés</span>
            </div>
            <div className="metric-value">{metrics.emailsSent.toLocaleString()}</div>
            <div className="metric-subtext">
              {metrics.totalCampaigns} campagne{metrics.totalCampaigns > 1 ? 's' : ''}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <TrendingUp className="metric-icon" />
              <span className="metric-label">Taux d'ouverture</span>
            </div>
            <div className="metric-value">{metrics.avgOpenRate}%</div>
            <div className="metric-subtext">
              {metrics.emailsOpened.toLocaleString()} ouvertures
            </div>
          </div>

          {/* Call Metrics */}
          <div className="metric-card">
            <div className="metric-header">
              <Phone className="metric-icon" />
              <span className="metric-label">Appels passés</span>
            </div>
            <div className="metric-value">{metrics.totalCalls}</div>
            <div className="metric-subtext">
              {metrics.totalSessions} session{metrics.totalSessions > 1 ? 's' : ''}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Target className="metric-icon" />
              <span className="metric-label">Taux de réponse</span>
            </div>
            <div className="metric-value">{metrics.responseRate}%</div>
            <div className="metric-subtext">
              {metrics.answeredCalls} réponse{metrics.answeredCalls > 1 ? 's' : ''}
            </div>
          </div>

          {/* Contact Metrics */}
          <div className="metric-card">
            <div className="metric-header">
              <Users className="metric-icon" />
              <span className="metric-label">Total contacts</span>
            </div>
            <div className="metric-value">{metrics.totalContacts}</div>
            <div className="metric-subtext">
              {metrics.uniqueMedias} média{metrics.uniqueMedias > 1 ? 's' : ''} unique{metrics.uniqueMedias > 1 ? 's' : ''}
            </div>
          </div>

          {/* Combined Metrics */}
          <div className="metric-card">
            <div className="metric-header">
              <BarChart className="metric-icon" />
              <span className="metric-label">Succès global</span>
            </div>
            <div className="metric-value">{Math.round(metrics.avgSuccessRate * 100)}%</div>
            <div className="metric-subtext">
              {metrics.successfulCalls} contact{metrics.successfulCalls > 1 ? 's' : ''} intéressé{metrics.successfulCalls > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Analytics Details based on selected type */}
        {analyticsType === 'calls' && (
          <div className="analytics-section">
            <h3>Analyse détaillée des appels</h3>

            {callAnalytics.length === 0 ? (
              <div className="empty-state">
                <Phone size={48} className="empty-icon" />
                <h4>Aucune donnée d'appels</h4>
                <p>Aucun appel n'a été passé dans la période sélectionnée</p>
              </div>
            ) : (
              <div className="call-analytics-list">
                {callAnalytics.map((project, index) => (
                  <div key={index} className="project-analytics-card">
                    <div className="project-header">
                      <div className="project-info">
                        <h4>{project.projectName}</h4>
                        <p>{project.artistName}</p>
                      </div>
                      <div className="project-metrics">
                        <span className="metric">
                          {project.totalCalls} appel{project.totalCalls > 1 ? 's' : ''}
                        </span>
                        <span className="metric success">
                          {Math.round(project.successRate * 100)}% succès
                        </span>
                      </div>
                    </div>

                    <div className="project-details">
                      <div className="detail-item">
                        <span className="label">Contacts uniques :</span>
                        <span className="value">{project.uniqueContactsCount}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Durée moyenne :</span>
                        <span className="value">{formatDuration(project.avgDuration || 0)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Appels réussis :</span>
                        <span className="value">{project.successfulCalls}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {analyticsType === 'emails' && (
          <div className="analytics-section">
            <h3>Analyse détaillée des emails</h3>

            {emailAnalytics.length === 0 ? (
              <div className="empty-state">
                <Mail size={48} className="empty-icon" />
                <h4>Aucune campagne email</h4>
                <p>Aucune campagne n'a été envoyée dans la période sélectionnée</p>
              </div>
            ) : (
              <div className="email-analytics-list">
                {emailAnalytics.map((campaign) => (
                  <div key={campaign._id} className="campaign-analytics-card">
                    <div className="campaign-header">
                      <div className="campaign-info">
                        <h4>{campaign.name}</h4>
                        <p>{campaign.subject}</p>
                        <span className="campaign-date">
                          {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString('fr-FR') : 'Non envoyée'}
                        </span>
                      </div>
                      <div className="campaign-metrics">
                        <span className="metric">
                          {campaign.stats?.emailsSent || 0} envoi{(campaign.stats?.emailsSent || 0) > 1 ? 's' : ''}
                        </span>
                        <span className="metric success">
                          {campaign.openRate}% ouverture
                        </span>
                      </div>
                    </div>

                    <div className="campaign-progress">
                      <div className="progress-stats">
                        <span>Ouvertures: {campaign.stats?.emailsOpened || 0}</span>
                        <span>Clics: {campaign.stats?.emailsClicked || 0}</span>
                        <span>Réponses: {campaign.stats?.emailsReplied || 0}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${campaign.openRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {analyticsType === 'projects' && (
          <div className="analytics-section">
            <h3>Analyse par projet</h3>

            <div className="projects-analytics">
              {filteredProjects.map((project) => {
                const projectCalls = callAnalytics.find(ca => ca.projectId === project._id);
                const projectEmails = emailAnalytics.filter(ea => ea.projectId === project._id);

                return (
                  <div key={project._id} className="project-performance-card">
                    <div className="project-header">
                      <div className="project-info">
                        <h4>{project.name}</h4>
                        <p>{project.artist} • {project.type} • {project.genre}</p>
                        <span className="release-date">
                          Sortie: {new Date(project.releaseDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <span className={`project-status ${project.status}`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="project-analytics-summary">
                      <div className="analytics-section">
                        <h5>📞 Appels</h5>
                        {projectCalls ? (
                          <div className="analytics-metrics">
                            <span>{projectCalls.totalCalls} appel{projectCalls.totalCalls > 1 ? 's' : ''}</span>
                            <span>{projectCalls.answeredCalls} réponse{projectCalls.answeredCalls > 1 ? 's' : ''}</span>
                            <span>{Math.round(projectCalls.successRate * 100)}% succès</span>
                          </div>
                        ) : (
                          <p className="no-data">Aucun appel</p>
                        )}
                      </div>

                      <div className="analytics-section">
                        <h5>📧 Emails</h5>
                        {projectEmails.length > 0 ? (
                          <div className="analytics-metrics">
                            <span>{projectEmails.length} campagne{projectEmails.length > 1 ? 's' : ''}</span>
                            <span>
                              {projectEmails.reduce((sum, c) => sum + (c.stats?.emailsSent || 0), 0)} envoi{projectEmails.reduce((sum, c) => sum + (c.stats?.emailsSent || 0), 0) > 1 ? 's' : ''}
                            </span>
                            <span>
                              {projectEmails.length > 0 ? Math.round(projectEmails.reduce((sum, c) => sum + (c.openRate || 0), 0) / projectEmails.length) : 0}% ouverture
                            </span>
                          </div>
                        ) : (
                          <p className="no-data">Aucun email</p>
                        )}
                      </div>
                    </div>

                    <div className="project-actions">
                      <button className="btn-secondary" onClick={() => window.location.href = `/phoning?project=${project._id}`}>
                        Voir session d'appels
                      </button>
                      <button className="btn-tertiary" onClick={() => exportData()}>
                        Rapport complet
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="empty-state">
                  <Music size={48} className="empty-icon" />
                  <h4>Aucun projet</h4>
                  <p>Aucun projet ne correspond aux filtres sélectionnés</p>
                </div>
              )}
            </div>
          </div>
        )}

        {analyticsType === 'overview' && (
          <div className="analytics-overview">
            {/* Quick charts placeholder */}
            <div className="overview-charts">
              <div className="chart-container">
                <h3>Performance globale</h3>
                <div className="chart-placeholder">
                  <BarChart size={48} className="chart-icon" />
                  <p>Graphique de performance combinée</p>
                  <small>Emails et appels sur la période sélectionnée</small>
                </div>
              </div>

              <div className="chart-container">
                <h3>Évolution des contacts</h3>
                <div className="chart-placeholder">
                  <TrendingUp size={48} className="chart-icon" />
                  <p>Croissance de votre réseau</p>
                  <small>Nouveaux contacts ajoutés au fil du temps</small>
                </div>
              </div>
            </div>

            {/* Top performing projects */}
            <div className="top-performers">
              <h3>Projets les plus performants</h3>
              <div className="performers-list">
                {callAnalytics
                  .sort((a, b) => (b.successRate * b.totalCalls) - (a.successRate * a.totalCalls))
                  .slice(0, 5)
                  .map((project, index) => (
                    <div key={index} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <h4>{project.projectName}</h4>
                        <p>{project.artistName}</p>
                      </div>
                      <div className="performer-stats">
                        <span>{project.totalCalls} appels</span>
                        <span className="success-rate">{Math.round(project.successRate * 100)}% succès</span>
                      </div>
                    </div>
                  ))}

                {callAnalytics.length === 0 && (
                  <div className="no-performers">
                    <p>Aucune donnée de performance disponible</p>
                    <p>Commencez par créer des sessions d'appels pour voir les statistiques</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Analytics;