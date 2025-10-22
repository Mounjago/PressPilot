import axios from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Instance axios avec configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
    }

    // Gestion des autres erreurs
    const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
    return Promise.reject(new Error(message));
  }
);

/**
 * Service API pour les analytics
 */
export const analyticsApi = {
  /**
   * Récupère les métriques du dashboard principal
   * @param {Object} params - Paramètres de filtrage
   * @returns {Promise<Object>} Données du dashboard
   */
  async getDashboardMetrics(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Ajouter les paramètres de requête
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/analytics/dashboard?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques dashboard:', error);
      throw error;
    }
  },

  /**
   * Récupère l'analyse détaillée d'une campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Promise<Object>} Données d'analyse de la campagne
   */
  async getCampaignAnalytics(campaignId) {
    try {
      const response = await apiClient.get(`/api/analytics/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics campagne:', error);
      throw error;
    }
  },

  /**
   * Récupère l'analyse du profil d'engagement d'un journaliste
   * @param {string} contactId - ID du contact/journaliste
   * @returns {Promise<Object>} Profil d'engagement du journaliste
   */
  async getJournalistAnalytics(contactId) {
    try {
      const response = await apiClient.get(`/analytics/journalists/${contactId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics journaliste:', error);
      throw error;
    }
  },

  /**
   * Récupère les recommandations des meilleurs moments d'envoi
   * @param {Object} params - Paramètres de filtrage
   * @returns {Promise<Object>} Recommandations de timing
   */
  async getBestTimesRecommendations(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/analytics/best-times?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des best times:', error);
      throw error;
    }
  },

  /**
   * Récupère les tendances temporelles
   * @param {Object} params - Paramètres de période et granularité
   * @returns {Promise<Object>} Données de tendances
   */
  async getTrendsAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/analytics/trends?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      throw error;
    }
  },

  /**
   * Enregistre le tracking d'ouverture d'email
   * @param {string} emailId - ID de l'email
   * @param {Object} trackingData - Données de tracking
   * @returns {Promise<Object>} Résultat du tracking
   */
  async trackEmailOpen(emailId, trackingData = {}) {
    try {
      const response = await apiClient.post(`/analytics/track/open/${emailId}`, trackingData);
      return response;
    } catch (error) {
      console.error('Erreur lors du tracking d\'ouverture:', error);
      // Ne pas faire échouer l'application pour les erreurs de tracking
      return { success: false, error: error.message };
    }
  },

  /**
   * Enregistre le tracking de clic sur lien
   * @param {string} emailId - ID de l'email
   * @param {Object} clickData - Données du clic
   * @returns {Promise<Object>} Résultat du tracking
   */
  async trackEmailClick(emailId, clickData = {}) {
    try {
      const response = await apiClient.post(`/analytics/track/click/${emailId}`, clickData);
      return response;
    } catch (error) {
      console.error('Erreur lors du tracking de clic:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Exporte les données analytics
   * @param {Object} params - Paramètres d'export
   * @returns {Promise<Object>} Données exportées
   */
  async exportAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/analytics/export?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'export des analytics:', error);
      throw error;
    }
  },

  /**
   * Calcule les métriques personnalisées
   * @param {Object} config - Configuration des métriques
   * @returns {Promise<Object>} Métriques calculées
   */
  async calculateCustomMetrics(config) {
    try {
      const response = await apiClient.post('/analytics/custom-metrics', config);
      return response;
    } catch (error) {
      console.error('Erreur lors du calcul des métriques personnalisées:', error);
      throw error;
    }
  },

  /**
   * Récupère les prédictions IA pour une campagne
   * @param {Object} campaignData - Données de la campagne
   * @returns {Promise<Object>} Prédictions de performance
   */
  async getPredictions(campaignData) {
    try {
      const response = await apiClient.post('/analytics/predictions', campaignData);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des prédictions:', error);
      throw error;
    }
  },

  /**
   * Met à jour les profils de journalistes
   * @param {Array} contactIds - IDs des contacts à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateJournalistProfiles(contactIds = []) {
    try {
      const response = await apiClient.post('/analytics/update-profiles', { contactIds });
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des profils:', error);
      throw error;
    }
  },

  /**
   * Récupère les insights automatiques
   * @param {Object} params - Paramètres pour les insights
   * @returns {Promise<Object>} Insights générés
   */
  async getInsights(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/analytics/insights?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des insights:', error);
      throw error;
    }
  }
};

