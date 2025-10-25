import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, TrendingDown, Users, Mail, Phone, Calendar, Target, Filter, Download, Music } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Dashboard.css';

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
      const token = localStorage.getItem('authToken');

      // Load projects to get artists list
      const projectsResponse = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Extract unique artists
        const uniqueArtists = [...new Set(projectsData.map(p => p.artist))].sort();
        setArtists(uniqueArtists);
        setFilteredProjects(projectsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Build filters
      const filters = {
        startDate: getStartDate(),
        endDate: new Date().toISOString().split('T')[0]
      };

      if (selectedProject !== 'all') {
        filters.projectId = selectedProject;
      }

      // Load call analytics
      const callParams = new URLSearchParams(filters).toString();
      const callResponse = await fetch(`/api/call-sessions/analytics/calls?${callParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (callResponse.ok) {
        const callData = await callResponse.json();
        setCallAnalytics(callData);
      }

      // Load call session stats
      const statsResponse = await fetch(`/api/call-sessions/stats/overview?${selectedProject !== 'all' ? `projectId=${selectedProject}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        // Update metrics with call data
        setMetrics(prev => ({
          ...prev,
          totalSessions: statsData.totalSessions || 0,
          totalCalls: statsData.totalCalls || 0,
          answeredCalls: statsData.totalAnswered || 0,
          successfulCalls: statsData.totalSuccessful || 0,
          avgSuccessRate: statsData.avgSuccessRate || 0,
          // Calculate combined metrics
          responseRate: statsData.totalCalls > 0 ? Math.round((statsData.totalAnswered / statsData.totalCalls) * 100) : 0
        }));
      }

      // Load campaign analytics (existing email data)
      const campaignResponse = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (campaignResponse.ok) {
        const campaigns = await campaignResponse.json();

        // Filter campaigns by project if selected
        let filteredCampaigns = campaigns;
        if (selectedProject !== 'all') {
          filteredCampaigns = campaigns.filter(c => c.projectId === selectedProject);
        } else if (selectedArtist !== 'all') {
          const artistProjects = filteredProjects.map(p => p._id);
          filteredCampaigns = campaigns.filter(c => artistProjects.includes(c.projectId));
        }

        // Calculate email metrics
        const emailMetrics = filteredCampaigns.reduce((acc, campaign) => ({
          totalCampaigns: acc.totalCampaigns + 1,
          emailsSent: acc.emailsSent + (campaign.stats?.emailsSent || 0),
          emailsOpened: acc.emailsOpened + (campaign.stats?.emailsOpened || 0),
          emailsReplied: acc.emailsReplied + (campaign.stats?.emailsReplied || 0)
        }), { totalCampaigns: 0, emailsSent: 0, emailsOpened: 0, emailsReplied: 0 });

        setMetrics(prev => ({
          ...prev,
          ...emailMetrics,
          avgOpenRate: emailMetrics.emailsSent > 0 ? Math.round((emailMetrics.emailsOpened / emailMetrics.emailsSent) * 100) : 0,
          avgReplyRate: emailMetrics.emailsSent > 0 ? Math.round((emailMetrics.emailsReplied / emailMetrics.emailsSent) * 100) : 0
        }));

        setEmailAnalytics(filteredCampaigns);
      }

      // Load contact analytics
      const contactResponse = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (contactResponse.ok) {
        const contacts = await contactResponse.json();
        const uniqueMedias = new Set(contacts.map(c => c.journalism?.mediaName).filter(Boolean)).size;

        setMetrics(prev => ({
          ...prev,
          totalContacts: contacts.length,
          uniqueMedias
        }));
      }

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
      const token = localStorage.getItem('authToken');
      const filters = {
        startDate: getStartDate(),
        endDate: new Date().toISOString().split('T')[0]
      };

      if (selectedProject !== 'all') {
        filters.projectId = selectedProject;
      }

      // This would generate and download a report
      const reportResponse = await fetch(`/api/project-reports/quick-generate/${selectedProject}?reportType=full`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();

        // Create and download CSV or PDF
        const dataStr = JSON.stringify(reportData.report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${selectedProject !== 'all' ? selectedProject : 'all-projects'}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
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
          <div className="controls-row">
            <div className="filters-section">
              <div className="filter-group">
                <label>Période :</label>
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

              <div className="filter-group">
                <label>Artiste :</label>
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

              <div className="filter-group">
                <label>Projet :</label>
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

              <div className="filter-group">
                <label>Vue :</label>
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
            </div>

            <div className="actions-section">
              <button className="btn-secondary" onClick={exportData}>
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