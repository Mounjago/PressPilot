/**
 * ADMIN API SERVICE
 * Service pour les endpoints d'administration
 * Utilisateurs, organisations, statistiques cross-workspace
 */

import api from '../api';

const adminApi = {
  // ============================================================
  // STATISTIQUES
  // ============================================================

  /**
   * Statistiques globales du dashboard admin
   */
  getGlobalStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  /**
   * Analytics cross-workspace avec periode
   * @param {string} period - '7d' | '30d' | '90d' | '1y'
   */
  getAnalytics: async (period = '30d') => {
    const response = await api.get('/api/admin/analytics', { params: { period } });
    return response.data;
  },

  // ============================================================
  // UTILISATEURS
  // ============================================================

  /**
   * Lister les utilisateurs avec filtres
   * @param {Object} params - {role, isActive, search, page, limit, sort}
   */
  getUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  /**
   * Obtenir un utilisateur par ID
   */
  getUserById: async (id) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
  },

  /**
   * Creer un utilisateur
   * @param {Object} data - {name, email, password, role, company, organizationId}
   */
  createUser: async (data) => {
    const response = await api.post('/api/admin/users', data);
    return response.data;
  },

  /**
   * Mettre a jour un utilisateur
   * @param {string} id
   * @param {Object} data - {name, email, role, company, organizationId, isActive}
   */
  updateUser: async (id, data) => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Changer le role d'un utilisateur
   * @param {string} id
   * @param {string} role
   */
  changeUserRole: async (id, role) => {
    const response = await api.put(`/api/admin/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Verrouiller / deverrouiller un utilisateur
   * @param {string} id
   * @param {boolean} locked
   */
  toggleUserLock: async (id, locked) => {
    const response = await api.put(`/api/admin/users/${id}/lock`, { locked });
    return response.data;
  },

  /**
   * Supprimer un utilisateur (soft delete)
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  // ============================================================
  // ORGANISATIONS
  // ============================================================

  /**
   * Lister les organisations
   * @param {Object} params - {search, type, status, page, limit}
   */
  getOrganizations: async (params = {}) => {
    const response = await api.get('/api/admin/organizations', { params });
    return response.data;
  },

  /**
   * Obtenir une organisation par ID (avec membres)
   */
  getOrganizationById: async (id) => {
    const response = await api.get(`/api/admin/organizations/${id}`);
    return response.data;
  },

  /**
   * Creer une organisation
   * @param {Object} data - {name, type, description, contactEmail, website}
   */
  createOrganization: async (data) => {
    const response = await api.post('/api/admin/organizations', data);
    return response.data;
  },

  /**
   * Mettre a jour une organisation
   * @param {string} id
   * @param {Object} data
   */
  updateOrganization: async (id, data) => {
    const response = await api.put(`/api/admin/organizations/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une organisation (soft delete)
   */
  deleteOrganization: async (id) => {
    const response = await api.delete(`/api/admin/organizations/${id}`);
    return response.data;
  }
};

export default adminApi;