/**
 * Service pour les métriques en temps réel
 */
export const realTimeAnalytics = {
  /**
   * Connexion WebSocket pour les métriques en temps réel
   */
  connectRealTime(callbacks = {}) {
    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/analytics`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connexion temps réel établie');
        callbacks.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacks.onData?.(data);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        callbacks.onError?.(error);
      };

      ws.onclose = () => {
        console.log('Connexion temps réel fermée');
        callbacks.onClose?.();
      };

      return ws;
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      return null;
    }
  }
};

/**
 * Utilitaires pour les analytics
 */
export const analyticsUtils = {
  /**
   * Formate une valeur selon son type
   * @param {*} value - Valeur à formater
   * @param {string} type - Type de formatage
   * @returns {string} Valeur formatée
   */
  formatValue(value, type = 'number') {
    if (value === null || value === undefined) return '0';

    switch (type) {
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'currency':
        return `${Number(value).toLocaleString('fr-FR')}€`;
      case 'time':
        return `${Math.round(Number(value))}min`;
      case 'hours':
        return `${Math.round(Number(value))}h`;
      case 'decimal':
        return Number(value).toFixed(2);
      default:
        return Number(value).toLocaleString('fr-FR');
    }
  },

  /**
   * Calcule le pourcentage de changement
   * @param {number} current - Valeur actuelle
   * @param {number} previous - Valeur précédente
   * @returns {number} Pourcentage de changement
   */
  calculateChangePercentage(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },

  /**
   * Détermine la couleur selon la valeur de changement
   * @param {number} change - Valeur de changement
   * @param {boolean} inverted - Si true, négatif = bon
   * @returns {string} Classe CSS de couleur
   */
  getChangeColor(change, inverted = false) {
    if (change === 0) return 'text-gray-500';

    const isPositive = change > 0;
    const isGood = inverted ? !isPositive : isPositive;

    return isGood ? 'text-green-600' : 'text-red-600';
  },

  /**
   * Génère une palette de couleurs pour les graphiques
   * @param {number} count - Nombre de couleurs nécessaires
   * @returns {Array<string>} Palette de couleurs
   */
  generateColorPalette(count) {
    const baseColors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#F59E0B', // orange
      '#EF4444', // red
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange-500
      '#EC4899', // pink
      '#6366F1'  // indigo
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Générer des couleurs supplémentaires si nécessaire
    const colors = [...baseColors];
    while (colors.length < count) {
      const hue = Math.floor(Math.random() * 360);
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return colors;
  },

  /**
   * Convertit les données pour les graphiques Recharts
   * @param {Array} data - Données source
   * @param {string} dateKey - Clé de la date
   * @param {Array} valueKeys - Clés des valeurs
   * @returns {Array} Données formatées pour Recharts
   */
  formatChartData(data, dateKey = 'date', valueKeys = []) {
    return data.map(item => {
      const formattedItem = { ...item };

      // Formatage de la date
      if (item[dateKey]) {
        const date = new Date(item[dateKey]);
        formattedItem.formattedDate = date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        });
        formattedItem.fullDate = date.toLocaleDateString('fr-FR');
      }

      // Conversion des valeurs en nombres
      valueKeys.forEach(key => {
        if (item[key] !== null && item[key] !== undefined) {
          formattedItem[key] = Number(item[key]);
        }
      });

      return formattedItem;
    });
  },

  /**
   * Valide les paramètres d'API
   * @param {Object} params - Paramètres à valider
   * @param {Array} required - Champs requis
   * @returns {Object} Résultat de validation
   */
  validateParams(params, required = []) {
    const errors = [];

    required.forEach(field => {
      if (!params[field] || params[field] === '') {
        errors.push(`Le champ ${field} est requis`);
      }
    });

    // Validation des dates
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);

      if (start > end) {
        errors.push('La date de début doit être antérieure à la date de fin');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default analyticsApi;