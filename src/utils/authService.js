// src/utils/authService.js
import axios from 'axios';
import config from '../config';

// Définir l'URL de base pour les requêtes d'authentification
const AUTH_URL = `${config.apiUrl}/auth`;

// Service d'authentification
const authService = {
  // Enregistrer un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await axios.post(`${AUTH_URL}/register`, userData);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        // Nettoyer les anciens tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Connecter un utilisateur existant
  login: async (credentials) => {
    try {
      const response = await axios.post(`${AUTH_URL}/login`, credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        // Nettoyer les anciens tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Déconnecter l'utilisateur
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Nettoyer aussi les anciens tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const userStr = localStorage.getItem('authUser');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  // Récupérer le token d'authentification
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Configurer les en-têtes d'authentification pour les requêtes
  getAuthHeader: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    } else {
      return {};
    }
  }
};

export default authService;
