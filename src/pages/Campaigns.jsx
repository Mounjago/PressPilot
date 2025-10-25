import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api, { useMutation } from "../hooks/useApi";
import { contactsApi } from "../api";
import "../styles/Dashboard.css";
import "../styles/Templates.css";
import logo from "../assets/logo-bandstream.png";

// Composants réactivés
import CampaignList from "../components/CampaignList";
import CampaignListAdvanced from "../components/CampaignListAdvanced";
import Layout from "../components/Layout";
import RichTextEditor from "../components/RichTextEditor";
import TemplateSelector from "../components/TemplateSelector";
import VariableManager from "../components/VariableManager";
import TemplateBrandingManager from "../components/TemplateBrandingManager";
import TemplatePreview from "../components/TemplatePreview";

const Campaigns = () => {
  const { artistId, projectId } = useParams();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [artist, setArtist] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configuration API - Utilise l'instance api configurée avec auth automatique
  const { mutate } = useMutation();

  // Charger les données artiste et projet depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // ÉTAPE 1: Priorité localStorage (données locales créées)
        console.log('🔍 Recherche dans localStorage...', { artistId, projectId });
        const savedArtists = localStorage.getItem('presspilot-artists');
        const savedProjects = localStorage.getItem(`presspilot-projects-${artistId}`);

        let artistFromLocal = null;
        let projectFromLocal = null;

        if (savedArtists) {
          const artists = JSON.parse(savedArtists);
          artistFromLocal = artists.find(a => a.id.toString() === artistId);
        }

        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          projectFromLocal = projects.find(p => p.id.toString() === projectId);
        }

        // Si les données sont disponibles en local, les utiliser DIRECTEMENT
        if (artistFromLocal && projectFromLocal) {
          setArtist({
            _id: artistFromLocal.id,
            name: artistFromLocal.name,
            email: artistFromLocal.email,
            genre: artistFromLocal.genre,
            avatar: artistFromLocal.avatar
          });

          setProject({
            _id: projectFromLocal.id,
            name: projectFromLocal.name,
            type: projectFromLocal.type,
            status: projectFromLocal.status,
            cover: projectFromLocal.cover
          });

          console.log('✅ Données chargées depuis localStorage');
          console.log('✅ Artist:', artistFromLocal.name);
          console.log('✅ Project:', projectFromLocal.name);
          return; // EXIT EARLY - Pas besoin d'API
        }

        // ÉTAPE 2: Si données manquantes, fallback API
        console.log('⚡ Données manquantes en local, tentative API...');

        const requests = [];
        if (!artistFromLocal) {
          requests.push(api.get(`/artists/${artistId}`).catch(() => null));
        }
        if (!projectFromLocal) {
          requests.push(api.get(`/projects/${projectId}`).catch(() => null));
        }

        const responses = await Promise.all(requests);
        let responseIndex = 0;

        if (!artistFromLocal && responses[responseIndex]) {
          const artistResponse = responses[responseIndex];
          if (artistResponse?.data?.success) {
            setArtist(artistResponse.data.data);
            console.log('✅ Artist loaded via API');
          }
          responseIndex++;
        } else if (artistFromLocal) {
          setArtist({
            _id: artistFromLocal.id,
            name: artistFromLocal.name,
            email: artistFromLocal.email,
            genre: artistFromLocal.genre,
            avatar: artistFromLocal.avatar
          });
        }

        if (!projectFromLocal && responses[responseIndex]) {
          const projectResponse = responses[responseIndex];
          if (projectResponse?.data?.success) {
            setProject(projectResponse.data.data);
            console.log('✅ Project loaded via API');
          }
        } else if (projectFromLocal) {
          setProject({
            _id: projectFromLocal.id,
            name: projectFromLocal.name,
            type: projectFromLocal.type,
            status: projectFromLocal.status,
            cover: projectFromLocal.cover
          });
        }

      } catch (error) {
        console.error('Erreur chargement prioritaire:', error);

        try {
          // Fallback : charger le premier artist et project disponibles
          console.log('Tentative de fallback vers le premier artist/project disponible...');

          const [allArtistsResponse, allProjectsResponse] = await Promise.all([
            api.get(`/artists`),
            api.get(`/projects`)
          ]);

          if (allArtistsResponse.data.success && allArtistsResponse.data.data.length > 0) {
            const firstArtist = allArtistsResponse.data.data[0];
            setArtist(firstArtist);
            console.log('✅ Artist fallback loaded:', firstArtist.name);
          }

          if (allProjectsResponse.data.success && allProjectsResponse.data.data.length > 0) {
            const firstProject = allProjectsResponse.data.data[0];
            setProject(firstProject);
            console.log('✅ Project fallback loaded:', firstProject.name);
          }

        } catch (fallbackError) {
          console.error('Erreur fallback API:', fallbackError);

          // PRIORITY FALLBACK: localStorage (données existantes)
          console.log('🔄 Fallback vers localStorage...');
          const savedArtists = localStorage.getItem('presspilot-artists');
          const savedProjects = localStorage.getItem(`presspilot-projects-${artistId}`);

          if (savedArtists) {
            const artists = JSON.parse(savedArtists);
            const foundArtist = artists.find(a => a.id.toString() === artistId);
            if (foundArtist) {
              // Convertir format localStorage vers API
              setArtist({
                _id: foundArtist.id,
                name: foundArtist.name,
                email: foundArtist.email,
                genre: foundArtist.genre,
                avatar: foundArtist.avatar
              });
              console.log('✅ Artist récupéré depuis localStorage:', foundArtist.name);
            } else {
              setArtist({ _id: artistId, name: "Artiste introuvable" });
            }
          } else {
            setArtist({ _id: artistId, name: "Artiste introuvable" });
          }

          if (savedProjects) {
            const projects = JSON.parse(savedProjects);
            const foundProject = projects.find(p => p.id.toString() === projectId);
            if (foundProject) {
              // Convertir format localStorage vers API
              setProject({
                _id: foundProject.id,
                name: foundProject.name,
                type: foundProject.type,
                status: foundProject.status,
                cover: foundProject.cover
              });
              console.log('✅ Projet récupéré depuis localStorage:', foundProject.name);
            } else {
              setProject({ _id: projectId, name: "Projet introuvable", type: "" });
            }
          } else {
            setProject({ _id: projectId, name: "Projet introuvable", type: "" });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (artistId && projectId) {
      loadData();
    } else {
      // Si pas de paramètres, pas de chargement nécessaire
      setLoading(false);
    }
  }, [artistId, projectId]);

  const [contactLists, setContactLists] = useState([]);

  // Load contact lists grouped by category
  useEffect(() => {
    const loadContactLists = async () => {
      try {
        // Get contacts and group them by category
        const contacts = await contactsApi.getAll();

        // Group contacts by category to create contact lists
        const categoryGroups = contacts.reduce((groups, contact) => {
          const category = contact.category || 'Non catégorisé';
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(contact);
          return groups;
        }, {});

        // Convert to contact lists format
        const lists = Object.entries(categoryGroups).map(([category, contacts], index) => ({
          id: index + 1,
          name: category,
          count: contacts.length,
          description: `${contacts.length} contacts dans cette catégorie`,
          contacts: contacts
        }));

        setContactLists(lists);
      } catch (error) {
        console.error('Erreur lors du chargement des listes de contacts:', error);
        setContactLists([]);
      }
    };

    loadContactLists();
  }, []);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    content: "",
    contactListIds: [],
    scheduledDate: "",
    type: "communique",
    includeEPK: false,
    epkLink: "",
    useTemplate: false,
    selectedTemplate: null,
    templateVariables: {},
    templateBranding: {}
  });

  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    try {
      // Récupérer tous les contacts disponibles pour la campagne
      const contactsResponse = await api.get(`/contacts`);
      let targetContacts = [];

      if (contactsResponse.data.success && contactsResponse.data.data?.length > 0) {
        // Utiliser les premiers contacts disponibles (ou ceux sélectionnés par l'utilisateur)
        targetContacts = contactsResponse.data.data.slice(0, 3).map(contact => ({
          contactId: contact._id
        }));
      } else {
        // Si pas de contacts disponibles, retourner une erreur
        alert("Aucun contact disponible pour cette campagne. Veuillez d'abord créer des contacts.");
        return;
      }

      // Assurer que nous avons les vrais ObjectIds MongoDB
      let finalArtistId = newCampaign.artistId; // Mis à jour par handleTemplateSelect
      let finalProjectId = newCampaign.projectId; // Mis à jour par handleTemplateSelect

      // Fallback si pas encore de vrais IDs (cas de création sans template)
      if (!finalArtistId || finalArtistId.toString().length !== 24) {
        console.log('⚠️ Pas de vrai artistId, création nécessaire...');
        finalArtistId = await ensureArtistInMongoDB();
      }

      if (!finalProjectId || finalProjectId.toString().length !== 24) {
        console.log('⚠️ Pas de vrai projectId, création nécessaire...');
        finalProjectId = await ensureProjectInMongoDB(finalArtistId);
      }

      // Préparer les données de la campagne pour l'API
      const campaignData = {
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content || "Contenu de la campagne à définir",
        artistId: finalArtistId,
        projectId: finalProjectId,
        targetContacts: targetContacts
      };

      console.log("✅ Création campagne avec IDs MongoDB:", campaignData);

      // Envoyer à l'API
      const response = await api.post(`/campaigns`, campaignData);

      if (response.data.success) {
        console.log("Campagne créée avec succès:", response.data.data);

        // Réinitialiser le formulaire
        setShowCreateForm(false);
        setNewCampaign({
          name: "",
          subject: "",
          content: "",
          contactListIds: [],
          scheduledDate: "",
          type: "communique",
          includeEPK: false,
          epkLink: "",
          useTemplate: false,
          selectedTemplate: null,
          templateVariables: {},
          templateBranding: {}
        });

        // Optionnel: rafraîchir la liste des campagnes
        window.location.reload();
      } else {
        console.error("Erreur création campagne:", response.data.message);
        alert("Erreur lors de la création de la campagne: " + response.data.message);
      }

    } catch (error) {
      console.error("Erreur création campagne:", error);
      alert("Erreur lors de la création de la campagne: " + (error.response?.data?.message || error.message));
    }
  };

  const handleContactListToggle = (listId) => {
    setNewCampaign(prev => ({
      ...prev,
      contactListIds: prev.contactListIds.includes(listId)
        ? prev.contactListIds.filter(id => id !== listId)
        : [...prev.contactListIds, listId]
    }));
  };

  // Fonction pour générer un lien public EPK
  const generateEPKLink = () => {
    const artistId = artist?._id || artist?.id || 'unknown';
    const epkId = `epk_${artistId}_${Date.now()}`;
    const epkLink = `https://presspilot.com/epk/${epkId}`;

    setNewCampaign(prev => ({
      ...prev,
      includeEPK: true,
      epkLink: epkLink
    }));

    // En production, ici vous envoyez l'EPK vers votre API pour stockage
    console.log("EPK généré:", epkLink);
  };

  // Fonctions utilitaires pour assurer la cohérence MongoDB
  const ensureArtistInMongoDB = async () => {
    console.log('🎯 Vérification artiste en MongoDB...');

    // Si nous avons déjà un vrai ObjectId MongoDB, le retourner
    if (artist && artist._id && typeof artist._id === 'string' && artist._id.length === 24) {
      console.log('✅ Artiste existant:', artist._id);
      return artist._id;
    }

    // Sinon, créer l'artiste en MongoDB à partir des données localStorage
    try {
      const artistData = {
        name: artist?.name || 'Artiste inconnu',
        genre: artist?.genre || 'Non spécifié',
        location: artist?.location || '',
        description: artist?.description || '',
        website: artist?.website || '',
        socialLinks: artist?.socialLinks || {}
      };

      console.log('📝 Création artiste MongoDB:', artistData);
      const response = await mutate('/artists', { method: 'POST', data: artistData });

      if (response.success) {
        const mongoArtist = response.data;
        console.log('✅ Artiste créé en MongoDB:', mongoArtist._id);
        setArtist(mongoArtist); // Mettre à jour le state avec l'artiste MongoDB
        return mongoArtist._id;
      } else {
        throw new Error('Échec création artiste');
      }
    } catch (error) {
      console.error('❌ Erreur création artiste:', error);
      throw error;
    }
  };

  const ensureProjectInMongoDB = async (artistMongoId) => {
    console.log('🎯 Vérification projet en MongoDB...');

    // Si nous avons déjà un vrai ObjectId MongoDB, le retourner
    if (project && project._id && typeof project._id === 'string' && project._id.length === 24) {
      console.log('✅ Projet existant:', project._id);
      return project._id;
    }

    // Sinon, créer le projet en MongoDB à partir des données localStorage
    try {
      const projectData = {
        name: project?.name || 'Projet inconnu',
        description: project?.description || '',
        releaseDate: project?.releaseDate || '',
        status: project?.status || 'En préparation',
        artistId: artistMongoId
      };

      console.log('📝 Création projet MongoDB:', projectData);
      const response = await mutate('/projects', { method: 'POST', data: projectData });

      if (response.success) {
        const mongoProject = response.data;
        console.log('✅ Projet créé en MongoDB:', mongoProject._id);
        setProject(mongoProject); // Mettre à jour le state avec le projet MongoDB
        return mongoProject._id;
      } else {
        throw new Error('Échec création projet');
      }
    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      throw error;
    }
  };

  // Gestion des templates
  const handleTemplateSelect = async (template) => {
    console.log('🎨 Template sélectionné:', template.id);

    try {
      // 1. Assurer que nous avons les vrais ObjectIds MongoDB
      const realArtistId = await ensureArtistInMongoDB();
      const realProjectId = await ensureProjectInMongoDB(realArtistId);

      console.log('✅ IDs MongoDB confirmés:', { realArtistId, realProjectId });

      // 2. Mettre à jour le state avec le template ET les vrais IDs
      setNewCampaign(prev => ({
        ...prev,
        useTemplate: true,
        selectedTemplate: template,
        type: template.id,
        artistId: realArtistId,
        projectId: realProjectId
      }));

      setShowTemplatePreview(true);
    } catch (error) {
      console.error('❌ Erreur lors de la sélection template:', error);
      alert('Erreur lors de la préparation du template. Vérifiez que l\'artiste et le projet sont bien configurés.');
    }
  };

  const handleTemplateVariablesChange = (variables) => {
    setNewCampaign(prev => ({
      ...prev,
      templateVariables: variables
    }));
  };

  const handleTemplateBrandingChange = (branding) => {
    setNewCampaign(prev => ({
      ...prev,
      templateBranding: branding
    }));
  };

  const handleExportHTML = (htmlContent) => {
    console.log('HTML exporté:', htmlContent);
    // Ici vous pouvez sauvegarder le HTML ou l'envoyer à votre API
  };

  // État de chargement
  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Si on a des paramètres mais pas de données, afficher l'erreur
  if ((artistId && projectId) && (!artist || !project)) {
    return (
      <Layout title="CAMPAGNES" subtitle="Erreur de chargement">
        <div className="error-state">
          <h3>Erreur</h3>
          <p>Impossible de charger les données de l'artiste ou du projet.</p>
          <button onClick={() => navigate('/artists')} className="btn-secondary">
            Retour aux artistes
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="CAMPAGNES"
      subtitle={(artist && project) ? `${project.name} • ${artist.name}` : 'Gestion des campagnes de presse'}
    >
      <div className="campaign-header-actions">
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          + Nouvelle campagne
        </button>
      </div>

        {(artist && project) && (
          <div className="breadcrumb">
            <button onClick={() => navigate('/artists')} className="breadcrumb-link">
              Artistes
            </button>
            <span className="breadcrumb-separator">›</span>
            <button onClick={() => navigate(`/artists/${artistId}/projects`)} className="breadcrumb-link">
              {artist.name}
            </button>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">{project.name}</span>
          </div>
        )}


          {showCreateForm && (
            <section className="dashboard-section">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2 className="chart-title">Créer une nouvelle campagne</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="campaign-form">
                  <div className="form-group">
                    <label htmlFor="name">Nom de la campagne</label>
                    <input
                      type="text"
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      placeholder="Ex: Newsletter Janvier 2024"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Sujet de l'email</label>
                    <input
                      type="text"
                      id="subject"
                      value={newCampaign.subject}
                      onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                      placeholder="Ex: Découvrez nos nouveautés !"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="type">Type de campagne</label>
                      <select
                        id="type"
                        value={newCampaign.type}
                        onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                      >
                        <option value="communique">Communiqué de presse</option>
                        <option value="teaser">Teaser / Annonce</option>
                        <option value="interview">Demande d'interview</option>
                        <option value="review">Demande de chronique</option>
                        <option value="premiere">Première exclusive</option>
                        <option value="playlist">Demande playlist</option>
                        <option value="live">Invitation concert/showcase</option>
                        <option value="follow-up">Relance presse</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="scheduledDate">Date d'envoi</label>
                      <input
                        type="datetime-local"
                        id="scheduledDate"
                        value={newCampaign.scheduledDate}
                        onChange={(e) => setNewCampaign({...newCampaign, scheduledDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Listes de contacts à cibler</label>
                    <div className="contact-lists-grid">
                      {contactLists.length > 0 ? contactLists.map((list) => (
                        <div
                          key={list.id}
                          className={`contact-list-item ${newCampaign.contactListIds.includes(list.id) ? 'selected' : ''}`}
                          onClick={() => handleContactListToggle(list.id)}
                        >
                          <div className="contact-list-info">
                            <h4>{list.name}</h4>
                            <p className="contact-count">{list.count.toLocaleString()} contacts</p>
                            <p className="contact-description">{list.description}</p>
                          </div>
                          <div className="contact-list-checkbox">
                            <input
                              type="checkbox"
                              checked={newCampaign.contactListIds.includes(list.id)}
                              onChange={() => {}}
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="empty-state">
                          <div className="empty-state-content">
                            <p className="empty-state-title">Aucune liste de contacts disponible</p>
                            <p className="empty-state-description">
                              Vous devez d'abord ajouter des contacts pour créer une campagne.
                            </p>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => navigate('/contacts')}
                            >
                              Ajouter des contacts
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {contactLists.length > 0 && (
                      <p className="form-helper">
                        Total sélectionné: {contactLists
                          .filter(list => newCampaign.contactListIds.includes(list.id))
                          .reduce((sum, list) => sum + list.count, 0)
                          .toLocaleString()} contacts
                      </p>
                    )}
                  </div>

                  {/* Sélection du mode de création */}
                  <div className="form-group">
                    <label>Mode de création du contenu</label>
                    <div className="template-mode-selector" style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '15px',
                      marginTop: '10px'
                    }}>
                      <button
                        type="button"
                        onClick={() => setNewCampaign(prev => ({ ...prev, useTemplate: false }))}
                        className={`template-mode-option ${!newCampaign.useTemplate ? 'active' : ''}`}
                        style={{
                          padding: '20px',
                          border: !newCampaign.useTemplate ? '2px solid #0ED894' : '2px solid #e5e5e5',
                          borderRadius: '8px',
                          backgroundColor: !newCampaign.useTemplate ? '#f0fdf9' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                          ✏️ Éditeur libre
                        </div>
                        <div style={{ fontSize: '14px', color: '#666666' }}>
                          Rédigez votre contenu avec l'éditeur rich text
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewCampaign(prev => ({ ...prev, useTemplate: true }))}
                        className={`template-mode-option ${newCampaign.useTemplate ? 'active' : ''}`}
                        style={{
                          padding: '20px',
                          border: newCampaign.useTemplate ? '2px solid #0ED894' : '2px solid #e5e5e5',
                          borderRadius: '8px',
                          backgroundColor: newCampaign.useTemplate ? '#f0fdf9' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                          🎨 Template professionnel
                        </div>
                        <div style={{ fontSize: '14px', color: '#666666' }}>
                          Utilisez nos templates pré-conçus
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Contenu selon le mode sélectionné */}
                  {!newCampaign.useTemplate ? (
                    <div className="form-group">
                      <label htmlFor="content">Contenu de l'email</label>
                      <RichTextEditor
                        value={newCampaign.content}
                        onChange={(content) => setNewCampaign({...newCampaign, content})}
                        placeholder="Rédigez votre message... Vous pouvez utiliser le formatage, insérer des images, des liens, etc."
                      />
                      <p className="form-helper">
                        Utilisez la barre d'outils pour mettre en forme votre texte, ajouter des liens et insérer des images
                      </p>
                    </div>
                  ) : (
                    <div className="template-creation-section" style={{ marginBottom: '30px' }}>
                      {/* Sélecteur de template */}
                      <div style={{ marginBottom: '30px' }}>
                        <TemplateSelector
                          onTemplateSelect={handleTemplateSelect}
                          campaignType={newCampaign.type}
                          artistName={artist?.name || 'Artiste'}
                          projectName={project?.name || 'Projet'}
                        />
                      </div>

                      {/* Personnalisation de l'apparence */}
                      {newCampaign.selectedTemplate && (
                        <div style={{ marginBottom: '30px' }}>
                          <TemplateBrandingManager
                            onBrandingChange={handleTemplateBrandingChange}
                            initialBranding={{
                              companyName: artist?.name || 'Artiste',
                              subtitle: `Attaché de Presse - ${project?.name || 'Projet'}`,
                              primaryColor: '#0ED894',
                              backgroundColor: '#000000',
                              textColor: '#ffffff'
                            }}
                          />
                        </div>
                      )}

                      {/* Gestionnaire de variables si un template est sélectionné */}
                      {newCampaign.selectedTemplate && (
                        <div style={{ marginBottom: '30px' }}>
                          <VariableManager
                            campaignType={newCampaign.type}
                            onVariablesChange={handleTemplateVariablesChange}
                            initialVariables={{
                              artistName: artist?.name || 'Artiste',
                              projectName: project?.name || 'Projet',
                              projectType: project?.type || 'Album',
                              contactName: 'Prénom Nom',
                              contactEmail: 'contact@presspilot.com',
                              epkLink: newCampaign.epkLink
                            }}
                          />
                        </div>
                      )}

                      {/* Prévisualisation */}
                      {newCampaign.selectedTemplate && (
                        <div style={{ marginBottom: '30px' }}>
                          <TemplatePreview
                            templateType={newCampaign.type}
                            variables={newCampaign.templateVariables}
                            branding={newCampaign.templateBranding}
                            showPreview={showTemplatePreview}
                            onExportHTML={handleExportHTML}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section EPK */}
                  <div className="form-section">
                    <h3>EPK - Electronic Press Kit</h3>
                    <p className="form-helper">
                      Intégrez l'EPK de l'artiste pour donner accès aux journalistes à tous les éléments de presse (photos, bio, extraits audio, etc.)
                    </p>

                    {!newCampaign.includeEPK ? (
                      <div className="epk-integration-prompt">
                        <div className="epk-prompt-content">
                          <span className="epk-icon">EPK</span>
                          <div className="epk-prompt-text">
                            <h4>Dossier de presse complet</h4>
                            <p>Générez un lien vers l'EPK de {artist?.name || 'l\'artiste'} pour faciliter le travail des journalistes</p>
                          </div>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={generateEPKLink}
                          >
                            Intégrer l'EPK
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="epk-integrated">
                        <div className="epk-integrated-header">
                          <span className="epk-success-icon">✓</span>
                          <h4>EPK intégré à la campagne</h4>
                          <button
                            type="button"
                            className="btn-secondary-small"
                            onClick={() => setNewCampaign(prev => ({...prev, includeEPK: false, epkLink: ""}))}
                          >
                            Retirer
                          </button>
                        </div>
                        <div className="epk-link-preview">
                          <label>Lien public EPK :</label>
                          <div className="link-display">
                            <code>{newCampaign.epkLink}</code>
                            <button
                              type="button"
                              className="copy-link-btn"
                              onClick={() => navigator.clipboard.writeText(newCampaign.epkLink)}
                            >
                              Copier
                            </button>
                          </div>
                        </div>
                        <div className="epk-content-preview">
                          <h5>Contenu de l'EPK :</h5>
                          <div className="epk-items">
                            <span className="epk-item">Photos de presse</span>
                            <span className="epk-item">Biographie complète</span>
                            <span className="epk-item">Extraits audio</span>
                            <span className="epk-item">Vidéos</span>
                            <span className="epk-item">Revues de presse</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Créer la campagne
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
          <CampaignListAdvanced artistId={artistId} projectId={projectId} />
        </section>
    </Layout>
  );
};

export default Campaigns;