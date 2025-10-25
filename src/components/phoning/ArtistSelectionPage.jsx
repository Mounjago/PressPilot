import React, { useState, useEffect } from 'react';
import { User, Music, Calendar, Search } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { projectsApi } from '../../api';
import '../../styles/Dashboard.css';

const ArtistSelectionPage = ({ onSelectArtist, onBack }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);

      // Récupérer les artistes depuis le localStorage (comme dans /artistes)
      const savedArtists = localStorage.getItem('presspilot-artists');
      let artistsData = [];

      if (savedArtists) {
        artistsData = JSON.parse(savedArtists);
      }

      // Récupérer les projets pour enrichir les données des artistes
      let projects = [];
      try {
        projects = await projectsApi.getAll();
      } catch (error) {
        console.warn('Impossible de charger les projets:', error);
      }

      // Enrichir les artistes avec les données des projets depuis localStorage
      const enrichedArtists = artistsData.map(artist => {
        // Récupérer les projets de cet artiste depuis localStorage
        const savedProjects = localStorage.getItem(`presspilot-projects-${artist.id}`);
        let artistProjects = [];

        if (savedProjects) {
          artistProjects = JSON.parse(savedProjects);
        }

        // Récupérer l'image du projet le plus récent avec cover Odesli/Spotify
        let artistAvatar = artist.avatar;

        if (artistProjects.length > 0) {
          const latestProject = artistProjects.sort((a, b) =>
            new Date(b.createdAt || b.releaseDate) - new Date(a.createdAt || a.releaseDate)
          )[0];

          // Utiliser la cover du projet le plus récent si disponible
          if (latestProject.cover && !latestProject.cover.includes('placeholder')) {
            artistAvatar = latestProject.cover;
          }
        }

        // Fallback vers l'avatar de l'artiste ou placeholder
        if (!artistAvatar) {
          artistAvatar = `https://via.placeholder.com/60x60/0ED894/FFFFFF?text=${artist.name.charAt(0)}`;
        }

        return {
          ...artist,
          projectsCount: artistProjects.length,
          projects: artistProjects,
          genres: artist.genre || 'Non spécifié',
          latestProject: artistProjects.length > 0 ?
            artistProjects.sort((a, b) => new Date(b.createdAt || b.releaseDate) - new Date(a.createdAt || a.releaseDate))[0] :
            null,
          avatar: artistAvatar
        };
      });

      setArtists(enrichedArtists);
    } catch (error) {
      console.error('Erreur lors du chargement des artistes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist => {
    const genreString = typeof artist.genres === 'string' ? artist.genres :
                       Array.isArray(artist.genres) ? artist.genres.join(', ') : 'Non spécifié';

    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         genreString.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || genreString.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  const uniqueGenres = [...new Set(artists.map(artist => {
    const genreString = typeof artist.genres === 'string' ? artist.genres :
                       Array.isArray(artist.genres) ? artist.genres.join(', ') : 'Non spécifié';
    return genreString.split(', ').map(genre => genre.trim());
  }).flat())].filter(Boolean).sort();

  if (loading) {
    return (
      <div className="phoning-workflow-step">
        <div className="step-header">
          <h2>Sélection de l'artiste</h2>
          <button className="btn-secondary" onClick={onBack}>
            ← Retour
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="phoning-workflow-step">
      <div className="step-header">
        <div>
          <h2>Sélection de l'artiste</h2>
          <p className="step-description">
            Choisissez l'artiste pour lequel vous souhaitez créer une session d'appels
          </p>
        </div>
        <button className="btn-secondary" onClick={onBack}>
          ← Retour au tableau de bord
        </button>
      </div>

      <div className="search-and-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un artiste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="genre-filter">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les genres</option>
            {uniqueGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="empty-state">
          <User size={64} className="empty-icon" />
          <h3>Aucun artiste trouvé</h3>
          <p>
            {searchTerm || selectedGenre !== 'all'
              ? 'Aucun artiste ne correspond à vos critères de recherche.'
              : 'Vous n\'avez encore aucun projet créé. Créez d\'abord un projet pour pouvoir faire des appels.'
            }
          </p>
          {!searchTerm && selectedGenre === 'all' && (
            <button className="btn-primary" onClick={() => window.location.href = '/projects'}>
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="artists-selection-grid">
          {filteredArtists.map((artist, index) => (
            <div
              key={`${artist.name}-${index}`}
              className="artist-selection-card"
              onClick={() => onSelectArtist(artist)}
            >
              <div className="artist-card-header">
                <div className="artist-avatar">
                  <img src={artist.avatar} alt={artist.name} />
                </div>
                <div className="artist-basic-info">
                  <h3 className="artist-name">{artist.name}</h3>
                  <p className="artist-genres">{
                    typeof artist.genres === 'string' ? artist.genres :
                    Array.isArray(artist.genres) ? artist.genres.join(', ') : 'Non spécifié'
                  }</p>
                </div>
              </div>

              <div className="artist-stats">
                <div className="stat-item">
                  <Music className="stat-icon" />
                  <span className="stat-value">{artist.projectsCount}</span>
                  <span className="stat-label">projet{artist.projectsCount > 1 ? 's' : ''}</span>
                </div>

                {artist.latestProject && (
                  <div className="stat-item">
                    <Calendar className="stat-icon" />
                    <span className="stat-value">
                      {new Date(artist.latestProject.releaseDate).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="stat-label">dernier projet</span>
                  </div>
                )}
              </div>

              <div className="artist-projects-preview">
                <h4>Projets récents :</h4>
                <ul className="projects-list">
                  {artist.projects.slice(0, 3).map(project => (
                    <li key={project._id} className="project-item">
                      <span className="project-name">{project.name}</span>
                      <span className={`project-status status-${project.status}`}>
                        {project.status}
                      </span>
                    </li>
                  ))}
                  {artist.projects.length > 3 && (
                    <li className="project-item more-projects">
                      +{artist.projects.length - 3} autre{artist.projects.length - 3 > 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </div>

              <div className="artist-card-footer">
                <button className="btn-primary select-artist-btn">
                  Sélectionner cet artiste
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="workflow-info">
        <div className="workflow-steps">
          <div className="step active">1. Sélectionner l'artiste</div>
          <div className="step">2. Choisir le projet</div>
          <div className="step">3. Créer la session</div>
          <div className="step">4. Commencer les appels</div>
        </div>
      </div>
    </div>
  );
};

export default ArtistSelectionPage;