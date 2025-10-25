import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Layout from "../components/Layout";

const Artists = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Initialiser les artistes depuis localStorage ou avec un tableau vide
  const [artists, setArtists] = useState(() => {
    const savedArtists = localStorage.getItem('presspilot-artists');
    if (savedArtists) {
      return JSON.parse(savedArtists);
    }
    return [];
  });

  const [newArtist, setNewArtist] = useState({
    name: "",
    genre: "",
    label: "",
    biography: "",
    socialLinks: {
      instagram: "",
      spotify: "",
      youtube: ""
    },
    epk: {
      pressPhotos: [],
      biographyFull: "",
      audioSamples: [],
      videos: [],
      pressClippings: []
    }
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [storageMode, setStorageMode] = useState('local'); // local, dropbox, googledrive
  const [cloudConnections, setCloudConnections] = useState({
    dropbox: false,
    googledrive: false
  });

  // Fonction pour gérer l'upload des fichiers EPK
  const handleFileUpload = async (event, fileType) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          };

          // Créer preview pour les images
          if (file.type.startsWith('image/')) {
            fileData.preview = await createImagePreview(file);
          }

          // En production, ici vous uploaderiez le fichier vers votre serveur/cloud
          // fileData.url = await uploadToServer(file);

          // Pour la démo, on simule l'upload
          await new Promise(resolve => setTimeout(resolve, 500));
          fileData.url = URL.createObjectURL(file);

          return fileData;
        })
      );

      setNewArtist(prev => ({
        ...prev,
        epk: {
          ...prev.epk,
          [fileType]: [...prev.epk[fileType], ...processedFiles]
        }
      }));

    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload des fichiers');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Fonction pour créer un aperçu d'image
  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  // Fonction pour supprimer un fichier
  const removeFile = (fileType, index) => {
    setNewArtist(prev => ({
      ...prev,
      epk: {
        ...prev.epk,
        [fileType]: prev.epk[fileType].filter((_, i) => i !== index)
      }
    }));
  };

  // Fonction pour formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour gérer les connexions cloud
  const handleCloudStorage = async (provider) => {
    setStorageMode(provider);

    if (provider === 'local') {
      return;
    }

    try {
      if (provider === 'dropbox') {
        // Intégration Dropbox API
        console.log('Connexion à Dropbox...');
        // TODO: Intégrer l'API Dropbox
        // window.location.href = '/auth/dropbox';
        setCloudConnections(prev => ({ ...prev, dropbox: true }));
      } else if (provider === 'googledrive') {
        // Intégration Google Drive API
        console.log('Connexion à Google Drive...');
        // TODO: Intégrer l'API Google Drive
        // window.location.href = '/auth/googledrive';
        setCloudConnections(prev => ({ ...prev, googledrive: true }));
      }
    } catch (error) {
      console.error(`Erreur connexion ${provider}:`, error);
      alert(`Erreur lors de la connexion à ${provider}`);
    }
  };

  const handleCreateArtist = (e) => {
    e.preventDefault();

    if (!newArtist.name.trim()) {
      alert('Le nom de l\'artiste est requis');
      return;
    }

    const artist = {
      id: Date.now(),
      ...newArtist,
      avatar: `https://via.placeholder.com/60x60/0ED894/FFFFFF?text=${newArtist.name.charAt(0)}`,
      projectsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    console.log('Création artiste:', artist);
    const updatedArtists = [...artists, artist];
    setArtists(updatedArtists);

    // Sauvegarder dans localStorage
    localStorage.setItem('presspilot-artists', JSON.stringify(updatedArtists));

    // Notification de succès
    alert(`Artiste "${newArtist.name}" créé avec succès !`);
    setNewArtist({
      name: "",
      genre: "",
      label: "",
      biography: "",
      socialLinks: { instagram: "", spotify: "", youtube: "" },
      epk: {
        pressPhotos: [],
        biographyFull: "",
        audioSamples: [],
        videos: [],
        pressClippings: []
      }
    });
    setShowCreateForm(false);
  };

  const handleViewProjects = (artistId) => {
    navigate(`/artists/${artistId}/projects`);
  };

  return (
    <Layout title="Artistes" subtitle="Gestion de vos artistes et leurs projets">
      <div className="page-header">
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          + Nouvel artiste
        </button>
      </div>

          {showCreateForm && (
            <section className="dashboard-section">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2 className="chart-title">Ajouter un nouvel artiste</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </button>
                </div>

                <form onSubmit={handleCreateArtist} className="campaign-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nom de l'artiste *</label>
                      <input
                        type="text"
                        id="name"
                        value={newArtist.name}
                        onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
                        placeholder="Ex: Dadju"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="genre">Genre musical</label>
                      <input
                        type="text"
                        id="genre"
                        value={newArtist.genre}
                        onChange={(e) => setNewArtist({...newArtist, genre: e.target.value})}
                        placeholder="Ex: R&B, Pop, Rap..."
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="label">Label / Maison de disques</label>
                    <input
                      type="text"
                      id="label"
                      value={newArtist.label}
                      onChange={(e) => setNewArtist({...newArtist, label: e.target.value})}
                      placeholder="Ex: Universal Music, Sony Music..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="biography">Biographie courte</label>
                    <textarea
                      id="biography"
                      value={newArtist.biography}
                      onChange={(e) => setNewArtist({...newArtist, biography: e.target.value})}
                      placeholder="Biographie courte pour la presse (2-3 phrases maximum)..."
                      rows="3"
                    />
                    <p className="form-helper">
                      Maximum 200 caractères - Cette bio sera utilisée dans les communiqués de presse
                    </p>
                  </div>

                  <div className="form-section">
                    <h3>Réseaux sociaux</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="instagram">Instagram</label>
                        <input
                          type="url"
                          id="instagram"
                          value={newArtist.socialLinks.instagram}
                          onChange={(e) => setNewArtist({
                            ...newArtist,
                            socialLinks: {...newArtist.socialLinks, instagram: e.target.value}
                          })}
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="spotify">Spotify</label>
                        <input
                          type="url"
                          id="spotify"
                          value={newArtist.socialLinks.spotify}
                          onChange={(e) => setNewArtist({
                            ...newArtist,
                            socialLinks: {...newArtist.socialLinks, spotify: e.target.value}
                          })}
                          placeholder="https://open.spotify.com/artist/..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="youtube">YouTube</label>
                        <input
                          type="url"
                          id="youtube"
                          value={newArtist.socialLinks.youtube}
                          onChange={(e) => setNewArtist({
                            ...newArtist,
                            socialLinks: {...newArtist.socialLinks, youtube: e.target.value}
                          })}
                          placeholder="https://youtube.com/@channel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>EPK - Electronic Press Kit</h3>
                    <p className="form-helper epk-description">
                      Constituez le dossier de presse complet de l'artiste. Tous ces éléments seront stockés dans un EPK qui pourra être partagé facilement avec les médias.
                    </p>

                    <div className="epk-storage-options">
                      <h4>Options de stockage</h4>
                      <div className="storage-buttons">
                        <button
                          type="button"
                          className={`btn-storage ${storageMode === 'dropbox' ? 'active' : ''} ${cloudConnections.dropbox ? 'connected' : ''}`}
                          onClick={() => handleCloudStorage('dropbox')}
                        >
                          {cloudConnections.dropbox ? '✓ Dropbox connecté' : 'Connecter Dropbox'}
                        </button>
                        <button
                          type="button"
                          className={`btn-storage ${storageMode === 'googledrive' ? 'active' : ''} ${cloudConnections.googledrive ? 'connected' : ''}`}
                          onClick={() => handleCloudStorage('googledrive')}
                        >
                          {cloudConnections.googledrive ? '✓ Google Drive connecté' : 'Connecter Google Drive'}
                        </button>
                        <button
                          type="button"
                          className={`btn-storage ${storageMode === 'local' ? 'active' : ''}`}
                          onClick={() => handleCloudStorage('local')}
                        >
                          Upload local
                        </button>
                      </div>
                      <p className="storage-helper">
                        Vous pouvez utiliser vos dossiers cloud existants ou uploader directement vos fichiers
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="biographyFull">Biographie complète</label>
                      <textarea
                        id="biographyFull"
                        value={newArtist.epk.biographyFull}
                        onChange={(e) => setNewArtist({
                          ...newArtist,
                          epk: {...newArtist.epk, biographyFull: e.target.value}
                        })}
                        placeholder="Biographie détaillée de l'artiste pour la presse (historique, influences, discographie...)..."
                        rows="6"
                      />
                      <p className="form-helper">
                        Biographie complète pour les journalistes et médias
                      </p>
                    </div>

                    <div className="epk-uploads-grid">
                      <div className="form-group">
                        <label htmlFor="pressPhotos">Photos de presse</label>
                        <div className="file-upload-zone">
                          <input
                            type="file"
                            id="pressPhotos"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'pressPhotos')}
                            disabled={uploadingFiles}
                          />
                          <div className="upload-placeholder">
                            <span>+</span>
                            <p>Glissez vos photos ou cliquez pour sélectionner</p>
                            <small>JPG, PNG • Max 10MB par fichier</small>
                          </div>
                        </div>
                        {newArtist.epk.pressPhotos.length > 0 && (
                          <div className="uploaded-files">
                            {newArtist.epk.pressPhotos.map((file, index) => (
                              <div key={index} className="uploaded-file">
                                <img src={file.preview} alt={file.name} className="file-preview" />
                                <span className="file-name">{file.name}</span>
                                <button
                                  type="button"
                                  className="remove-file"
                                  onClick={() => removeFile('pressPhotos', index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="audioSamples">Extraits audio</label>
                        <div className="file-upload-zone">
                          <input
                            type="file"
                            id="audioSamples"
                            multiple
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, 'audioSamples')}
                            disabled={uploadingFiles}
                          />
                          <div className="upload-placeholder">
                            <span>+</span>
                            <p>Glissez vos fichiers audio ou cliquez pour sélectionner</p>
                            <small>MP3, WAV, FLAC • Max 50MB par fichier</small>
                          </div>
                        </div>
                        {newArtist.epk.audioSamples.length > 0 && (
                          <div className="uploaded-files">
                            {newArtist.epk.audioSamples.map((file, index) => (
                              <div key={index} className="uploaded-file">
                                <span className="file-icon">♪</span>
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <button
                                  type="button"
                                  className="remove-file"
                                  onClick={() => removeFile('audioSamples', index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="videos">Vidéos</label>
                        <div className="file-upload-zone">
                          <input
                            type="file"
                            id="videos"
                            multiple
                            accept="video/*"
                            onChange={(e) => handleFileUpload(e, 'videos')}
                            disabled={uploadingFiles}
                          />
                          <div className="upload-placeholder">
                            <span>+</span>
                            <p>Glissez vos vidéos ou cliquez pour sélectionner</p>
                            <small>MP4, MOV, AVI • Max 200MB par fichier</small>
                          </div>
                        </div>
                        {newArtist.epk.videos.length > 0 && (
                          <div className="uploaded-files">
                            {newArtist.epk.videos.map((file, index) => (
                              <div key={index} className="uploaded-file">
                                <span className="file-icon">▶</span>
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <button
                                  type="button"
                                  className="remove-file"
                                  onClick={() => removeFile('videos', index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="pressClippings">Revues de presse</label>
                        <div className="file-upload-zone">
                          <input
                            type="file"
                            id="pressClippings"
                            multiple
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={(e) => handleFileUpload(e, 'pressClippings')}
                            disabled={uploadingFiles}
                          />
                          <div className="upload-placeholder">
                            <span>+</span>
                            <p>Glissez vos articles ou cliquez pour sélectionner</p>
                            <small>PDF, DOC, JPG, PNG • Max 20MB par fichier</small>
                          </div>
                        </div>
                        {newArtist.epk.pressClippings.length > 0 && (
                          <div className="uploaded-files">
                            {newArtist.epk.pressClippings.map((file, index) => (
                              <div key={index} className="uploaded-file">
                                <span className="file-icon">■</span>
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <button
                                  type="button"
                                  className="remove-file"
                                  onClick={() => removeFile('pressClippings', index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {uploadingFiles && (
                      <div className="upload-progress">
                        <div className="upload-spinner"></div>
                        <span>Upload en cours...</span>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Créer l'artiste
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
            <div className="artists-grid">
              {artists.map((artist) => (
                <div key={artist.id} className="artist-card">
                  <div className="artist-avatar">
                    <img src={artist.avatar} alt={artist.name} />
                  </div>

                  <div className="artist-info">
                    <h3 className="artist-name">{artist.name}</h3>
                    <p className="artist-genre">{artist.genre}</p>
                    <p className="artist-label">{artist.label}</p>

                    <div className="artist-stats">
                      <span className="projects-count">
                        {artist.projectsCount} projet{artist.projectsCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="artist-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleViewProjects(artist.id)}
                    >
                      Voir les projets
                    </button>
                    <button className="btn-secondary">
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
    </Layout>
  );
};

export default Artists;