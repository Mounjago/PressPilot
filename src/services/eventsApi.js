/**
 * SERVICE API - Evenements (BandStream RP)
 * CRUD + gestion des invites + RSVP + check-in
 */

import api from '../api';

const eventsApi = {
  // --- CRUD ---

  getAll: async (params = {}) => {
    const response = await api.get('/api/events', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/events/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/events', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/events/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/events/${id}`);
    return response.data;
  },

  // --- Invites ---

  addInvitees: async (eventId, contactIds) => {
    const response = await api.post(`/api/events/${eventId}/invite`, { contactIds });
    return response.data;
  },

  removeInvitee: async (eventId, contactId) => {
    const response = await api.delete(`/api/events/${eventId}/invite/${contactId}`);
    return response.data;
  },

  updateRSVP: async (eventId, contactId, rsvpStatus) => {
    const response = await api.put(`/api/events/${eventId}/rsvp/${contactId}`, { rsvpStatus });
    return response.data;
  },

  checkIn: async (eventId, contactId) => {
    const response = await api.post(`/api/events/${eventId}/checkin/${contactId}`);
    return response.data;
  },

  // --- Statut ---

  updateStatus: async (eventId, status) => {
    const response = await api.patch(`/api/events/${eventId}/status`, { status });
    return response.data;
  },

  // --- Stats ---

  getStats: async () => {
    const response = await api.get('/api/events/stats');
    return response.data;
  }
};

export default eventsApi;
