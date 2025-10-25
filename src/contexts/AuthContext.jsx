/**
 * CONTEXTE D'AUTHENTIFICATION - Gestion globale de l'état utilisateur
 * Context React pour l'authentification et la gestion des utilisateurs
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import config from '../config';

// Actions du reducer
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// État initial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLoginAttempt: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1,
        lastLoginAttempt: new Date()
      };

    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user || state.user,
        isAuthenticated: true
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading
      };

    default:
      return state;
  }
};

// Créer le contexte
const AuthContext = createContext();

// Configuration d'Axios
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Utilitaires pour le localStorage
const storage = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  removeToken: () => {
    localStorage.removeItem('authToken');
  },
  setUser: (user) => {
    localStorage.setItem('authUser', JSON.stringify(user));
  },
  getUser: () => {
    const userData = localStorage.getItem('authUser');
    return userData ? JSON.parse(userData) : null;
  },
  removeUser: () => {
    localStorage.removeItem('authUser');
  },
  clear: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Nettoyer aussi l'ancien format si présent
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Utilitaire pour valider un token JWT
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // Vérifier si le token n'est pas expiré
    if (decoded.exp < currentTime) {
      return false;
    }

    // Vérifier l'issuer et l'audience si disponibles
    if (decoded.iss && decoded.iss !== 'presspilot') {
      return false;
    }

    if (decoded.aud && decoded.aud !== 'presspilot-users') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la validation du token:', error);
    return false;
  }
};

// Provider du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialiser l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 Initializing AuthContext...');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: true } });

      try {
        const token = storage.getToken();
        const user = storage.getUser();

        console.log('📱 Storage check:', { hasToken: !!token, hasUser: !!user });

        if (token && user) {
          // Si nous avons un token et des données utilisateur, les utiliser directement
          console.log('✅ Token and user data found in storage');
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { token, user }
          });

          // Désactiver temporairement la vérification serveur pour éviter les loops
          // TODO: Réactiver quand le backend sera stable
          /*
          api.get('/api/auth/me')
            .then(response => {
              if (response.data.success) {
                console.log('✅ Background token verification successful');
                storage.setUser(response.data.user);
                dispatch({
                  type: AUTH_ACTIONS.UPDATE_PROFILE,
                  payload: { user: response.data.user }
                });
              }
            })
            .catch(error => {
              console.warn('⚠️ Background verification failed, continuing with cached data:', error.message);
            });
          */
        } else {
          // Token invalide ou inexistant
          console.log('🚫 No valid token found');
          storage.clear();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('❌ AuthContext initialization error:', error);
        storage.clear();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: false } });
      console.log('✅ AuthContext initialization complete');
    };

    initAuth();
  }, []);

  // Intercepteur pour gérer les erreurs d'authentification
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          console.log('Token expiré détecté, déconnexion automatique');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;

        // Stocker en localStorage
        storage.setToken(token);
        storage.setUser(user);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { token, user }
        });

        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Erreur de connexion');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de connexion';

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await api.post('/api/auth/register', userData);

      if (response.data.success) {
        const { token, user } = response.data;

        // Stocker en localStorage
        storage.setToken(token);
        storage.setUser(user);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { token, user }
        });

        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Erreur d\'inscription');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur d\'inscription';

      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Informer le serveur de la déconnexion
      if (state.token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      // Nettoyer côté client dans tous les cas
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);

      if (response.data.success) {
        const updatedUser = response.data.user;

        // Mettre à jour en localStorage
        storage.setUser(updatedUser);

        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: { user: updatedUser }
        });

        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.data.message || 'Erreur de mise à jour');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de mise à jour';
      return { success: false, error: errorMessage };
    }
  };

  // Fonction de rafraîchissement du token
  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh-token');

      if (response.data.success) {
        const { token, user } = response.data;

        storage.setToken(token);
        if (user) {
          storage.setUser(user);
        }

        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH,
          payload: { token, user }
        });

        return { success: true, token };
      } else {
        throw new Error('Erreur de rafraîchissement');
      }
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      logout();
      return { success: false, error: 'Session expirée' };
    }
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Vérifier si l'utilisateur a les permissions pour une action
  const hasPermission = (permission) => {
    if (!state.user) return false;

    // Les admins ont toutes les permissions
    if (state.user.role === 'admin') return true;

    // Logique de permissions personnalisée selon vos besoins
    return state.user.permissions?.includes(permission) || false;
  };

  // Valeurs du contexte
  const contextValue = {
    // État
    ...state,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    clearError,

    // Utilitaires
    hasRole,
    hasPermission,

    // API configurée
    api
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
};

// Hook pour les routes protégées
export const useAuthRequired = () => {
  const auth = useAuth();

  // Note: La redirection est gérée par ProtectedRoute
  // Ce hook retourne simplement l'état d'auth
  return auth;
};

export default AuthContext;