import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.mdmcmusicads.com/api/v1';

const campaignsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
campaignsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
campaignsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service pour la gestion des campagnes
const campaignsService = {
  // Récupérer toutes les campagnes de l'utilisateur
  async getCampaigns() {
    try {
      const response = await campaignsApi.get('/campaigns');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des campagnes:', error);

      // Fallback vers localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      console.log('🔄 Utilisation des données locales:', localCampaigns.length, 'campagnes');
      return localCampaigns;
    }
  },

  // Créer une nouvelle campagne
  async createCampaign(campaignData) {
    try {
      const response = await campaignsApi.post('/campaigns', campaignData);

      // Synchroniser avec localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      localCampaigns.push(response.data);
      localStorage.setItem('presspilot-campaigns', JSON.stringify(localCampaigns));

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la campagne:', error);

      // Fallback vers localStorage
      const newCampaign = {
        ...campaignData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        analytics: {
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0
        }
      };

      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      localCampaigns.push(newCampaign);
      localStorage.setItem('presspilot-campaigns', JSON.stringify(localCampaigns));

      console.log('💾 Campagne sauvegardée localement');
      return newCampaign;
    }
  },

  // Mettre à jour une campagne
  async updateCampaign(campaignId, campaignData) {
    try {
      const response = await campaignsApi.put(`/campaigns/${campaignId}`, campaignData);

      // Synchroniser avec localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const index = localCampaigns.findIndex(c => c.id === campaignId || c._id === campaignId);
      if (index !== -1) {
        localCampaigns[index] = response.data;
        localStorage.setItem('presspilot-campaigns', JSON.stringify(localCampaigns));
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la campagne:', error);

      // Fallback vers localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const index = localCampaigns.findIndex(c => c.id === campaignId || c._id === campaignId);

      if (index !== -1) {
        localCampaigns[index] = {
          ...localCampaigns[index],
          ...campaignData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('presspilot-campaigns', JSON.stringify(localCampaigns));
        console.log('💾 Campagne mise à jour localement');
        return localCampaigns[index];
      }

      throw error;
    }
  },

  // Supprimer une campagne
  async deleteCampaign(campaignId) {
    try {
      await campaignsApi.delete(`/campaigns/${campaignId}`);

      // Synchroniser avec localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const filteredCampaigns = localCampaigns.filter(c => c.id !== campaignId && c._id !== campaignId);
      localStorage.setItem('presspilot-campaigns', JSON.stringify(filteredCampaigns));

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la campagne:', error);

      // Fallback vers localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const filteredCampaigns = localCampaigns.filter(c => c.id !== campaignId && c._id !== campaignId);
      localStorage.setItem('presspilot-campaigns', JSON.stringify(filteredCampaigns));

      console.log('💾 Campagne supprimée localement');
      return true;
    }
  },

  // Lancer une campagne
  async launchCampaign(campaignId) {
    try {
      const response = await campaignsApi.post(`/campaigns/${campaignId}/launch`);

      // Mettre à jour le statut dans localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const index = localCampaigns.findIndex(c => c.id === campaignId || c._id === campaignId);
      if (index !== -1) {
        localCampaigns[index].status = 'sent';
        localCampaigns[index].sentAt = new Date().toISOString();
        localStorage.setItem('presspilot-campaigns', JSON.stringify(localCampaigns));
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors du lancement de la campagne:', error);
      throw error;
    }
  },

  // Récupérer les analytics d'une campagne
  async getCampaignAnalytics(campaignId) {
    try {
      const response = await campaignsApi.get(`/campaigns/${campaignId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);

      // Fallback avec données par défaut
      return {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0
      };
    }
  },

  // Récupérer les campagnes par projet
  async getCampaignsByProject(projectId) {
    try {
      const response = await campaignsApi.get(`/campaigns/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des campagnes du projet:', error);

      // Fallback vers localStorage
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
      const projectCampaigns = localCampaigns.filter(c => c.projectId === projectId || c.project === projectId);
      return projectCampaigns;
    }
  },

  // Synchroniser les données locales avec l'API
  async syncLocalCampaigns() {
    try {
      const localCampaigns = JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');

      if (localCampaigns.length === 0) {
        console.log('Aucune campagne locale à synchroniser');
        return [];
      }

      const response = await campaignsApi.post('/campaigns/sync', {
        campaigns: localCampaigns
      });

      if (response.data && response.data.campaigns) {
        localStorage.setItem('presspilot-campaigns', JSON.stringify(response.data.campaigns));
        console.log('✅ Synchronisation des campagnes réussie:', response.data.campaigns.length, 'campagnes');
        return response.data.campaigns;
      }

      return localCampaigns;
    } catch (error) {
      console.error('Erreur lors de la synchronisation des campagnes:', error);
      return JSON.parse(localStorage.getItem('presspilot-campaigns') || '[]');
    }
  }
};

export default campaignsService;