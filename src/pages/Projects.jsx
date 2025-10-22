import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import logo from "../assets/logo-bandstream.png";
import Sidebar from "../components/Sidebar";

const Projects = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Récupérer les données réelles depuis localStorage
  const getArtist = () => {
    const savedArtists = localStorage.getItem('presspilot-artists');
    if (savedArtists) {
      const artists = JSON.parse(savedArtists);
      return artists.find(artist => artist.id.toString() === artistId) || { id: artistId, name: "Artiste introuvable", genre: "" };
    }
    return { id: artistId, name: "Aucun artiste", genre: "" };
  };

  const artist = getArtist();

  // Récupérer les projets depuis localStorage
  const getProjects = () => {
    const savedProjects = localStorage.getItem(`presspilot-projects-${artistId}`);
    if (savedProjects) {
      return JSON.parse(savedProjects);
    }
    return [];
  };

  const [projects, setProjects] = useState(getProjects());

  const [newProject, setNewProject] = useState({
    name: "",
    type: "Album",
    releaseDate: "",
    description: "",
    targetAudience: "general",
    spotifyUrl: "",
    cover: "",
    odesliLinks: null,
    isLoadingLinks: false
  });

  // Fonction pour récupérer les liens Odesli et métadonnées
  const fetchOdesliLinks = async (spotifyUrl) => {
    if (!spotifyUrl) return;

    setNewProject(prev => ({ ...prev, isLoadingLinks: true }));

    try {
      const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`);
      const data = await response.json();

      if (data.linksByPlatform) {
        let projectUpdates = {
          odesliLinks: data.linksByPlatform,
          isLoadingLinks: false
        };

        // Extraire les métadonnées depuis entitiesByUniqueId
        const entities = data.entitiesByUniqueId || {};
        let bestEntity = null;

        // Chercher l'entité avec le plus d'informations
        for (const [key, entity] of Object.entries(entities)) {
          if (entity.title && entity.thumbnailUrl) {
            bestEntity = entity;
            // Priorité à Spotify si disponible
            if (entity.apiProvider === 'spotify') {
              break;
            }
          }
        }

        // Synchroniser le nom du projet si pas encore défini
        if (bestEntity && bestEntity.title && !newProject.name.trim()) {
          projectUpdates.name = bestEntity.title;
        }

        // Synchroniser les images (cover art)
        if (bestEntity && bestEntity.thumbnailUrl) {
          let imageUrl = bestEntity.thumbnailUrl;

          // Pour Spotify, essayer d'obtenir une meilleure résolution
          if (bestEntity.apiProvider === 'spotify') {
            // Les URLs Spotify suivent le pattern: https://i.scdn.co/image/ab67616d0000b273{hash}
            // Remplacer par une résolution plus élevée si possible
            imageUrl = bestEntity.thumbnailUrl.replace(/\/ab67616d[^\/]+/, '/ab67616d0000b273');
          }

          projectUpdates.cover = imageUrl;
        }

        // Ajouter l'artiste si disponible
        if (bestEntity && bestEntity.artistName) {
          const artistInfo = `Artiste: ${bestEntity.artistName}`;
          if (!newProject.description.includes(bestEntity.artistName)) {
            projectUpdates.description = newProject.description.trim() ?
              `${newProject.description.trim()}\n\n${artistInfo}` :
              artistInfo;
          }
        }

        setNewProject(prev => ({
          ...prev,
          ...projectUpdates
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des liens Odesli:', error);
      setNewProject(prev => ({ ...prev, isLoadingLinks: false }));
    }
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    const project = {
      id: Date.now(),
      ...newProject,
      status: "En préparation",
      campaignsCount: 0,
      cover: newProject.cover || `https://via.placeholder.com/120x120/0ED894/FFFFFF?text=${newProject.name.substring(0, 3).toUpperCase()}`
    };

    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);

    // Sauvegarder dans localStorage
    localStorage.setItem(`presspilot-projects-${artistId}`, JSON.stringify(updatedProjects));

    setNewProject({
      name: "",
      type: "Album",
      releaseDate: "",
      description: "",
      targetAudience: "general",
      spotifyUrl: "",
      cover: "",
      odesliLinks: null,
      isLoadingLinks: false
    });
    setShowCreateForm(false);
  };

  const handleViewCampaigns = (projectId) => {
    navigate(`/artists/${artistId}/projects/${projectId}/campaigns`);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <img src={logo} alt="Logo PressPilot" className="logo" />
          <div className="app-name">PressPilot</div>
        </div>
        <div className="user-menu">
          <div className="avatar">JP</div>
        </div>
      </header>

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <div className="breadcrumb">
            <button onClick={() => navigate('/artists')} className="breadcrumb-link">
              Artistes
            </button>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">{artist.name}</span>
          </div>

          <div className="page-header">
            <div>
              <h1 className="dashboard-title">Projets - {artist.name}</h1>
              <p className="page-subtitle">{artist.genre}</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Nouveau projet
            </button>
          </div>

          {showCreateForm && (
            <section className="dashboard-section">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2 className="chart-title">Créer un nouveau projet</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="campaign-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nom du projet *</label>
                      <input
                        type="text"
                        id="name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        placeholder="Ex: KING, Single été 2024..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="type">Type de projet</label>
                      <select
                        id="type"
                        value={newProject.type}
                        onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                      >
                        <option value="Album">Album</option>
                        <option value="EP">EP</option>
                        <option value="Single">Single</option>
                        <option value="Mixtape">Mixtape</option>
                        <option value="Concert">Concert/Tournée</option>
                        <option value="Collaboration">Collaboration</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="releaseDate">Date de sortie</label>
                      <input
                        type="date"
                        id="releaseDate"
                        value={newProject.releaseDate}
                        onChange={(e) => setNewProject({...newProject, releaseDate: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="targetAudience">Audience cible</label>
                      <select
                        id="targetAudience"
                        value={newProject.targetAudience}
                        onChange={(e) => setNewProject({...newProject, targetAudience: e.target.value})}
                      >
                        <option value="presse-generaliste">Presse généraliste</option>
                        <option value="presse-musicale">Presse musicale spécialisée</option>
                        <option value="medias-digitaux">Médias digitaux & blogs</option>
                        <option value="radios">Radios musicales</option>
                        <option value="medias-urbains">Médias urbains</option>
                        <option value="presse-internationale">Presse internationale</option>
                        <option value="influenceurs">Influenceurs & créateurs</option>
                        <option value="tous">Tous les médias</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description du projet</label>
                    <textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Décrivez le projet, ses objectifs, son concept..."
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="spotifyUrl">URL Spotify (optionnel)</label>
                    <div className="url-input-group">
                      <input
                        type="url"
                        id="spotifyUrl"
                        value={newProject.spotifyUrl}
                        onChange={(e) => setNewProject({...newProject, spotifyUrl: e.target.value})}
                        placeholder="https://open.spotify.com/album/..."
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fetchOdesliLinks(newProject.spotifyUrl)}
                        disabled={!newProject.spotifyUrl || newProject.isLoadingLinks}
                      >
                        {newProject.isLoadingLinks ? 'Chargement...' : 'Récupérer les liens'}
                      </button>
                    </div>
                    <p className="form-helper">
                      Collez l'URL Spotify pour générer automatiquement les liens vers toutes les plateformes
                    </p>
                  </div>

                  {newProject.cover && (
                    <div className="form-group">
                      <label>Aperçu de la pochette synchronisée</label>
                      <div className="cover-preview">
                        <img src={newProject.cover} alt="Pochette du projet" className="cover-image" />
                        <div className="cover-info">
                          <p>✅ Pochette importée depuis Spotify</p>
                          <p className="cover-url">{newProject.cover}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {newProject.odesliLinks && (
                    <div className="form-group">
                      <label>Liens plateformes générés</label>
                      <div className="platforms-grid">
                        {Object.entries(newProject.odesliLinks).map(([platform, data]) => (
                          <div key={platform} className="platform-link">
                            <span className="platform-name">{platform}</span>
                            <a href={data.url} target="_blank" rel="noopener noreferrer" className="platform-url">
                              {data.url.length > 40 ? data.url.substring(0, 40) + '...' : data.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Créer le projet
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-cover">
                    <img src={project.cover} alt={project.name} />
                    <div className="project-type-badge">{project.type}</div>
                  </div>

                  <div className="project-info">
                    <h3 className="project-name">{project.name}</h3>
                    <p className="project-description">{project.description}</p>

                    <div className="project-meta">
                      <div className="project-date">
                        <strong>Sortie:</strong> {new Date(project.releaseDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="project-status">
                        <span className={`status-badge ${project.status === 'Actif' ? 'active' : 'pending'}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <div className="project-stats">
                      <span className="campaigns-count">
                        {project.campaignsCount} campagne{project.campaignsCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="project-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleViewCampaigns(project.id)}
                    >
                      Voir les campagnes
                    </button>
                    <button className="btn-secondary">
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Projects;