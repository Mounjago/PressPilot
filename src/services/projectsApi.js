import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://backend-presspilot-production.up.railway.app';

const projectsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
projectsApi.interceptors.request.use(
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
projectsApi.interceptors.response.use(
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

// Service pour la gestion des projets
const projectsService = {
  // Récupérer tous les projets de l'utilisateur
  async getProjects() {
    try {
      const response = await projectsApi.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des projets:', error);

      // Fallback vers localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      console.log('🔄 Utilisation des données locales:', localProjects.length, 'projets');
      return localProjects;
    }
  },

  // Créer un nouveau projet
  async createProject(projectData) {
    try {
      const response = await projectsApi.post('/projects', projectData);

      // Synchroniser avec localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      localProjects.push(response.data);
      localStorage.setItem('presspilot-projects', JSON.stringify(localProjects));

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);

      // Fallback vers localStorage
      const newProject = {
        ...projectData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      localProjects.push(newProject);
      localStorage.setItem('presspilot-projects', JSON.stringify(localProjects));

      console.log('💾 Projet sauvegardé localement');
      return newProject;
    }
  },

  // Mettre à jour un projet
  async updateProject(projectId, projectData) {
    try {
      const response = await projectsApi.put(`/projects/${projectId}`, projectData);

      // Synchroniser avec localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      const index = localProjects.findIndex(p => p.id === projectId || p._id === projectId);
      if (index !== -1) {
        localProjects[index] = response.data;
        localStorage.setItem('presspilot-projects', JSON.stringify(localProjects));
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);

      // Fallback vers localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      const index = localProjects.findIndex(p => p.id === projectId || p._id === projectId);

      if (index !== -1) {
        localProjects[index] = {
          ...localProjects[index],
          ...projectData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('presspilot-projects', JSON.stringify(localProjects));
        console.log('💾 Projet mis à jour localement');
        return localProjects[index];
      }

      throw error;
    }
  },

  // Supprimer un projet
  async deleteProject(projectId) {
    try {
      await projectsApi.delete(`/projects/${projectId}`);

      // Synchroniser avec localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      const filteredProjects = localProjects.filter(p => p.id !== projectId && p._id !== projectId);
      localStorage.setItem('presspilot-projects', JSON.stringify(filteredProjects));

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);

      // Fallback vers localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      const filteredProjects = localProjects.filter(p => p.id !== projectId && p._id !== projectId);
      localStorage.setItem('presspilot-projects', JSON.stringify(filteredProjects));

      console.log('💾 Projet supprimé localement');
      return true;
    }
  },

  // Récupérer les projets d'un artiste spécifique
  async getProjectsByArtist(artistId) {
    try {
      const response = await projectsApi.get(`/projects/artist/${artistId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des projets de l\'artiste:', error);

      // Fallback vers localStorage
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
      const artistProjects = localProjects.filter(p => p.artistId === artistId || p.artist === artistId);
      return artistProjects;
    }
  },

  // Synchroniser les données locales avec l'API
  async syncLocalProjects() {
    try {
      const localProjects = JSON.parse(localStorage.getItem('presspilot-projects') || '[]');

      if (localProjects.length === 0) {
        console.log('Aucun projet local à synchroniser');
        return [];
      }

      const response = await projectsApi.post('/projects/sync', {
        projects: localProjects
      });

      if (response.data && response.data.projects) {
        localStorage.setItem('presspilot-projects', JSON.stringify(response.data.projects));
        console.log('✅ Synchronisation des projets réussie:', response.data.projects.length, 'projets');
        return response.data.projects;
      }

      return localProjects;
    } catch (error) {
      console.error('Erreur lors de la synchronisation des projets:', error);
      return JSON.parse(localStorage.getItem('presspilot-projects') || '[]');
    }
  }
};

export default projectsService;