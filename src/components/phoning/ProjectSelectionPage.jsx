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
      'upcoming': 'A venir',
      'active': 'Actif',
      'completed': 'Termine',
      'paused': 'En pause',
      'cancelled': 'Annule'
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
    if (!dateString) return 'Non definie';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Non definie';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };


  const getDaysUntilRelease = (releaseDate) => {
    if (!releaseDate) return '';

    const today = new Date();
    const release = new Date(releaseDate);

    if (isNaN(release.getTime())) return '';

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
          <h2>Selection du projet</h2>
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
    <div className="phoning-workflow-step" style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div className="step-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button className="btn-icon" onClick={onBack} style={{
          padding: '0.5rem',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: 'white',
          cursor: 'pointer'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div className="step-title-section">
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            Selection du projet
          </h2>
          <p className="step-description" style={{
            margin: '0.25rem 0 0 0',
            color: '#6b7280',
            fontSize: '0.95rem'
          }}>
            Choisissez le projet de <strong>{artist.name}</strong> pour lequel vous souhaitez creer une session d'appels
          </p>
        </div>
      </div>

      <div className="projects-filters" style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div className="filter-group" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
            Trier par :
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              minWidth: '180px'
            }}
          >
            <option value="releaseDate">Date de sortie</option>
            <option value="createdAt">Date de creation</option>
            <option value="name">Nom du projet</option>
          </select>
        </div>

        <div className="filter-group" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
            Statut :
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              minWidth: '180px'
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="upcoming">A venir</option>
            <option value="active">Actif</option>
            <option value="completed">Termine</option>
            <option value="paused">En pause</option>
          </select>
        </div>
      </div>

      {sortedProjects.length === 0 ? (
        <div className="empty-state">
          <Music size={64} className="empty-icon" />
          <h3>Aucun projet trouve</h3>
          <p>
            {filterStatus !== 'all'
              ? `Aucun projet ${getProjectStatusLabel(filterStatus).toLowerCase()} trouve pour ${artist.name}.`
              : `${artist.name} n'a encore aucun projet cree.`
            }
          </p>
          <button className="btn-primary" onClick={() => window.location.href = '/projects'}>
            Creer un nouveau projet
          </button>
        </div>
      ) : (
        <div className="projects-selection-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {sortedProjects.map((project) => (
            <div
              key={project._id}
              className="project-selection-card"
              onClick={() => onSelectProject(project)}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="project-card-header" style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div className="project-type-icon" style={{
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getProjectTypeIcon(project.type)}
                  </div>
                  <div className="project-basic-info" style={{ flex: 1 }}>
                    <h3 className="project-name" style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>
                      {project.name}
                    </h3>
                    <p className="project-details" style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <span>{project.type?.toUpperCase() || 'PROJET'}</span>
                      {project.genre && project.genre.trim() && (
                        <>
                          <span>•</span>
                          <span>{project.genre}</span>
                        </>
                      )}
                      {project.label && project.label.trim() && (
                        <>
                          <span>•</span>
                          <span>{project.label}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div
                  className="project-status-badge"
                  style={{
                    backgroundColor: getProjectStatusColor(project.status),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getProjectStatusLabel(project.status)}
                </div>
              </div>

              <div className="project-description" style={{ marginBottom: '1rem' }}>
                {project.description && (
                  <p className="project-desc-text" style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    lineHeight: '1.4'
                  }}>
                    {project.description.length > 120
                      ? `${project.description.substring(0, 120)}...`
                      : project.description
                    }
                  </p>
                )}
              </div>

              <div className="project-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div className="stat-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <Calendar className="stat-icon" style={{
                    color: '#3b82f6',
                    flexShrink: 0,
                    width: '20px',
                    height: '20px'
                  }} />
                  <div className="stat-content" style={{ flex: 1 }}>
                    <span className="stat-label" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      display: 'block'
                    }}>
                      Sortie
                    </span>
                    <span className="stat-value" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      display: 'block'
                    }}>
                      {project.releaseDate ? formatDate(project.releaseDate) : 'Non definie'}
                    </span>
                    <span className="stat-subtext" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      display: 'block'
                    }}>
                      {project.releaseDate ? getDaysUntilRelease(project.releaseDate) : ''}
                    </span>
                  </div>
                </div>


                <div className="stat-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <TrendingUp className="stat-icon" style={{
                    color: '#f59e0b',
                    flexShrink: 0,
                    width: '20px',
                    height: '20px'
                  }} />
                  <div className="stat-content" style={{ flex: 1 }}>
                    <span className="stat-label" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      display: 'block'
                    }}>
                      Progression
                    </span>
                    <span className="stat-value" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      display: 'block'
                    }}>
                      {project.progress?.percentage || 0}%
                    </span>
                    <span className="stat-subtext" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      display: 'block'
                    }}>
                      {project.progress?.milestones?.length || 0} etape{project.progress?.milestones?.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="stat-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <Clock className="stat-icon" style={{
                    color: '#6b7280',
                    flexShrink: 0,
                    width: '20px',
                    height: '20px'
                  }} />
                  <div className="stat-content" style={{ flex: 1 }}>
                    <span className="stat-label" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      display: 'block'
                    }}>
                      Cree
                    </span>
                    <span className="stat-value" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      display: 'block'
                    }}>
                      {project.createdAt && !isNaN(new Date(project.createdAt).getTime()) ?
                        new Date(project.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        }) : 'Inconnu'}
                    </span>
                    <span className="stat-subtext" style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      display: 'block'
                    }}>
                      {project.createdAt && !isNaN(new Date(project.createdAt).getTime()) ?
                        `${Math.ceil((new Date() - new Date(project.createdAt)) / (1000 * 60 * 60 * 24))} jours` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {project.deliverables && (
                <div className="project-deliverables" style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: '#f3f4f6',
                  borderRadius: '8px'
                }}>
                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Etat des livrables :
                  </h4>
                  <div className="deliverables-status" style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <span className={`deliverable-status ${project.deliverables.pressKitReady ? 'ready' : 'pending'}`} style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: project.deliverables.pressKitReady ? '#d1fae5' : '#fef3c7',
                      color: project.deliverables.pressKitReady ? '#065f46' : '#92400e',
                      fontWeight: '500'
                    }}>
                      {project.deliverables.pressKitReady ? '✓' : '○'} Press Kit
                    </span>
                    <span className={`deliverable-status ${project.deliverables.socialMediaReady ? 'ready' : 'pending'}`} style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: project.deliverables.socialMediaReady ? '#d1fae5' : '#fef3c7',
                      color: project.deliverables.socialMediaReady ? '#065f46' : '#92400e',
                      fontWeight: '500'
                    }}>
                      {project.deliverables.socialMediaReady ? '✓' : '○'} Reseaux sociaux
                    </span>
                    <span className={`deliverable-status ${project.deliverables.promotionMaterialsReady ? 'ready' : 'pending'}`} style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: project.deliverables.promotionMaterialsReady ? '#d1fae5' : '#fef3c7',
                      color: project.deliverables.promotionMaterialsReady ? '#065f46' : '#92400e',
                      fontWeight: '500'
                    }}>
                      {project.deliverables.promotionMaterialsReady ? '✓' : '○'} Promotion
                    </span>
                  </div>
                </div>
              )}

              <div className="project-card-footer" style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button className="btn-primary select-project-btn" style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}>
                  Creer une session d'appels
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="workflow-info" style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <div className="workflow-steps" style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div className="step completed" style={{
            background: '#10b981',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            1. Artiste selectionne: {artist.name}
          </div>
          <div className="step active" style={{
            background: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            2. Choisir le projet
          </div>
          <div className="step" style={{
            background: '#e5e7eb',
            color: '#6b7280',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            3. Creer la session
          </div>
          <div className="step" style={{
            background: '#e5e7eb',
            color: '#6b7280',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            4. Commencer les appels
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionPage;