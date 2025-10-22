// src/utils/authService.js
import axios from 'axios';
import config from '../config';

// Définir l'URL de base pour les requêtes d'authentification
const AUTH_URL = `${config.apiUrl}/api/auth`;

// Service d'authentification
const authService = {
  // Enregistrer un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await axios.post(`${AUTH_URL}/register`, userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Déconnecter l'utilisateur
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  // Récupérer le token d'authentification
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Configurer les en-têtes d'authentification pour les requêtes
  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    } else {
      return {};
    }
  }
};

export default authService;
