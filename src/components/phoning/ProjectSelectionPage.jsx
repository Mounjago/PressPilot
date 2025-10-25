import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, TrendingUp, Music, Target } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/Dashboard.css';

const ProjectSelectionPage = ({ artist, onSelectProject, onBack }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('releaseDate');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadArtistProjects();
  }, [artist]);

  const loadArtistProjects = async () => {
    try {
      setLoading(true);

      // Récupérer les projets de cet artiste depuis localStorage
      const savedProjects = localStorage.getItem(`presspilot-projects-${artist.id}`);
      let artistProjects = [];

      if (savedProjects) {
        artistProjects = JSON.parse(savedProjects);
      }

      setProjects(artistProjects);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getSortedAndFilteredProjects = () => {
    let filtered = projects;

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Trier
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'releaseDate':
          return new Date(b.releaseDate) - new Date(a.releaseDate);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'budget':
          return (b.budget?.total || 0) - (a.budget?.total || 0);
        default:
          return 0;
      }
    });
  };

  const getProjectStatusColor = (status) => {
    const colors = {
      'upcoming': '#3B82F6',
      'active': '#10B981',
      'completed': '#6B7280',
      'paused': '#F59E0B',
      'cancelled': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getProjectStatusLabel = (status) => {
    const labels = {
      'upcoming': 'À venir',
      'active': 'Actif',
      'completed': 'Terminé',
      'paused': 'En pause',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  };

  const getProjectTypeIcon = (type) => {
    const icons = {
      'single': '🎵',
      'album': '💿',
      'ep': '📀',
      'tour': '🎤',
      'collaboration': '🤝',
      'remix': '🔄',
      'compilation': '📚'
    };
    return icons[type] || '🎵';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBudget = (amount) => {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilRelease = (releaseDate) => {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Sorti il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Sort aujourd\'hui';
    } else {
      return `Sort dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="phoning-workflow-step">
        <div className="step-header">
          <h2>Sélection du projet</h2>
          <button className="btn-secondary" onClick={onBack}>
            ← Retour
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  const sortedProjects = getSortedAndFilteredProjects();

  return (
    <div className="phoning-workflow-step">
      <div className="step-header">
        <div>
          <button className="btn-icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="step-title-section">
            <h2>Sélection du projet</h2>
            <p className="step-description">
              Choisissez le projet de <strong>{artist.name}</strong> pour lequel vous souhaitez créer une session d'appels
            </p>
          </div>
        </div>
      </div>

      <div className="projects-filters">
        <div className="filter-group">
          <label>Trier par :</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="releaseDate">Date de sortie</option>
            <option value="createdAt">Date de création</option>
            <option value="name">Nom du projet</option>
            <option value="budget">Budget</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Statut :</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="upcoming">À venir</option>
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
            <option value="paused">En pause</option>
          </select>
        </div>
      </div>

      {sortedProjects.length === 0 ? (
        <div className="empty-state">
          <Music size={64} className="empty-icon" />
          <h3>Aucun projet trouvé</h3>
          <p>
            {filterStatus !== 'all'
              ? `Aucun projet ${getProjectStatusLabel(filterStatus).toLowerCase()} trouvé pour ${artist.name}.`
              : `${artist.name} n'a encore aucun projet créé.`
            }
          </p>
          <button className="btn-primary" onClick={() => window.location.href = '/projects'}>
            Créer un nouveau projet
          </button>
        </div>
      ) : (
        <div className="projects-selection-grid">
          {sortedProjects.map((project) => (
            <div
              key={project._id}
              className="project-selection-card"
              onClick={() => onSelectProject(project)}
            >
              <div className="project-card-header">
                <div className="project-type-icon">
                  {getProjectTypeIcon(project.type)}
                </div>
                <div className="project-basic-info">
                  <h3 className="project-name">{project.name}</h3>
                  <p className="project-details">
                    {project.type.toUpperCase()} • {project.genre} • {project.label}
                  </p>
                </div>
                <div
                  className="project-status-badge"
                  style={{ backgroundColor: getProjectStatusColor(project.status) }}
                >
                  {getProjectStatusLabel(project.status)}
                </div>
              </div>

              <div className="project-description">
                {project.description && (
                  <p className="project-desc-text">
                    {project.description.length > 120
                      ? `${project.description.substring(0, 120)}...`
                      : project.description
                    }
                  </p>
                )}
              </div>

              <div className="project-stats-grid">
                <div className="stat-item">
                  <Calendar className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Sortie</span>
                    <span className="stat-value">{formatDate(project.releaseDate)}</span>
                    <span className="stat-subtext">{getDaysUntilRelease(project.releaseDate)}</span>
                  </div>
                </div>

                <div className="stat-item">
                  <Target className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Budget</span>
                    <span className="stat-value">{formatBudget(project.budget?.total)}</span>
                    <span className="stat-subtext">
                      {project.budget?.spent ? `${formatBudget(project.budget.spent)} dépensé` : 'Non utilisé'}
                    </span>
                  </div>
                </div>

                <div className="stat-item">
                  <TrendingUp className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Progression</span>
                    <span className="stat-value">{project.progress?.percentage || 0}%</span>
                    <span className="stat-subtext">
                      {project.progress?.milestones?.length || 0} étape{project.progress?.milestones?.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="stat-item">
                  <Clock className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Créé</span>
                    <span className="stat-value">
                      {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    <span className="stat-subtext">
                      {Math.ceil((new Date() - new Date(project.createdAt)) / (1000 * 60 * 60 * 24))} jours
                    </span>
                  </div>
                </div>
              </div>

              {project.deliverables && (
                <div className="project-deliverables">
                  <h4>État des livrables :</h4>
                  <div className="deliverables-status">
                    <span className={`deliverable-status ${project.deliverables.pressKitReady ? 'ready' : 'pending'}`}>
                      {project.deliverables.pressKitReady ? '✓' : '○'} Press Kit
                    </span>
                    <span className={`deliverable-status ${project.deliverables.socialMediaReady ? 'ready' : 'pending'}`}>
                      {project.deliverables.socialMediaReady ? '✓' : '○'} Réseaux sociaux
                    </span>
                    <span className={`deliverable-status ${project.deliverables.promotionMaterialsReady ? 'ready' : 'pending'}`}>
                      {project.deliverables.promotionMaterialsReady ? '✓' : '○'} Promotion
                    </span>
                  </div>
                </div>
              )}

              <div className="project-card-footer">
                <button className="btn-primary select-project-btn">
                  Créer une session d'appels
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="workflow-info">
        <div className="workflow-steps">
          <div className="step completed">1. Artiste sélectionné: {artist.name}</div>
          <div className="step active">2. Choisir le projet</div>
          <div className="step">3. Créer la session</div>
          <div className="step">4. Commencer les appels</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionPage;