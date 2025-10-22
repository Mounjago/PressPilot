// src/App.jsx - Version mise à jour avec routes protégées
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import authService from "./utils/authService";

function App() {
  // Logger d'erreurs globales
  React.useEffect(() => {
    window.onerror = (msg, src, line, col, error) => {
      console.error("🌍 GLOBAL JS ERROR:", msg, error);
    };
  }, []);

  // Configurer l'intercepteur Axios pour ajouter le token à chaque requête
  React.useEffect(() => {
    const axios = require('axios');
    
    // Intercepteur de requête pour ajouter le token d'authentification
    axios.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Intercepteur de réponse pour gérer les erreurs d'authentification
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expiré ou invalide, déconnecter l'utilisateur
          authService.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }, []);

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Ajoutez d'autres routes protégées ici */}
      </Route>
    </Routes>
  );
}

export default App;
