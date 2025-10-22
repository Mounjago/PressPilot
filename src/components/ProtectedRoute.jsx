/**
 * COMPOSANT ROUTE PROTÉGÉE - Protection des routes nécessitant une authentification
 * Composant React pour protéger les pages nécessitant une connexion
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Composant principal de route protégée
const ProtectedRoute = ({
  children,
  requireRole = null,
  requirePermission = null,
  fallbackPath = '/login'
}) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission: checkPermission
  } = useAuth();
  const location = useLocation();

  // Log pour le débogage en développement
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('ProtectedRoute:', {
        isAuthenticated,
        isLoading,
        user: user?.email,
        currentPath: location.pathname,
        requireRole,
        requirePermission
      });
    }
  }, [isAuthenticated, isLoading, user, location.pathname, requireRole, requirePermission]);

  // Afficher le chargement pendant la vérification de l'authentification
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Vérifier le rôle requis si spécifié
  if (requireRole && !hasRole(requireRole)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          message: `Accès refusé. Rôle requis: ${requireRole}`,
          from: location.pathname
        }}
        replace
      />
    );
  }

  // Vérifier la permission requise si spécifiée
  if (requirePermission && !checkPermission(requirePermission)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          message: `Accès refusé. Permission requise: ${requirePermission}`,
          from: location.pathname
        }}
        replace
      />
    );
  }

  // Rendre les enfants ou utiliser Outlet pour les routes nested
  return children || <Outlet />;
};

// Composant spécialisé pour les routes admin
export const AdminRoute = ({ children, fallbackPath = '/dashboard' }) => (
  <ProtectedRoute
    requireRole="admin"
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

// Composant spécialisé pour les routes modérateur
export const ModeratorRoute = ({ children, fallbackPath = '/dashboard' }) => (
  <ProtectedRoute
    requireRole={['admin', 'moderator']}
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

// Hook personnalisé pour les redirections automatiques
export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Rediriger les utilisateurs authentifiés loin des pages publiques
    if (isAuthenticated && !isLoading) {
      const publicPaths = ['/login', '/register', '/'];

      if (publicPaths.includes(location.pathname)) {
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  return { isAuthenticated, isLoading };
};

// Composant pour les pages publiques (redirige si déjà connecté)
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Rendre les enfants si non authentifié
  return children;
};

// Composant de route conditionnelle
export const ConditionalRoute = ({
  children,
  condition,
  fallback = null,
  redirectTo = null
}) => {
  const { isLoading } = useAuth();

  // Afficher le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger si une URL de redirection est fournie
  if (!condition && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Rendre le fallback ou les enfants selon la condition
  return condition ? children : (fallback || null);
};

export default ProtectedRoute;