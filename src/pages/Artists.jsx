import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Layout from "../components/Layout";
import { uploadImageToCloudinary } from "../services/cloudinary";
import artistsService from "../services/artistsApi";

const Artists = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    },
    odesliLinks: null,
    isLoadingLinks: false,
    avatar: ""
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageMode, setStorageMode] = useState('local'); // local, dropbox, googledrive
  const [cloudConnections, setCloudConnections] = useState({
    dropbox: false,
    googledrive: false
  });

  // Charger les artistes depuis l'API au montage du composant
  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const artistsData = await artistsService.getArtists();
      setArtists(artistsData);
      console.log('✅ Artistes chargés depuis l\'API:', artistsData.length);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des artistes:', err);
      setError('Impossible de charger les artistes. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

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

  // Fonction pour gérer l'upload d'avatar vers Cloudinary
  const handleAvatarUpload = async (event, isEditMode = false) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, etc.)');
      return;
    }

    // Vérifier la taille (max 10MB pour Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setUploadProgress(0);

      // Pour l'instant, utilisons une URL temporaire locale avec FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = {
          url: e.target.result, // URL base64 temporaire
          publicId: `temp_${Date.now()}`,
          displayName: file.name,
          originalFilename: file.name
        };

        // Mettre à jour l'état approprié avec l'URL locale
        if (isEditMode) {
          setEditingArtist(prev => ({
            ...prev,
            avatar: result.url,
            avatarPublicId: result.publicId
          }));
        } else {
          setNewArtist(prev => ({
            ...prev,
            avatar: result.url,
            avatarPublicId: result.publicId
          }));
        }

        alert('Avatar chargé avec succès !');
        setUploadingAvatar(false);
        setUploadProgress(0);
      };

      reader.onerror = () => {
        console.error('Erreur lors de la lecture du fichier');
        alert('Erreur lors de la lecture du fichier');
        setUploadingAvatar(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert(`Erreur lors de l'upload: ${error.message}`);
      setUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  // Fonction pour récupérer les liens Odesli et métadonnées depuis Spotify artiste
  const fetchOdesliLinks = async (spotifyUrl) => {
    if (!spotifyUrl) {
      alert('Veuillez entrer une URL Spotify valide');
      return;
    }

    setNewArtist(prev => ({ ...prev, isLoadingLinks: true }));

    try {
      // Timeout après 10 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.linksByPlatform) {
        let artistUpdates = {
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

        // Synchroniser l'avatar de l'artiste si pas encore défini
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

            artistUpdates.avatar = imageUrl;
            console.log('Avatar URL récupérée:', imageUrl);
          } else {
            console.warn('URL d\'avatar invalide ou incomplète:', imageUrl);
          }
        }

        // Ajouter le nom de l'artiste si disponible
        if (bestEntity && bestEntity.artistName && !newArtist.name.trim()) {
          artistUpdates.name = bestEntity.artistName;
        }

        setNewArtist(prev => ({
          ...prev,
          ...artistUpdates
        }));

        alert('Informations Spotify récupérées avec succès !');
      } else {
        throw new Error('Aucune donnée trouvée pour cette URL');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des liens Odesli:', error);

      let errorMessage = 'Erreur lors de la récupération des informations Spotify';
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - La récupération a pris trop de temps';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'URL Spotify non valide ou non trouvée';
      }

      alert(errorMessage);
      setNewArtist(prev => ({ ...prev, isLoadingLinks: false }));
    }
  };

  // Fonction pour récupérer les liens Odesli en mode édition
  const fetchOdesliLinksForEdit = async (spotifyUrl) => {
    if (!spotifyUrl) {
      alert('Veuillez entrer une URL Spotify valide');
      return;
    }

    try {
      // Timeout après 10 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.linksByPlatform) {
        let artistUpdates = {
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

        // Synchroniser l'avatar de l'artiste
        if (bestEntity && bestEntity.thumbnailUrl) {
          let imageUrl = bestEntity.thumbnailUrl;

          // Vérifier que l'URL est complète et valide
          if (imageUrl && imageUrl.startsWith('http')) {
            // Pour Spotify, optimiser la résolution si possible
            if (bestEntity.apiProvider === 'spotify' && imageUrl.includes('/ab67616d')) {
              if (!imageUrl.match(/\/ab67616d[^\/]+\/[a-f0-9]{40}$/)) {
                console.log('URL Spotify incomplète, utilisation de l\'originale:', imageUrl);
              } else {
                imageUrl = imageUrl.replace(/\/ab67616d[^\/]+\//, '/ab67616d0000b273/');
              }
            }

            artistUpdates.avatar = imageUrl;
            console.log('Avatar URL récupérée pour édition:', imageUrl);
          } else {
            console.warn('URL d\'avatar invalide ou incomplète:', imageUrl);
          }
        }

        setEditingArtist(prev => ({
          ...prev,
          ...artistUpdates
        }));

        alert('Informations Spotify récupérées avec succès !');
      } else {
        throw new Error('Aucune donnée trouvée pour cette URL');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des liens Odesli:', error);

      let errorMessage = 'Erreur lors de la récupération des informations Spotify';
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - La récupération a pris trop de temps';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'URL Spotify non valide ou non trouvée';
      }

      alert(errorMessage);
      setEditingArtist(prev => ({ ...prev, isLoadingLinks: false }));
    }
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

  const handleCreateArtist = async (e) => {
    e.preventDefault();

    if (!newArtist.name.trim()) {
      alert('Le nom de l\'artiste est requis');
      return;
    }

    try {
      setLoading(true);

      const artistData = {
        ...newArtist,
        avatar: newArtist.avatar || `https://via.placeholder.com/60x60/0ED894/FFFFFF?text=${newArtist.name.charAt(0)}`,
        projectsCount: 0
      };

      console.log('Création artiste via API:', artistData);

      // Créer l'artiste via l'API
      const createdArtist = await artistsService.createArtist(artistData);

      // Mettre à jour la liste locale
      setArtists(prevArtists => [...prevArtists, createdArtist]);

      // Notification de succès
      alert(`Artiste "${newArtist.name}" créé avec succès et synchronisé sur tous vos appareils !`);

      console.log('✅ Artiste créé avec succès:', createdArtist);
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'artiste:', error);
      alert('Erreur lors de la création de l\'artiste. Veuillez réessayer.');
      return;
    } finally {
      setLoading(false);
    }
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
      },
      odesliLinks: null,
      isLoadingLinks: false,
      avatar: ""
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

  // Fonction pour éditer un artiste
  const handleEditArtist = (artist) => {
    setEditingArtist({
      ...artist,
      isLoadingLinks: false
    });
    setShowEditForm(true);
  };

  // Fonction pour mettre à jour un artiste
  const handleUpdateArtist = async (e) => {
    e.preventDefault();

    if (!editingArtist.name.trim()) {
      alert('Le nom de l\'artiste est requis');
      return;
    }

    try {
      setLoading(true);

      console.log('Mise à jour artiste via API:', editingArtist);

      // Mettre à jour l'artiste via l'API
      const updatedArtist = await artistsService.updateArtist(editingArtist.id || editingArtist._id, editingArtist);

      // Mettre à jour la liste locale
      setArtists(prevArtists =>
        prevArtists.map(artist =>
          (artist.id === editingArtist.id || artist._id === editingArtist._id) ? updatedArtist : artist
        )
      );

      alert(`Artiste "${editingArtist.name}" modifié avec succès et synchronisé sur tous vos appareils !`);
      setShowEditForm(false);
      setEditingArtist(null);

      console.log('✅ Artiste mis à jour avec succès:', updatedArtist);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'artiste:', error);
      alert('Erreur lors de la mise à jour de l\'artiste. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Artistes" subtitle="Gestion de vos artistes et leurs projets">
      <div className="page-header">
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
        >
          + Nouvel artiste
        </button>
        {loading && (
          <div className="loading-indicator">
            <span>Synchronisation en cours...</span>
          </div>
        )}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={loadArtists} className="btn-tertiary">
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Section vide - aucun artiste */}
      {!loading && artists.length === 0 && (
        <div className="empty-state" style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '40px 20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>👤 Aucun artiste pour le moment</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Créez votre premier artiste pour commencer à gérer vos projets et campagnes de presse.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            + Créer mon premier artiste
          </button>
        </div>
      )}

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
                    <label htmlFor="avatarUpload">Photo de l'artiste</label>
                    <div className="avatar-upload-section">
                      <div className="avatar-upload-zone">
                        <input
                          type="file"
                          id="avatarUpload"
                          accept="image/*"
                          onChange={(e) => handleAvatarUpload(e, false)}
                          style={{ display: 'none' }}
                          disabled={uploadingAvatar}
                        />
                        <label htmlFor="avatarUpload" className={`avatar-upload-button ${uploadingAvatar ? 'uploading' : ''}`}>
                          {uploadingAvatar ? (
                            <div className="avatar-uploading">
                              <div className="upload-progress-circle">
                                <svg viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#0ED894"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                  />
                                </svg>
                                <span className="progress-text">{uploadProgress}%</span>
                              </div>
                              <p>Upload en cours...</p>
                            </div>
                          ) : newArtist.avatar && !newArtist.avatar.includes('placeholder') ? (
                            <img src={newArtist.avatar} alt="Avatar de l'artiste" className="avatar-preview" />
                          ) : (
                            <div className="avatar-placeholder">
                              <span>📷</span>
                              <p>Cliquer pour uploader une photo</p>
                              <small>JPG, PNG • Max 10MB</small>
                            </div>
                          )}
                        </label>
                      </div>
                      {newArtist.avatar && !newArtist.avatar.includes('placeholder') && (
                        <button
                          type="button"
                          className="btn-tertiary remove-avatar-btn"
                          onClick={() => setNewArtist({...newArtist, avatar: ''})}
                        >
                          Supprimer la photo
                        </button>
                      )}
                    </div>
                    <p className="form-helper">
                      Vous pouvez uploader une photo ou récupérer automatiquement l'image depuis Spotify
                    </p>
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
                        <div className="url-input-group">
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
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => fetchOdesliLinks(newArtist.socialLinks.spotify)}
                            disabled={!newArtist.socialLinks.spotify || newArtist.isLoadingLinks}
                          >
                            {newArtist.isLoadingLinks ? 'Chargement...' : 'Récupérer infos'}
                          </button>
                        </div>
                        <p className="form-helper">
                          Collez l'URL Spotify de l'artiste pour récupérer automatiquement photo et informations
                        </p>
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

                    {newArtist.avatar && !newArtist.avatar.includes('placeholder') && (
                      <div className="form-group">
                        <label>Aperçu de l'avatar synchronisé</label>
                        <div className="cover-preview">
                          <img src={newArtist.avatar} alt="Avatar de l'artiste" className="cover-image" />
                          <div className="cover-info">
                            <p>✅ Photo importée depuis Spotify</p>
                            <p className="cover-url">{newArtist.avatar}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {newArtist.odesliLinks && (
                      <div className="form-group">
                        <label>Liens plateformes générés</label>
                        <div className="platforms-grid">
                          {Object.entries(newArtist.odesliLinks).map(([platform, data]) => (
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

          {showEditForm && editingArtist && (
            <section className="dashboard-section">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2 className="chart-title">Modifier l'artiste : {editingArtist.name}</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingArtist(null);
                    }}
                  >
                    Annuler
                  </button>
                </div>

                <form onSubmit={handleUpdateArtist} className="campaign-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editName">Nom de l'artiste *</label>
                      <input
                        type="text"
                        id="editName"
                        value={editingArtist.name}
                        onChange={(e) => setEditingArtist({...editingArtist, name: e.target.value})}
                        placeholder="Ex: Dadju"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="editGenre">Genre musical</label>
                      <input
                        type="text"
                        id="editGenre"
                        value={editingArtist.genre || ''}
                        onChange={(e) => setEditingArtist({...editingArtist, genre: e.target.value})}
                        placeholder="Ex: R&B, Pop, Rap..."
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editAvatarUpload">Photo de l'artiste</label>
                    <div className="avatar-upload-section">
                      <div className="avatar-upload-zone">
                        <input
                          type="file"
                          id="editAvatarUpload"
                          accept="image/*"
                          onChange={(e) => handleAvatarUpload(e, true)}
                          style={{ display: 'none' }}
                          disabled={uploadingAvatar}
                        />
                        <label htmlFor="editAvatarUpload" className={`avatar-upload-button ${uploadingAvatar ? 'uploading' : ''}`}>
                          {uploadingAvatar ? (
                            <div className="avatar-uploading">
                              <div className="upload-progress-circle">
                                <svg viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#0ED894"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                  />
                                </svg>
                                <span className="progress-text">{uploadProgress}%</span>
                              </div>
                              <p>Upload en cours...</p>
                            </div>
                          ) : editingArtist.avatar && !editingArtist.avatar.includes('placeholder') ? (
                            <img src={editingArtist.avatar} alt="Avatar de l'artiste" className="avatar-preview" />
                          ) : (
                            <div className="avatar-placeholder">
                              <span>📷</span>
                              <p>Cliquer pour uploader une photo</p>
                              <small>JPG, PNG • Max 10MB</small>
                            </div>
                          )}
                        </label>
                      </div>
                      {editingArtist.avatar && !editingArtist.avatar.includes('placeholder') && (
                        <button
                          type="button"
                          className="btn-tertiary remove-avatar-btn"
                          onClick={() => setEditingArtist({...editingArtist, avatar: ''})}
                        >
                          Supprimer la photo
                        </button>
                      )}
                    </div>
                    <p className="form-helper">
                      Vous pouvez uploader une photo ou récupérer automatiquement l'image depuis Spotify
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editLabel">Label / Maison de disques</label>
                    <input
                      type="text"
                      id="editLabel"
                      value={editingArtist.label || ''}
                      onChange={(e) => setEditingArtist({...editingArtist, label: e.target.value})}
                      placeholder="Ex: Universal Music, Sony Music..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editBiography">Biographie courte</label>
                    <textarea
                      id="editBiography"
                      value={editingArtist.biography || ''}
                      onChange={(e) => setEditingArtist({...editingArtist, biography: e.target.value})}
                      placeholder="Biographie courte pour la presse (2-3 phrases maximum)..."
                      rows="3"
                    />
                  </div>

                  <div className="form-section">
                    <h3>Réseaux sociaux</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="editInstagram">Instagram</label>
                        <input
                          type="url"
                          id="editInstagram"
                          value={editingArtist.socialLinks?.instagram || ''}
                          onChange={(e) => setEditingArtist({
                            ...editingArtist,
                            socialLinks: {...(editingArtist.socialLinks || {}), instagram: e.target.value}
                          })}
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="editSpotify">Spotify</label>
                        <div className="url-input-group">
                          <input
                            type="url"
                            id="editSpotify"
                            value={editingArtist.socialLinks?.spotify || ''}
                            onChange={(e) => setEditingArtist({
                              ...editingArtist,
                              socialLinks: {...(editingArtist.socialLinks || {}), spotify: e.target.value}
                            })}
                            placeholder="https://open.spotify.com/artist/..."
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              const spotifyUrl = editingArtist.socialLinks?.spotify;
                              if (!spotifyUrl) {
                                alert('Veuillez entrer une URL Spotify valide');
                                return;
                              }
                              // Adapter la fonction pour l'édition
                              setEditingArtist(prev => ({ ...prev, isLoadingLinks: true }));
                              fetchOdesliLinksForEdit(spotifyUrl);
                            }}
                            disabled={!editingArtist.socialLinks?.spotify || editingArtist.isLoadingLinks}
                          >
                            {editingArtist.isLoadingLinks ? 'Chargement...' : 'Récupérer infos'}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="editYoutube">YouTube</label>
                        <input
                          type="url"
                          id="editYoutube"
                          value={editingArtist.socialLinks?.youtube || ''}
                          onChange={(e) => setEditingArtist({
                            ...editingArtist,
                            socialLinks: {...(editingArtist.socialLinks || {}), youtube: e.target.value}
                          })}
                          placeholder="https://youtube.com/@channel"
                        />
                      </div>
                    </div>

                    {editingArtist.avatar && !editingArtist.avatar.includes('placeholder') && (
                      <div className="form-group">
                        <label>Avatar actuel</label>
                        <div className="cover-preview">
                          <img src={editingArtist.avatar} alt="Avatar de l'artiste" className="cover-image" />
                          <div className="cover-info">
                            <p>✅ Avatar de l'artiste</p>
                            <p className="cover-url">{editingArtist.avatar}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Mettre à jour l'artiste
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingArtist(null);
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
                    <button
                      className="btn-tertiary"
                      onClick={() => handleEditArtist(artist)}
                    >
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