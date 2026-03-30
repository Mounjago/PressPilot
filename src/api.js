import axios from "axios";
import authService from './utils/authService';

// URL de ton backend Railway
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3001';

// Configuration sécurisée d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Protection CSRF
  },
  maxContentLength: 10 * 1024 * 1024, // 10MB max content
  maxBodyLength: 10 * 1024 * 1024, // 10MB max body
  validateStatus: (status) => status >= 200 && status < 300,
  withCredentials: false, // Sécurité : pas de cookies automatiques
  decompress: true, // Décompression sécurisée
  maxRedirects: 3, // Limite les redirections
});

// Interceptor pour ajouter automatiquement le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les erreurs et la sécurité
api.interceptors.response.use(
  (response) => {
    // Vérification des headers de sécurité
    if (response.headers && response.config.url) {
      // Log des tentatives suspectes
      if (response.status === 429) {
        console.warn('Rate limit détecté sur:', response.config.url);
      }
    }
    return response;
  },
  (error) => {
    // Gestion sécurisée des erreurs
    if (error.response) {
      const { status, config } = error.response;

      switch (status) {
        case 401:
          // Token invalide ou expiré
          authService.logout();
          window.location.href = '/login';
          break;

        case 403:
          // Accès interdit
          console.warn('Accès interdit à:', config?.url);
          break;

        case 429:
          // Rate limiting
          console.warn('Rate limit atteint pour:', config?.url);
          break;

        case 413:
          // Payload trop volumineux
          console.error('Fichier trop volumineux');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Erreurs serveur
          console.error('Erreur serveur:', status, 'pour:', config?.url);
          break;

        default:
          // Autres erreurs
          console.warn('Erreur HTTP:', status, 'pour:', config?.url);
      }
    } else if (error.request) {
      // Erreur réseau
      console.error('Erreur réseau - serveur inaccessible');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('Timeout de la requête vers:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

// ========== CONTACTS ==========
export const contactsApi = {
  // Récupérer tous les contacts
  getAll: async (params = {}) => {
    const response = await api.get('/api/contacts', { params });
    return response.data;
  },

  // Récupérer un contact par ID
  getById: async (id) => {
    const response = await api.get(`/api/contacts/${id}`);
    return response.data;
  },

  // Créer un nouveau contact
  create: async (contactData) => {
    const response = await api.post('/api/contacts', contactData);
    return response.data;
  },

  // Mettre à jour un contact
  update: async (id, contactData) => {
    const response = await api.put(`/api/contacts/${id}`, contactData);
    return response.data;
  },

  // Supprimer un contact
  delete: async (id) => {
    const response = await api.delete(`/api/contacts/${id}`);
    return response.data;
  },

  // Rechercher des contacts
  search: async (query, filters = {}) => {
    const response = await api.get('/api/contacts/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  // Obtenir le nombre total de contacts
  getCount: async () => {
    const response = await api.get('/api/contacts/count');
    return response.data;
  },

  // Obtenir les statistiques des contacts
  getStats: async () => {
    const response = await api.get('/api/contacts/stats');
    return response.data;
  },

  // Importer des contacts depuis un fichier CSV
  import: async (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    const response = await api.post('/api/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Exporter des contacts en CSV
  export: async (filters = {}) => {
    const response = await api.get('/api/contacts/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Mettre à jour l'engagement d'un contact
  updateEngagement: async (id, action) => {
    const response = await api.post(`/api/contacts/${id}/engagement`, { action });
    return response.data;
  },

  // Ajouter un tag à un contact
  addTag: async (id, tag) => {
    const response = await api.post(`/api/contacts/${id}/tags`, { tag });
    return response.data;
  },

  // Supprimer un tag d'un contact
  removeTag: async (id, tag) => {
    const response = await api.delete(`/api/contacts/${id}/tags/${tag}`);
    return response.data;
  }
};

// ========== CAMPAIGNS ==========
export const campaignsApi = {
  // Récupérer toutes les campagnes
  getAll: async (params = {}) => {
    const response = await api.get('/api/campaigns', { params });
    return response.data;
  },

  // Récupérer une campagne par ID
  getById: async (id) => {
    const response = await api.get(`/api/campaigns/${id}`);
    return response.data;
  },

  // Créer une nouvelle campagne
  create: async (campaignData, attachments = []) => {
    const formData = new FormData();

    // Ajouter les données de la campagne
    Object.keys(campaignData).forEach(key => {
      if (campaignData[key] !== null && campaignData[key] !== undefined) {
        formData.append(key, campaignData[key]);
      }
    });

    // Ajouter les pièces jointes
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await api.post('/api/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Mettre à jour une campagne
  update: async (id, campaignData, attachments = []) => {
    const formData = new FormData();

    Object.keys(campaignData).forEach(key => {
      if (campaignData[key] !== null && campaignData[key] !== undefined) {
        formData.append(key, campaignData[key]);
      }
    });

    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await api.put(`/api/campaigns/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer une campagne
  delete: async (id) => {
    const response = await api.delete(`/api/campaigns/${id}`);
    return response.data;
  },

  // Obtenir les statistiques des campagnes
  getStats: async (dateRange = {}) => {
    const response = await api.get('/api/campaigns/stats', { params: dateRange });
    return response.data;
  },

  // Obtenir les meilleures campagnes
  getTopPerforming: async (limit = 10) => {
    const response = await api.get('/api/campaigns/top-performing', { params: { limit } });
    return response.data;
  },

  // Envoyer une campagne
  send: async (id) => {
    const response = await api.post(`/api/campaigns/${id}/send`);
    return response.data;
  },

  // Mettre en pause une campagne
  pause: async (id) => {
    const response = await api.post(`/api/campaigns/${id}/pause`);
    return response.data;
  },

  // Dupliquer une campagne
  duplicate: async (id) => {
    const response = await api.post(`/api/campaigns/${id}/duplicate`);
    return response.data;
  },

  // Ajouter des destinataires à une campagne
  addRecipients: async (id, contactIds) => {
    const response = await api.post(`/api/campaigns/${id}/recipients`, { contactIds });
    return response.data;
  },

  // Supprimer un destinataire d'une campagne
  removeRecipient: async (id, contactId) => {
    const response = await api.delete(`/api/campaigns/${id}/recipients/${contactId}`);
    return response.data;
  },

  // Obtenir les analytics d'une campagne
  getAnalytics: async (id) => {
    const response = await api.get(`/api/campaigns/${id}/analytics`);
    return response.data;
  },
  // Obtenir tous les échanges d'une campagne (emails envoyés et réponses)
  getExchanges: async (id) => {
    const response = await api.get(`/api/campaigns/${id}/exchanges`);
    return response.data;
  },
  // Récupérer une campagne avec toutes ses informations
  get: async (id) => {
    const response = await api.get(`/api/campaigns/${id}`);
    return response.data;
  }
};

// ========== PROJECTS ==========
export const projectsApi = {
  // Récupérer tous les projets
  getAll: async (params = {}) => {
    const response = await api.get('/api/projects', { params });
    return response.data;
  },

  // Récupérer un projet par ID
  getById: async (id) => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  // Créer un nouveau projet
  create: async (projectData, coverFile = null) => {
    const formData = new FormData();

    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        if (typeof projectData[key] === 'object') {
          formData.append(key, JSON.stringify(projectData[key]));
        } else {
          formData.append(key, projectData[key]);
        }
      }
    });

    if (coverFile) {
      formData.append('cover', coverFile);
    }

    const response = await api.post('/api/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Mettre à jour un projet
  update: async (id, projectData, coverFile = null) => {
    const formData = new FormData();

    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        if (typeof projectData[key] === 'object') {
          formData.append(key, JSON.stringify(projectData[key]));
        } else {
          formData.append(key, projectData[key]);
        }
      }
    });

    if (coverFile) {
      formData.append('cover', coverFile);
    }

    const response = await api.put(`/api/projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer un projet
  delete: async (id) => {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },

  // Obtenir les statistiques des projets
  getStats: async () => {
    const response = await api.get('/api/projects/stats');
    return response.data;
  },

  // Obtenir les projets à venir
  getUpcoming: async (limit = 10) => {
    const response = await api.get('/api/projects/upcoming', { params: { limit } });
    return response.data;
  },

  // Rechercher des projets
  search: async (query, filters = {}) => {
    const response = await api.get('/api/projects/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  // Ajouter un jalon à un projet
  addMilestone: async (id, milestone) => {
    const response = await api.post(`/api/projects/${id}/milestones`, milestone);
    return response.data;
  },

  // Mettre à jour un jalon
  updateMilestone: async (id, milestoneId, updates) => {
    const response = await api.put(`/api/projects/${id}/milestones/${milestoneId}`, updates);
    return response.data;
  },

  // Ajouter une dépense au budget
  addExpense: async (id, expense) => {
    const response = await api.post(`/api/projects/${id}/expenses`, expense);
    return response.data;
  },

  // Ajouter un collaborateur
  addCollaborator: async (id, collaborator) => {
    const response = await api.post(`/api/projects/${id}/collaborators`, collaborator);
    return response.data;
  },

  // Mettre à jour un livrable
  updateDeliverable: async (id, deliverable, status) => {
    const response = await api.put(`/api/projects/${id}/deliverables/${deliverable}`, { status });
    return response.data;
  },

  // Obtenir les analytics d'un projet
  getAnalytics: async (id) => {
    const response = await api.get(`/api/projects/${id}/analytics`);
    return response.data;
  }
};

// ========== ANALYTICS ==========
export const analyticsApi = {
  // Dashboard analytics
  getDashboard: async (period = '30d') => {
    const response = await api.get('/api/analytics/dashboard', { params: { period } });
    return response.data;
  },

  // Analytics des contacts
  getContacts: async (period = '30d', filters = {}) => {
    const response = await api.get('/api/analytics/contacts', {
      params: { period, ...filters }
    });
    return response.data;
  },

  // Analytics des campagnes
  getCampaigns: async (period = '30d', filters = {}) => {
    const response = await api.get('/api/analytics/campaigns', {
      params: { period, ...filters }
    });
    return response.data;
  },

  // Analytics des projets
  getProjects: async (filters = {}) => {
    const response = await api.get('/api/analytics/projects', { params: filters });
    return response.data;
  },

  // Best times analytics
  getBestTimes: async (period = '30d') => {
    const response = await api.get('/api/analytics/best-times', { params: { period } });
    return response.data;
  },

  // Exporter les analytics
  export: async (type, period = '30d') => {
    const response = await api.get('/api/analytics/export', {
      params: { type, period },
      responseType: 'blob'
    });
    return response.data;
  }
};

// ========== UPLOADS ==========
export const uploadsApi = {
  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/api/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload cover de projet
  uploadCover: async (file) => {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await api.post('/api/uploads/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload pièces jointes
  uploadAttachments: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    const response = await api.post('/api/uploads/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload fichier audio
  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    const response = await api.post('/api/uploads/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post('/api/uploads/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer un fichier
  deleteFile: async (category, filename) => {
    const response = await api.delete(`/api/uploads/${category}/${filename}`);
    return response.data;
  },

  // Obtenir les informations d'un fichier
  getFileInfo: async (category, filename) => {
    const response = await api.get(`/api/uploads/info/${category}/${filename}`);
    return response.data;
  },

  // Lister les fichiers d'une catégorie
  listFiles: async (category, params = {}) => {
    const response = await api.get(`/api/uploads/list/${category}`, { params });
    return response.data;
  },

  // Obtenir les statistiques des uploads
  getStats: async () => {
    const response = await api.get('/api/uploads/stats');
    return response.data;
  }
};

// ========== IMAP ==========
export const imapApi = {
  // Récupérer toutes les configurations IMAP
  getAll: async () => {
    const response = await api.get('/api/imap');
    return response.data;
  },

  // Récupérer les presets pour les providers
  getPresets: async () => {
    const response = await api.get('/api/imap/presets');
    return response.data;
  },

  // Récupérer une configuration par ID
  getById: async (id) => {
    const response = await api.get(`/api/imap/${id}`);
    return response.data;
  },

  // Créer une nouvelle configuration IMAP
  create: async (configData) => {
    const response = await api.post('/api/imap', configData);
    return response.data;
  },

  // Mettre à jour une configuration IMAP
  update: async (id, configData) => {
    const response = await api.put(`/api/imap/${id}`, configData);
    return response.data;
  },

  // Supprimer une configuration IMAP
  delete: async (id) => {
    const response = await api.delete(`/api/imap/${id}`);
    return response.data;
  },

  // Tester une connexion IMAP
  testConnection: async (id) => {
    const response = await api.post(`/api/imap/${id}/test`);
    return response.data;
  },

  // Forcer un poll pour une configuration
  forcePoll: async (id) => {
    const response = await api.post(`/api/imap/${id}/poll`);
    return response.data;
  },

  // Activer/Désactiver le polling
  togglePolling: async (id) => {
    const response = await api.post(`/api/imap/${id}/toggle`);
    return response.data;
  },

  // Obtenir le statut du service IMAP
  getServiceStatus: async () => {
    const response = await api.get('/api/imap/service/status');
    return response.data;
  }
};

// ========== QUEUE ==========
export const queueApi = {
  // Obtenir le statut des queues
  getStatus: async () => {
    const response = await api.get('/api/queue/status');
    return response.data;
  },

  // Obtenir les jobs de traitement d'email
  getEmailJobs: async (status = 'waiting', limit = 20) => {
    const response = await api.get('/api/queue/jobs/email', {
      params: { status, limit }
    });
    return response.data;
  },

  // Obtenir les jobs de polling IMAP
  getImapJobs: async (status = 'waiting', limit = 20) => {
    const response = await api.get('/api/queue/jobs/imap', {
      params: { status, limit }
    });
    return response.data;
  },

  // Obtenir les détails d'un job
  getJobDetails: async (jobId) => {
    const response = await api.get(`/api/queue/job/${jobId}`);
    return response.data;
  },

  // Relancer un job échoué
  retryJob: async (jobId) => {
    const response = await api.post(`/api/queue/job/${jobId}/retry`);
    return response.data;
  },

  // Supprimer un job
  deleteJob: async (jobId) => {
    const response = await api.delete(`/api/queue/job/${jobId}`);
    return response.data;
  },

  // Nettoyer les queues
  cleanQueues: async () => {
    const response = await api.post('/api/queue/clean');
    return response.data;
  },

  // Mettre en pause les queues
  pauseQueues: async () => {
    const response = await api.post('/api/queue/pause');
    return response.data;
  },

  // Reprendre les queues
  resumeQueues: async () => {
    const response = await api.post('/api/queue/resume');
    return response.data;
  },

  // Obtenir les jobs répétés
  getRepeatedJobs: async () => {
    const response = await api.get('/api/queue/repeated');
    return response.data;
  }
};

// ========== MESSAGES ==========
export const messagesApi = {
  // Récupérer tous les messages
  getAll: async (params = {}) => {
    const response = await api.get('/api/messages', { params });
    return response.data;
  },

  // Récupérer un message par ID
  getById: async (id) => {
    const response = await api.get(`/api/messages/${id}`);
    return response.data;
  },

  // Rechercher des messages
  search: async (query, filters = {}) => {
    const response = await api.get('/api/messages/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  // Marquer un message comme lu
  markAsRead: async (id) => {
    const response = await api.patch(`/api/messages/${id}/read`);
    return response.data;
  },

  // Marquer un message comme important
  markAsFlagged: async (id) => {
    const response = await api.patch(`/api/messages/${id}/flag`);
    return response.data;
  },

  // Ajouter un tag à un message
  addTag: async (id, tag) => {
    const response = await api.post(`/api/messages/${id}/tags`, { tag });
    return response.data;
  },

  // Supprimer un tag d'un message
  removeTag: async (id, tag) => {
    const response = await api.delete(`/api/messages/${id}/tags/${tag}`);
    return response.data;
  },

  // Archiver un message
  archive: async (id) => {
    const response = await api.patch(`/api/messages/${id}/archive`);
    return response.data;
  },

  // Obtenir les statistiques des messages
  getStats: async (period = 30) => {
    const response = await api.get('/api/messages/stats', { params: { period } });
    return response.data;
  },

  // Obtenir les messages d'une configuration IMAP
  getByConfig: async (configId, options = {}) => {
    const response = await api.get(`/api/messages/config/${configId}`, { params: options });
    return response.data;
  },

  // Obtenir les messages d'une campagne
  getByCampaign: async (campaignId, options = {}) => {
    const response = await api.get(`/api/messages/campaign/${campaignId}`, { params: options });
    return response.data;
  }
};

// ========== AUTH ==========
export const authApi = {
  // Récupérer les paramètres email
  getEmailSettings: async () => {
    const response = await api.get('/auth/email-settings');
    return response.data;
  },

  // Mettre à jour les paramètres email
  updateEmailSettings: async (emailSettings) => {
    const response = await api.put('/auth/email-settings', emailSettings);
    return response.data;
  },

  // Récupérer le profil utilisateur
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  }
};

// ========== AI ==========
export const aiApi = {
  // Recuperer les parametres IA de l'utilisateur
  getSettings: async () => {
    const response = await api.get('/api/ai/settings');
    return response.data;
  },

  // Mettre a jour les parametres IA
  updateSettings: async (settings) => {
    const response = await api.put('/api/ai/settings', settings);
    return response.data;
  },

  // Tester la connexion au provider IA
  testConnection: async () => {
    const response = await api.post('/api/ai/test-connection');
    return response.data;
  },

  // Generer un communique de presse
  generatePressRelease: async (subject) => {
    const response = await api.post('/api/ai/generate-press-release', { subject });
    return response.data;
  }
};

// ========== LEGACY FUNCTIONS (pour compatibilité) ==========
export const getContacts = contactsApi.getAll;

// Export par défaut de l'instance axios configurée
export default api;
