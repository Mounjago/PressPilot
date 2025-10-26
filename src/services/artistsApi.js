import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://backend-presspilot-production.up.railway.app';

const artistsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
artistsApi.interceptors.request.use(
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
artistsApi.interceptors.response.use(
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

// Service pour la gestion des artistes
const artistsService = {
  // Récupérer tous les artistes de l'utilisateur
  async getArtists() {
    try {
      const response = await artistsApi.get('/api/artists');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des artistes:', error);

      // Fallback vers localStorage en cas d'erreur API
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      console.log('🔄 Utilisation des données locales:', localArtists.length, 'artistes');
      return localArtists;
    }
  },

  // Créer un nouvel artiste
  async createArtist(artistData) {
    try {
      const response = await artistsApi.post('/api/artists', artistData);

      // Synchroniser avec localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      localArtists.push(response.data);
      localStorage.setItem('presspilot-artists', JSON.stringify(localArtists));

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'artiste:', error);

      // Fallback vers localStorage
      const newArtist = {
        ...artistData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      localArtists.push(newArtist);
      localStorage.setItem('presspilot-artists', JSON.stringify(localArtists));

      console.log('💾 Artiste sauvegardé localement');
      return newArtist;
    }
  },

  // Mettre à jour un artiste
  async updateArtist(artistId, artistData) {
    try {
      const response = await artistsApi.put(`/api/artists/${artistId}`, artistData);

      // Synchroniser avec localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const index = localArtists.findIndex(a => a.id === artistId || a._id === artistId);
      if (index !== -1) {
        localArtists[index] = response.data;
        localStorage.setItem('presspilot-artists', JSON.stringify(localArtists));
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'artiste:', error);

      // Fallback vers localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const index = localArtists.findIndex(a => a.id === artistId || a._id === artistId);

      if (index !== -1) {
        localArtists[index] = {
          ...localArtists[index],
          ...artistData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('presspilot-artists', JSON.stringify(localArtists));
        console.log('💾 Artiste mis à jour localement');
        return localArtists[index];
      }

      throw error;
    }
  },

  // Supprimer un artiste
  async deleteArtist(artistId) {
    try {
      await artistsApi.delete(`/api/artists/${artistId}`);

      // Synchroniser avec localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const filteredArtists = localArtists.filter(a => a.id !== artistId && a._id !== artistId);
      localStorage.setItem('presspilot-artists', JSON.stringify(filteredArtists));

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'artiste:', error);

      // Fallback vers localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const filteredArtists = localArtists.filter(a => a.id !== artistId && a._id !== artistId);
      localStorage.setItem('presspilot-artists', JSON.stringify(filteredArtists));

      console.log('💾 Artiste supprimé localement');
      return true;
    }
  },

  // Synchroniser les données locales avec l'API
  async syncLocalArtists() {
    try {
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');

      if (localArtists.length === 0) {
        console.log('Aucun artiste local à synchroniser');
        return [];
      }

      // Envoyer tous les artistes locaux vers l'API
      const response = await artistsApi.post('/api/artists/sync', {
        artists: localArtists
      });

      if (response.data && response.data.artists) {
        // Mettre à jour localStorage avec les données synchronisées
        localStorage.setItem('presspilot-artists', JSON.stringify(response.data.artists));
        console.log('✅ Synchronisation réussie:', response.data.artists.length, 'artistes');
        return response.data.artists;
      }

      return localArtists;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // En cas d'erreur, retourner les données locales
      return JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
    }
  },

  // Récupérer un artiste spécifique
  async getArtist(artistId) {
    try {
      const response = await artistsApi.get(`/api/artists/${artistId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'artiste:', error);

      // Fallback vers localStorage
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const artist = localArtists.find(a => a.id === artistId || a._id === artistId);
      return artist || null;
    }
  },

  // Upload d'avatar vers Cloudinary via l'API
  async uploadAvatar(artistId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);

      const response = await artistsApi.post(`/api/artists/${artistId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.avatarUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      throw error;
    }
  }
};

export default artistsService;