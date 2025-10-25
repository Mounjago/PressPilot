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

  const handleGenerateReport = async (artist) => {
    try {
      // In a real implementation, you'd fetch projects for this artist from the API
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

      const allProjects = await response.json();
      const artistProjects = allProjects.filter(project => project.artist === artist.name);

      if (artistProjects.length === 0) {
        alert(`Aucun projet trouvé pour ${artist.name}`);
        return;
      }

      // Show project selection modal
      showProjectSelectionModal(artist, artistProjects);

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport');
    }
  };

  const showProjectSelectionModal = (artist, projects) => {
    const modalContent = `
      <div class="modal-overlay" id="projectModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>Sélectionner un projet pour le rapport</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-content">
            <p>Artiste: <strong>${artist.name}</strong></p>
            <p>Sélectionnez le projet pour lequel vous souhaitez générer un rapport détaillé:</p>
            <div class="project-selection-list">
              ${projects.map(project => `
                <div class="project-option" onclick="generateProjectReport('${project._id}', '${project.name}', '${artist.name}')">
                  <h4>${project.name}</h4>
                  <p>${project.type} • ${project.genre}</p>
                  <p>Sortie: ${new Date(project.releaseDate).toLocaleDateString('fr-FR')}</p>
                  <span class="project-status ${project.status}">${project.status}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalContent;
    document.body.appendChild(modalDiv);

    // Add global functions for modal interaction
    window.closeModal = () => {
      document.getElementById('projectModal').remove();
    };

    window.generateProjectReport = async (projectId, projectName, artistName) => {
      try {
        document.getElementById('projectModal').remove();

        // Show loading
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-container">
              <div class="modal-content text-center">
                <div class="loading-spinner"></div>
                <p>Génération du rapport en cours...</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(loadingDiv);

        // Generate report
        const token = localStorage.getItem('authToken');
        const reportResponse = await fetch(`/api/project-reports/quick-generate/${projectId}?reportType=full`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!reportResponse.ok) {
          throw new Error('Erreur lors de la génération du rapport');
        }

        const reportData = await reportResponse.json();
        loadingDiv.remove();

        // Show report
        showReportModal(reportData.report, projectName, artistName);

      } catch (error) {
        console.error('Erreur rapport:', error);
        loadingDiv.remove();
        alert('Erreur lors de la génération du rapport');
      }
    };
  };

  const showReportModal = (report, projectName, artistName) => {
    const formatDate = (dateString) => {
      return dateString ? new Date(dateString).toLocaleDateString('fr-FR') : 'Non définie';
    };

    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const modalContent = `
      <div class="modal-overlay" id="reportModal">
        <div class="modal-container large">
          <div class="modal-header">
            <h3>Rapport - ${projectName} (${artistName})</h3>
            <button class="modal-close" onclick="closeReportModal()">×</button>
          </div>
          <div class="modal-content">
            <div class="report-content">
              <!-- Project Info -->
              <section class="report-section">
                <h4>Informations du projet</h4>
                <div class="project-info-grid">
                  <div class="info-item">
                    <label>Nom:</label>
                    <span>${report.session.project.name}</span>
                  </div>
                  <div class="info-item">
                    <label>Artiste:</label>
                    <span>${report.session.project.artist}</span>
                  </div>
                  <div class="info-item">
                    <label>Type:</label>
                    <span>${report.session.project.type}</span>
                  </div>
                  <div class="info-item">
                    <label>Genre:</label>
                    <span>${report.session.project.genre}</span>
                  </div>
                  <div class="info-item">
                    <label>Label:</label>
                    <span>${report.session.project.label}</span>
                  </div>
                  <div class="info-item">
                    <label>Date de sortie:</label>
                    <span>${formatDate(report.session.project.releaseDate)}</span>
                  </div>
                </div>
              </section>

              <!-- Email Statistics -->
              <section class="report-section">
                <h4>📧 Statistiques Emails</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <label>Campagnes:</label>
                    <span>${report.emailStats.totalCampaigns}</span>
                  </div>
                  <div class="stat-item">
                    <label>Emails envoyés:</label>
                    <span>${report.emailStats.totalEmailsSent}</span>
                  </div>
                  <div class="stat-item">
                    <label>Taux d'ouverture:</label>
                    <span>${report.emailStats.openRate}%</span>
                  </div>
                  <div class="stat-item">
                    <label>Taux de réponse:</label>
                    <span>${report.emailStats.replyRate}%</span>
                  </div>
                </div>

                ${report.emailStats.campaigns.length > 0 ? `
                  <div class="campaigns-list">
                    <h5>Détail des campagnes:</h5>
                    ${report.emailStats.campaigns.map(campaign => `
                      <div class="campaign-item">
                        <h6>${campaign.name}</h6>
                        <p><strong>Sujet:</strong> ${campaign.subject}</p>
                        <p><strong>Envoyé le:</strong> ${formatDate(campaign.sentAt)}</p>
                        <div class="campaign-stats">
                          <span>${campaign.emailsSent} envois</span>
                          <span>${campaign.emailsOpened} ouvertures</span>
                          <span>${campaign.emailsReplied} réponses</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : '<p>Aucune campagne email</p>'}
              </section>

              <!-- Call Statistics -->
              <section class="report-section">
                <h4>📞 Statistiques Appels</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <label>Sessions:</label>
                    <span>${report.callStats.totalSessions}</span>
                  </div>
                  <div class="stat-item">
                    <label>Appels passés:</label>
                    <span>${report.callStats.totalCalls}</span>
                  </div>
                  <div class="stat-item">
                    <label>Taux de réponse:</label>
                    <span>${report.callStats.successRate}%</span>
                  </div>
                  <div class="stat-item">
                    <label>Durée totale:</label>
                    <span>${formatDuration(report.callStats.totalDuration)}</span>
                  </div>
                </div>

                ${report.callStats.callLogs.length > 0 ? `
                  <div class="calls-list">
                    <h5>Détail des appels:</h5>
                    ${report.callStats.callLogs.map(call => `
                      <div class="call-item">
                        <div class="call-header">
                          <h6>${call.contactName}</h6>
                          <span class="call-status ${call.status}">${call.status}</span>
                        </div>
                        <p><strong>Média:</strong> ${call.mediaName}</p>
                        <p><strong>Date:</strong> ${formatDate(call.date)}</p>
                        <p><strong>Durée:</strong> ${formatDuration(call.duration)}</p>
                        <p><strong>Résultat:</strong> ${call.outcome || 'Non défini'}</p>
                        <div class="call-comments">
                          <strong>Commentaires:</strong>
                          <p>${call.comments}</p>
                        </div>
                        ${call.journalistFeedback && Object.keys(call.journalistFeedback).some(key => call.journalistFeedback[key]) ? `
                          <div class="journalist-feedback">
                            <strong>Feedback journaliste:</strong>
                            ${call.journalistFeedback.mediaInterest ? `<p>Intérêt: ${call.journalistFeedback.mediaInterest}</p>` : ''}
                            ${call.journalistFeedback.preferredFormat ? `<p>Format: ${call.journalistFeedback.preferredFormat}</p>` : ''}
                            ${call.journalistFeedback.deadline ? `<p>Deadline: ${formatDate(call.journalistFeedback.deadline)}</p>` : ''}
                            ${call.journalistFeedback.additionalRequests ? `<p>Demandes: ${call.journalistFeedback.additionalRequests}</p>` : ''}
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : '<p>Aucun appel</p>'}
              </section>

              <!-- Media Contacted -->
              <section class="report-section">
                <h4>📺 Médias Contactés</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <label>Total contactés:</label>
                    <span>${report.contactStats.totalContacted}</span>
                  </div>
                  <div class="stat-item">
                    <label>Médias uniques:</label>
                    <span>${report.contactStats.uniqueMedias}</span>
                  </div>
                </div>

                ${report.mediaContacted.length > 0 ? `
                  <div class="media-list">
                    <h5>Liste des médias:</h5>
                    <ul>
                      ${report.mediaContacted.map(media => `<li>${media}</li>`).join('')}
                    </ul>
                  </div>
                ` : '<p>Aucun média contacté</p>'}
              </section>

              <!-- Interested Medias -->
              ${report.interestedMedias.length > 0 ? `
                <section class="report-section">
                  <h4>⭐ Médias Intéressés</h4>
                  <div class="interested-media-list">
                    ${report.interestedMedias.map(media => `
                      <div class="interested-media-item">
                        <h6>${media.name}</h6>
                        <p><strong>Contact:</strong> ${media.contactName}</p>
                        <p><strong>Niveau d'intérêt:</strong> ${media.interestLevel}</p>
                        <p><strong>Format préféré:</strong> ${media.preferredFormat}</p>
                        ${media.deadline ? `<p><strong>Deadline:</strong> ${formatDate(media.deadline)}</p>` : ''}
                        ${media.notes ? `<p><strong>Notes:</strong> ${media.notes}</p>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </section>
              ` : ''}

              <!-- Outcomes Summary -->
              <section class="report-section">
                <h4>📊 Résumé des Résultats</h4>
                <div class="outcomes-grid">
                  <div class="outcome-item">
                    <label>Interviews:</label>
                    <span>${report.outcomes.interviews}</span>
                  </div>
                  <div class="outcome-item">
                    <label>Reviews:</label>
                    <span>${report.outcomes.reviews}</span>
                  </div>
                  <div class="outcome-item">
                    <label>Features:</label>
                    <span>${report.outcomes.features}</span>
                  </div>
                  <div class="outcome-item">
                    <label>Rappels demandés:</label>
                    <span>${report.outcomes.callbacksRequested}</span>
                  </div>
                  <div class="outcome-item">
                    <label>Pas intéressés:</label>
                    <span>${report.outcomes.notInterested}</span>
                  </div>
                  <div class="outcome-item">
                    <label>Emails de suivi:</label>
                    <span>${report.outcomes.followUpEmails}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" onclick="downloadReport('${projectName}', '${artistName}')">
              Télécharger PDF
            </button>
            <button class="btn-secondary" onclick="closeReportModal()">
              Fermer
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalContent;
    document.body.appendChild(modalDiv);

    // Add global functions for modal interaction
    window.closeReportModal = () => {
      document.getElementById('reportModal').remove();
    };

    window.downloadReport = (projectName, artistName) => {
      // Create and download JSON report
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${artistName.replace(/\s+/g, '-')}-${projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };
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
                    <button
                      className="btn-secondary"
                      onClick={() => handleGenerateReport(artist)}
                    >
                      Rapport
                    </button>
                    <button className="btn-tertiary">
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