/**
 * SERVICE API - Media Kits / Dossiers de presse (BandStream RP)
 * CRUD + gestion assets + acces public + metriques
 */

import api from '../api';

const mediaKitsApi = {
  // --- CRUD ---

  getAll: async (params = {}) => {
    const response = await api.get('/api/media-kits', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/media-kits/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/media-kits', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/media-kits/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/media-kits/${id}`);
    return response.data;
  },

  // --- Assets ---

  addAsset: async (kitId, assetData) => {
    const response = await api.post(`/api/media-kits/${kitId}/assets`, assetData);
    return response.data;
  },

  removeAsset: async (kitId, assetId) => {
    const response = await api.delete(`/api/media-kits/${kitId}/assets/${assetId}`);
    return response.data;
  },

  trackDownload: async (kitId, assetId) => {
    const response = await api.post(`/api/media-kits/${kitId}/assets/${assetId}/download`);
    return response.data;
  },

  // --- Acces public ---

  getPublic: async (slug, password = null) => {
    const params = password ? { password } : {};
    const response = await api.get(`/api/media-kits/public/${slug}`, { params });
    return response.data;
  },

  enablePublicAccess: async (kitId, options = {}) => {
    const response = await api.post(`/api/media-kits/${kitId}/public`, options);
    return response.data;
  },

  disablePublicAccess: async (kitId) => {
    const response = await api.delete(`/api/media-kits/${kitId}/public`);
    return response.data;
  },

  // --- Stats ---

  getStats: async () => {
    const response = await api.get('/api/media-kits/stats');
    return response.data;
  }
};

export default mediaKitsApi;
