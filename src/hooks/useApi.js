import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3535';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    method = 'GET',
    body = null,
    skip = false,
    dependencies = [],
  } = options;

  const fetchData = useCallback(async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);

      const config = {
        method,
        url,
        ...(body && { data: body }),
      };

      const response = await api(config);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [url, method, body, skip, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api({
        url,
        method: 'POST',
        ...options,
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Une erreur est survenue';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur de connexion');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur d\'inscription');
    }
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
};

export const useContacts = () => {
  const { data: contacts, loading, error, refetch } = useApi('/contacts');
  const { mutate } = useMutation();

  const importContacts = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await mutate('/import/contacts', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    refetch();
    return result;
  }, [mutate, refetch]);

  const deleteContact = useCallback(async (contactId) => {
    await mutate(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
    refetch();
  }, [mutate, refetch]);

  const updateContact = useCallback(async (contactId, updates) => {
    const result = await mutate(`/contacts/${contactId}`, {
      method: 'PATCH',
      data: updates,
    });
    refetch();
    return result;
  }, [mutate, refetch]);

  return {
    contacts: contacts || [],
    loading,
    error,
    refetch,
    importContacts,
    deleteContact,
    updateContact,
  };
};

export const useCampaigns = () => {
  const { data: campaigns, loading, error, refetch } = useApi('/campaigns');
  const { mutate } = useMutation();

  const createCampaign = useCallback(async (campaignData) => {
    const result = await mutate('/campaigns', {
      method: 'POST',
      data: campaignData,
    });
    refetch();
    return result;
  }, [mutate, refetch]);

  const sendCampaign = useCallback(async (campaignId, recipients) => {
    const result = await mutate(`/campaigns/${campaignId}/send`, {
      method: 'POST',
      data: { recipients },
    });
    refetch();
    return result;
  }, [mutate, refetch]);

  const getCampaignStats = useCallback(async (campaignId) => {
    return await mutate(`/campaigns/${campaignId}/stats`, {
      method: 'GET',
    });
  }, [mutate]);

  return {
    campaigns: campaigns || [],
    loading,
    error,
    refetch,
    createCampaign,
    sendCampaign,
    getCampaignStats,
  };
};

export default api;