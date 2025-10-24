import axios from "axios";
import authService from './utils/authService';

// URL de ton backend Railway
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Configuration d'axios avec interceptors pour l'authentification
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
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

// Interceptor pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré, déconnecter l'utilisateur
      authService.logout();
      window.location.href = '/login';
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

// ========== LEGACY FUNCTIONS (pour compatibilité) ==========
export const getContacts = contactsApi.getAll;

// Export par défaut de l'instance axios configurée
export default api;
