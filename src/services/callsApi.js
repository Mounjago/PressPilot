/**
 * CALLS API SERVICE - Gestion des appels côté API
 * Interface pour les opérations CRUD sur les appels
 */

import axios from 'axios';

class CallsApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Erreur API Calls:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Crée un nouvel appel en base
   */
  async createCall(callData) {
    try {
      const response = await this.api.post('/api/calls', {
        contactId: callData.contactId,
        phoneNumber: callData.phoneNumber,
        startedAt: callData.startedAt,
        endedAt: callData.endedAt,
        duration: callData.duration,
        status: callData.status,
        notes: callData.notes,
        recordingUrl: callData.recordingUrl || null
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur création appel:', error);
      throw new Error('Impossible de sauvegarder l\'appel');
    }
  }

  /**
   * Met à jour un appel existant
   */
  async updateCall(callId, updates) {
    try {
      const response = await this.api.put(`/api/calls/${callId}`, updates);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour appel:', error);
      throw new Error('Impossible de mettre à jour l\'appel');
    }
  }

  /**
   * Récupère tous les appels
   */
  async getAllCalls(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.contactId) params.append('contactId', filters.contactId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await this.api.get(`/api/calls?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération appels:', error);
      throw new Error('Impossible de récupérer les appels');
    }
  }

  /**
   * Récupère l'historique des appels pour un contact
   */
  async getCallsByContact(contactId) {
    try {
      const response = await this.api.get(`/api/calls?contactId=${contactId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur historique contact:', error);
      throw new Error('Impossible de récupérer l\'historique du contact');
    }
  }

  /**
   * Récupère un appel spécifique
   */
  async getCall(callId) {
    try {
      const response = await this.api.get(`/api/calls/${callId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération appel:', error);
      throw new Error('Impossible de récupérer l\'appel');
    }
  }

  /**
   * Supprime un appel
   */
  async deleteCall(callId) {
    try {
      const response = await this.api.delete(`/api/calls/${callId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression appel:', error);
      throw new Error('Impossible de supprimer l\'appel');
    }
  }

  /**
   * Récupère les statistiques d'appels
   */
  async getCallStats(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.contactId) params.append('contactId', filters.contactId);

      const response = await this.api.get(`/api/calls/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur stats appels:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  }

  /**
   * Marque un appel comme écouté
   */
  async markAsListened(callId) {
    try {
      const response = await this.api.patch(`/api/calls/${callId}/listened`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur marquage écoute:', error);
      throw new Error('Impossible de marquer comme écouté');
    }
  }

  /**
   * Ajoute/met à jour les notes d'un appel
   */
  async updateNotes(callId, notes) {
    try {
      const response = await this.api.patch(`/api/calls/${callId}/notes`, {
        notes
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour notes:', error);
      throw new Error('Impossible de mettre à jour les notes');
    }
  }

  /**
   * Recherche dans les appels
   */
  async searchCalls(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await this.api.get(`/api/calls/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur recherche appels:', error);
      throw new Error('Impossible de rechercher dans les appels');
    }
  }

  /**
   * Récupère les appels récents
   */
  async getRecentCalls(limit = 10) {
    try {
      const response = await this.api.get(`/api/calls/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur appels récents:', error);
      throw new Error('Impossible de récupérer les appels récents');
    }
  }

  /**
   * Exporte les appels en CSV
   */
  async exportCalls(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.contactId) params.append('contactId', filters.contactId);

      const response = await this.api.get(`/api/calls/export?${params.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur export appels:', error);
      throw new Error('Impossible d\'exporter les appels');
    }
  }
}

// Instance singleton
const callsApi = new CallsApiService();

export default callsApi;