import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart } from "lucide-react";
import "../styles/Dashboard.css";
import Layout from "../components/Layout";
import CampaignDetailsModal from "../components/CampaignDetailsModal";

const Projects = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

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
    if (!spotifyUrl) {
      alert('Veuillez entrer une URL Spotify valide');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3535';
    console.log('🎵 Fetching Odesli links for:', spotifyUrl);
    console.log('🔗 Using API URL:', apiUrl);

    setNewProject(prev => ({ ...prev, isLoadingLinks: true }));

    try {
      // Timeout après 30 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Utiliser notre proxy backend au lieu d'appeler directement l'API Odesli
      const response = await fetch(`${apiUrl}/odesli/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: spotifyUrl }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

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

          // Vérifier que l'URL est complète et valide
          if (imageUrl && imageUrl.startsWith('http')) {
            // Pour Spotify, optimiser la résolution si possible
            if (bestEntity.apiProvider === 'spotify' && imageUrl.includes('/ab67616d')) {
              // S'assurer qu'on a le hash complet et pas juste le pattern
              if (!imageUrl.match(/\/ab67616d[^\/]+\/[a-f0-9]{40}$/)) {
                // Si pas de hash complet, garder l'URL originale
                console.log('URL Spotify incomplète, utilisation de l\'originale:', imageUrl);
              } else {
                // Remplacer par une résolution plus élevée si on a le hash complet
                imageUrl = imageUrl.replace(/\/ab67616d[^\/]+\//, '/ab67616d0000b273/');
              }
            }

            projectUpdates.cover = imageUrl;
            console.log('Cover URL récupérée:', imageUrl);
          } else {
            console.warn('URL d\'image invalide ou incomplète:', imageUrl);
          }
        }

        // Fallback : essayer d'extraire l'image depuis l'URL Spotify directement
        if (!projectUpdates.cover && spotifyUrl) {
          const spotifyIdMatch = spotifyUrl.match(/(?:album|track)\/([a-zA-Z0-9]{22})/);
          if (spotifyIdMatch) {
            // Utiliser l'API Spotify Web pour récupérer l'image
            console.log('Tentative de récupération d\'image via ID Spotify:', spotifyIdMatch[1]);
            // Pour l'instant, on log juste pour debug, on pourrait implémenter l'API Spotify ici
          }
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

        alert('Informations Spotify récupérées avec succès !');
      } else {
        throw new Error('Aucune donnée trouvée pour cette URL');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des liens Odesli:', error);

      let errorMessage = 'Erreur lors de la récupération des informations Spotify';

      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - La récupération a pris trop de temps (plus de 30 secondes)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('💥 Message d\'erreur détaillé:', errorMessage);
      alert(`${errorMessage}\n\nVérifiez la console pour plus de détails.`);
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
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowCampaignModal(true);
    }
  };

  const handleViewReport = (projectId) => {
    // Naviguer vers Analytics avec le projet pré-sélectionné
    navigate(`/analytics?project=${projectId}`);
  };

  const handleEditProject = (project) => {
    console.log('🔧 Edit button clicked for project:', project);
    setEditingProject({
      ...project,
      spotifyUrl: project.spotifyUrl || "",
      isLoadingLinks: false
    });
    console.log('🔧 Setting showEditForm to true');
    setShowEditForm(true);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();

    const updatedProjects = projects.map(project =>
      project.id === editingProject.id ? editingProject : project
    );

    setProjects(updatedProjects);
    localStorage.setItem(`presspilot-projects-${artistId}`, JSON.stringify(updatedProjects));

    setShowEditForm(false);
    setEditingProject(null);
  };

  const fetchOdesliLinksForEdit = async (spotifyUrl) => {
    if (!spotifyUrl) {
      alert('Veuillez entrer une URL Spotify valide');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3535';
    console.log('🎵 Fetching Odesli links for edit:', spotifyUrl);
    console.log('🔗 Using API URL:', apiUrl);

    setEditingProject(prev => ({ ...prev, isLoadingLinks: true }));

    try {
      // Timeout après 30 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Utiliser notre proxy backend au lieu d'appeler directement l'API Odesli
      const response = await fetch(`${apiUrl}/odesli/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: spotifyUrl }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status (edit):', response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

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

        // Synchroniser les images (cover art) si pas encore définie ou si placeholder
        if (bestEntity && bestEntity.thumbnailUrl) {
          let imageUrl = bestEntity.thumbnailUrl;

          // Vérifier que l'URL est complète et valide
          if (imageUrl && imageUrl.startsWith('http')) {
            // Pour Spotify, optimiser la résolution si possible
            if (bestEntity.apiProvider === 'spotify' && imageUrl.includes('/ab67616d')) {
              // S'assurer qu'on a le hash complet et pas juste le pattern
              if (!imageUrl.match(/\/ab67616d[^\/]+\/[a-f0-9]{40}$/)) {
                // Si pas de hash complet, garder l'URL originale
                console.log('URL Spotify incomplète, utilisation de l\'originale:', imageUrl);
              } else {
                // Remplacer par une résolution plus élevée si on a le hash complet
                imageUrl = imageUrl.replace(/\/ab67616d[^\/]+\//, '/ab67616d0000b273/');
              }
            }

            projectUpdates.cover = imageUrl;
            console.log('Cover URL récupérée (édition):', imageUrl);
          } else {
            console.warn('URL d\'image invalide ou incomplète (édition):', imageUrl);
          }
        }

        setEditingProject(prev => ({
          ...prev,
          ...projectUpdates
        }));

        alert('Informations Spotify récupérées avec succès !');
      } else {
        throw new Error('Aucune donnée trouvée pour cette URL');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des liens Odesli (edit):', error);

      let errorMessage = 'Erreur lors de la récupération des informations Spotify';

      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - La récupération a pris trop de temps (plus de 30 secondes)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('💥 Message d\'erreur détaillé (edit):', errorMessage);
      alert(`${errorMessage}\n\nVérifiez la console pour plus de détails.`);
      setEditingProject(prev => ({ ...prev, isLoadingLinks: false }));
    }
  };

  return (
    <Layout title={`Projets - ${artist.name}`} subtitle={artist.genre}>
      <div className="breadcrumb">
        <button onClick={() => navigate('/artists')} className="breadcrumb-link">
          Artistes
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{artist.name}</span>
      </div>

      <div className="page-header">
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

          {console.log('🔧 Render check - showEditForm:', showEditForm, 'editingProject:', editingProject) || (showEditForm && editingProject) && (
            <section className="dashboard-section">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2 className="chart-title">Modifier le projet - {editingProject.name}</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProject(null);
                    }}
                  >
                    Annuler
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="campaign-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-name">Nom du projet *</label>
                      <input
                        type="text"
                        id="edit-name"
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                        placeholder="Ex: KING, Single été 2024..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-type">Type de projet</label>
                      <select
                        id="edit-type"
                        value={editingProject.type}
                        onChange={(e) => setEditingProject({...editingProject, type: e.target.value})}
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
                      <label htmlFor="edit-releaseDate">Date de sortie</label>
                      <input
                        type="date"
                        id="edit-releaseDate"
                        value={editingProject.releaseDate}
                        onChange={(e) => setEditingProject({...editingProject, releaseDate: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-targetAudience">Audience cible</label>
                      <select
                        id="edit-targetAudience"
                        value={editingProject.targetAudience}
                        onChange={(e) => setEditingProject({...editingProject, targetAudience: e.target.value})}
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
                    <label htmlFor="edit-description">Description du projet</label>
                    <textarea
                      id="edit-description"
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                      placeholder="Décrivez le projet, ses objectifs, son concept..."
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-spotifyUrl">URL Spotify (optionnel)</label>
                    <div className="url-input-group">
                      <input
                        type="url"
                        id="edit-spotifyUrl"
                        value={editingProject.spotifyUrl}
                        onChange={(e) => setEditingProject({...editingProject, spotifyUrl: e.target.value})}
                        placeholder="https://open.spotify.com/album/..."
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fetchOdesliLinksForEdit(editingProject.spotifyUrl)}
                        disabled={!editingProject.spotifyUrl || editingProject.isLoadingLinks}
                      >
                        {editingProject.isLoadingLinks ? 'Chargement...' : 'Récupérer les liens'}
                      </button>
                    </div>
                    <p className="form-helper">
                      Collez l'URL Spotify pour générer automatiquement les liens vers toutes les plateformes
                    </p>
                  </div>

                  {editingProject.cover && !editingProject.cover.includes('placeholder') && (
                    <div className="form-group">
                      <label>Aperçu de la pochette synchronisée</label>
                      <div className="cover-preview">
                        <img src={editingProject.cover} alt="Pochette du projet" className="cover-image" />
                        <div className="cover-info">
                          <p>✅ Pochette importée depuis Spotify</p>
                          <p className="cover-url">{editingProject.cover}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingProject.odesliLinks && (
                    <div className="form-group">
                      <label>Liens plateformes générés</label>
                      <div className="platforms-grid">
                        {Object.entries(editingProject.odesliLinks).map(([platform, data]) => (
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
                      Mettre à jour le projet
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingProject(null);
                      }}
                    >
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
                    <img
                      src={project.cover || `https://via.placeholder.com/120x120/0ED894/FFFFFF?text=${project.name.substring(0, 3).toUpperCase()}`}
                      alt={project.name}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/120x120/0ED894/FFFFFF?text=${project.name.substring(0, 3).toUpperCase()}`;
                      }}
                    />
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
                    <button
                      className="btn-tertiary"
                      onClick={() => handleViewReport(project.id)}
                    >
                      <BarChart size={16} />
                      Rapport
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEditProject(project)}
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {showCampaignModal && selectedProject && (
            <CampaignDetailsModal
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              onClose={() => {
                setShowCampaignModal(false);
                setSelectedProject(null);
              }}
            />
          )}

    </Layout>
  );
};

export default Projects;