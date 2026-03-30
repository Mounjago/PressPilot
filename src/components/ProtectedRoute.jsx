/**
 * COMPOSANT ROUTE PROTEGEE - Protection des routes avec support workspace
 * Gere auth + role + interface (press/rp)
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import LoadingSpinner from './LoadingSpinner';

// Route protegee standard (auth requise)
const ProtectedRoute = ({
  children,
  requireRole = null,
  requirePermission = null,
  requireInterface = null,
  fallbackPath = '/login'
}) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission: checkPermission
  } = useAuth();
  const { currentWorkspace, isReady, needsWorkspaceSelection, canAccessInterface } = useWorkspace();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('ProtectedRoute:', {
        isAuthenticated,
        isLoading,
        user: user?.email,
        currentPath: location.pathname,
        requireRole,
        requireInterface,
        currentWorkspace,
        isReady
      });
    }
  }, [isAuthenticated, isLoading, user, location.pathname, requireRole, requireInterface, currentWorkspace, isReady]);

  // Chargement de l'auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Non authentifie -> login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Workspace pas encore pret
  if (!isReady) {
    return <LoadingSpinner />;
  }

  // Multi-workspace sans selection -> workspace selector
  if (needsWorkspaceSelection) {
    return <Navigate to="/workspace" replace />;
  }

  // Verification du role
  if (requireRole && !hasRole(requireRole)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          message: `Acces refuse. Role requis: ${requireRole}`,
          from: location.pathname
        }}
        replace
      />
    );
  }

  // Verification de la permission
  if (requirePermission && !checkPermission(requirePermission)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          message: `Acces refuse. Permission requise: ${requirePermission}`,
          from: location.pathname
        }}
        replace
      />
    );
  }

  // Verification de l'interface requise
  if (requireInterface && !canAccessInterface(requireInterface)) {
    // Rediriger vers le dashboard de l'interface courante
    const fallback = currentWorkspace === 'rp' ? '/rp/dashboard' : '/press/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children || <Outlet />;
};

// Route protegee pour l'espace Press
export const PressRoute = ({ children }) => (
  <ProtectedRoute requireInterface="press">
    {children}
  </ProtectedRoute>
);

// Route protegee pour l'espace RP
export const RPRoute = ({ children }) => (
  <ProtectedRoute requireInterface="rp">
    {children}
  </ProtectedRoute>
);

// Route admin (acces aux deux interfaces)
export const AdminRoute = ({ children, fallbackPath = '/workspace' }) => (
  <ProtectedRoute
    requireRole="admin"
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

// Composant pour les routes modérateur
export const ModeratorRoute = ({ children, fallbackPath = '/workspace' }) => (
  <ProtectedRoute
    requireRole={['admin', 'moderator']}
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

// Hook pour les redirections automatiques
export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Redirection geree par les composants
  }, [isAuthenticated, isLoading, location.pathname]);

  return { isAuthenticated, isLoading };
};

// Route publique (redirige si deja connecte)
export const PublicRoute = ({ children, redirectTo = null }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentWorkspace, isMultiWorkspace, isReady } = useWorkspace();

  if (isLoading || !isReady) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Rediriger vers le bon dashboard selon le workspace
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (isMultiWorkspace && !currentWorkspace) {
      return <Navigate to="/workspace" replace />;
    }

    const target = currentWorkspace === 'rp' ? '/rp/dashboard' : '/press/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

// Route conditionnelle
export const ConditionalRoute = ({
  children,
  condition,
  fallback = null,
  redirectTo = null
}) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!condition && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return condition ? children : (fallback || null);
};

export default ProtectedRoute;
