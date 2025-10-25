import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, Music, Users, TrendingUp, Edit3, Trash2, Eye, Upload, Play } from "lucide-react";
import "../styles/Dashboard.css";
import "../styles/DashboardExtended.css";
import "../styles/ContactsNew.css";
import "../styles/Projects.css";

// Composants
import Layout from "../components/Layout";
import ProjectModal from "../components/ProjectModal";

const ProjectsNew = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [user, setUser] = useState(null);

  // Stats des projets
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    upcoming: 0
  });


  useEffect(() => {
    loadProjects();
    fetchUserData();
  }, []);

  useEffect(() => {
    filterProjects();
    calculateStats();
  }, [projects, searchTerm, filterStatus, filterType]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Les projets seront chargés depuis l'API
      setProjects([]);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(term) ||
        project.artist?.toLowerCase().includes(term) ||
        project.genre?.toLowerCase().includes(term) ||
        project.label?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(project => project.type === filterType);
    }

    setFilteredProjects(filtered);
  };

  const calculateStats = () => {
    const total = projects.length;
    const active = projects.filter(p => p.status === "active").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const upcoming = projects.filter(p => p.status === "upcoming").length;

    setStats({ total, active, completed, upcoming });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "#10b981";
      case "completed": return "#6366f1";
      case "upcoming": return "#f59e0b";
      case "paused": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active": return "En cours";
      case "completed": return "Terminé";
      case "upcoming": return "À venir";
      case "paused": return "En pause";
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "album": return "💿";
      case "single": return "🎵";
      case "ep": return "🎶";
      case "tour": return "🎤";
      case "collaboration": return "🤝";
      default: return "🎼";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "album": return "Album";
      case "single": return "Single";
      case "ep": return "EP";
      case "tour": return "Tournée";
      case "collaboration": return "Collaboration";
      default: return type;
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowCreateModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowCreateModal(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      try {
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const getRemainingDays = (releaseDate) => {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Layout title="Projets" subtitle="Gérez vos projets musicaux et leurs campagnes">

          {/* Statistiques des projets */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
                <Music style={{ color: "#2196F3" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Projets</p>
                <h3 className="stat-value">{stats.total}</h3>
                <span className="stat-subtitle">Tous types confondus</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
                <Play style={{ color: "#4CAF50" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">En cours</p>
                <h3 className="stat-value">{stats.active}</h3>
                <span className="stat-subtitle">Projets actifs</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#F3E5F5" }}>
                <TrendingUp style={{ color: "#9C27B0" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Terminés</p>
                <h3 className="stat-value">{stats.completed}</h3>
                <span className="stat-subtitle">Projets finalisés</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#FFF3E0" }}>
                <Calendar style={{ color: "#FF9800" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">À venir</p>
                <h3 className="stat-value">{stats.upcoming}</h3>
                <span className="stat-subtitle">Projets planifiés</span>
              </div>
            </div>
          </section>

          {/* En-tête avec actions */}
          <div className="contacts-header">
            <div className="contacts-title-section">
              <span className="contacts-count">
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="contacts-actions">
              <button className="btn-primary" onClick={handleCreateProject}>
                <Plus />
                Nouveau projet
              </button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <section className="contacts-filters">
            <div className="contacts-search">
              <Search />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="contacts-filter-controls">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="contacts-filter-select"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">En cours</option>
                <option value="completed">Terminés</option>
                <option value="upcoming">À venir</option>
                <option value="paused">En pause</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="contacts-filter-select"
              >
                <option value="all">Tous les types</option>
                <option value="album">Albums</option>
                <option value="single">Singles</option>
                <option value="ep">EPs</option>
                <option value="tour">Tournées</option>
              </select>
            </div>
          </section>

          {/* Liste des projets */}
          <section className="projects-grid">
            {loading ? (
              <div className="contacts-loading">
                <div className="contacts-loading-spinner"></div>
                <span>Chargement des projets...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="contacts-empty">
                <Music className="contacts-empty-icon" />
                <h3>Aucun projet trouvé</h3>
                <p>Créez votre premier projet pour commencer.</p>
                <button className="btn-primary" onClick={handleCreateProject}>
                  <Plus />
                  Créer un projet
                </button>
              </div>
            ) : (
              <div className="projects-list">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-card-header">
                      <div className="project-cover">
                        {project.cover ? (
                          <img src={project.cover} alt={project.name} />
                        ) : (
                          <div className="project-cover-placeholder">
                            {getTypeIcon(project.type)}
                          </div>
                        )}
                      </div>

                      <div className="project-info">
                        <div className="project-meta">
                          <span className="project-type">{getTypeLabel(project.type)}</span>
                          <span
                            className="project-status"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          >
                            {getStatusLabel(project.status)}
                          </span>
                        </div>
                        <h3 className="project-name">{project.name}</h3>
                        <p className="project-artist">{project.artist}</p>
                        <p className="project-genre">{project.genre} • {project.label}</p>
                      </div>

                      <div className="project-actions">
                        <button
                          className="project-action-btn view"
                          title="Voir le projet"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="project-action-btn edit"
                          onClick={() => handleEditProject(project)}
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="project-action-btn delete"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="project-card-body">
                      <div className="project-description">
                        <p>{project.description}</p>
                      </div>

                      <div className="project-progress">
                        <div className="progress-header">
                          <span>Progression</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="project-metrics">
                        <div className="metric">
                          <Calendar size={16} />
                          <div>
                            <span className="metric-label">Sortie</span>
                            <span className="metric-value">
                              {formatDate(project.releaseDate)}
                              {project.status !== 'completed' && (
                                <small>
                                  {getRemainingDays(project.releaseDate) > 0
                                    ? ` (dans ${getRemainingDays(project.releaseDate)} jours)`
                                    : ' (dépassé)'
                                  }
                                </small>
                              )}
                            </span>
                          </div>
                        </div>

                        {project.tracks > 0 && (
                          <div className="metric">
                            <Music size={16} />
                            <div>
                              <span className="metric-label">Titres</span>
                              <span className="metric-value">{project.tracks}</span>
                            </div>
                          </div>
                        )}

                        <div className="metric">
                          <Users size={16} />
                          <div>
                            <span className="metric-label">Contacts</span>
                            <span className="metric-value">{project.contacts}</span>
                          </div>
                        </div>

                        <div className="metric">
                          <TrendingUp size={16} />
                          <div>
                            <span className="metric-label">Campagnes</span>
                            <span className="metric-value">{project.campaigns}</span>
                          </div>
                        </div>
                      </div>

                      <div className="project-budget">
                        <div className="budget-header">
                          <span>Budget</span>
                          <span>{project.spent.toLocaleString()} € / {project.budget.toLocaleString()} €</span>
                        </div>
                        <div className="budget-bar">
                          <div
                            className="budget-fill"
                            style={{ width: `${(project.spent / project.budget) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="project-status-indicators">
                        <div className={`status-indicator ${project.pressKitReady ? 'ready' : 'pending'}`}>
                          <span>Press Kit</span>
                          {project.pressKitReady ? '✓' : '○'}
                        </div>
                        <div className={`status-indicator ${project.socialMediaReady ? 'ready' : 'pending'}`}>
                          <span>Réseaux Sociaux</span>
                          {project.socialMediaReady ? '✓' : '○'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

      {/* Modal de création/édition */}
      {showCreateModal && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setShowCreateModal(false)}
          onSave={(projectData) => {
            if (selectedProject) {
              // Modifier projet existant
              setProjects(projects.map(p =>
                p.id === selectedProject.id ? { ...p, ...projectData } : p
              ));
            } else {
              // Créer nouveau projet
              const newProject = {
                ...projectData,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                progress: 0,
                campaigns: 0,
                contacts: 0,
                spent: 0
              };
              setProjects([...projects, newProject]);
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </Layout>
  );
};

export default ProjectsNew;