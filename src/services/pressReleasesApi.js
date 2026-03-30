/**
 * SERVICE API - Communiques de presse (BandStream RP)
 * CRUD + workflow (submit, approve, reject, publish, duplicate)
 */

import api from '../api';

const pressReleasesApi = {
  // --- CRUD ---

  getAll: async (params = {}) => {
    const response = await api.get('/api/press-releases', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/press-releases/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/press-releases', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/press-releases/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/press-releases/${id}`);
    return response.data;
  },

  // --- Workflow ---

  submitForReview: async (id) => {
    const response = await api.post(`/api/press-releases/${id}/submit`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/api/press-releases/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason = '') => {
    const response = await api.post(`/api/press-releases/${id}/reject`, { reason });
    return response.data;
  },

  publish: async (id) => {
    const response = await api.post(`/api/press-releases/${id}/publish`);
    return response.data;
  },

  duplicate: async (id) => {
    const response = await api.post(`/api/press-releases/${id}/duplicate`);
    return response.data;
  },

  // --- Stats ---

  getStats: async () => {
    const response = await api.get('/api/press-releases/stats');
    return response.data;
  }
};

export default pressReleasesApi;
