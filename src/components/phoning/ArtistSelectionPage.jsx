import React, { useState, useEffect } from 'react';
import { User, Music, Calendar, Search } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
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

      // Récupérer les artistes depuis l'API projects (groupés par artiste)
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des projets');
      }

      const projects = await response.json();

      // Grouper les projets par artiste
      const artistsMap = new Map();

      projects.forEach(project => {
        if (!artistsMap.has(project.artist)) {
          artistsMap.set(project.artist, {
            name: project.artist,
            projectsCount: 0,
            projects: [],
            genres: new Set(),
            latestProject: null,
            totalBudget: 0
          });
        }

        const artist = artistsMap.get(project.artist);
        artist.projectsCount++;
        artist.projects.push(project);
        artist.genres.add(project.genre);
        artist.totalBudget += project.budget?.total || 0;

        if (!artist.latestProject || new Date(project.createdAt) > new Date(artist.latestProject.createdAt)) {
          artist.latestProject = project;
        }
      });

      // Convertir en tableau et trier
      const artistsList = Array.from(artistsMap.values()).map(artist => ({
        ...artist,
        genres: Array.from(artist.genres).join(', '),
        avatar: `https://via.placeholder.com/60x60/0ED894/FFFFFF?text=${artist.name.charAt(0)}`
      })).sort((a, b) => a.name.localeCompare(b.name));

      setArtists(artistsList);
    } catch (error) {
      console.error('Erreur lors du chargement des artistes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artist.genres.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || artist.genres.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  const uniqueGenres = [...new Set(artists.flatMap(artist =>
    artist.genres.split(', ').map(genre => genre.trim())
  ))].filter(Boolean).sort();

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
                  <p className="artist-genres">{artist.genres}</p>
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