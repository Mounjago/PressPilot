/**
 * CONTEXTE WORKSPACE - Gestion de l'interface active (press / rp)
 * Permet le switch entre les espaces pour les admins
 * Les utilisateurs mono-interface sont automatiquement routes
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Interfaces disponibles
const INTERFACES = {
  PRESS: 'press',
  RP: 'rp'
};

// Mapping role -> interfaces accessibles
const ROLE_INTERFACE_ACCESS = {
  press_agent: [INTERFACES.PRESS],
  bandstream_rp: [INTERFACES.RP],
  admin: [INTERFACES.PRESS, INTERFACES.RP],
  super_admin: [INTERFACES.PRESS, INTERFACES.RP],
  // Legacy roles
  user: [INTERFACES.PRESS],
  moderator: [INTERFACES.PRESS, INTERFACES.RP]
};

// Labels et theming par interface
const WORKSPACE_CONFIG = {
  [INTERFACES.PRESS]: {
    label: 'Attaches de presse',
    shortLabel: 'Presse',
    description: 'Gestion des relations presse pour artistes et projets',
    theme: 'press',
    color: '#6366f1', // indigo
    icon: 'Mail'
  },
  [INTERFACES.RP]: {
    label: 'BandStream RP',
    shortLabel: 'RP',
    description: 'Relations publiques corporate BandStream',
    theme: 'rp',
    color: '#0ea5e9', // sky blue
    icon: 'Building2'
  }
};

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Determiner les interfaces accessibles pour l'utilisateur
  const getAvailableInterfaces = useCallback(() => {
    if (!user) return [];

    // Utiliser les interfaces du JWT/user si disponibles
    if (user.interfaces && Array.isArray(user.interfaces) && user.interfaces.length > 0) {
      return user.interfaces;
    }

    // Fallback sur le mapping par role
    const role = user.role || 'user';
    return ROLE_INTERFACE_ACCESS[role] || [INTERFACES.PRESS];
  }, [user]);

  // Verifier si l'utilisateur peut acceder a une interface
  const canAccessInterface = useCallback((iface) => {
    const available = getAvailableInterfaces();
    return available.includes(iface);
  }, [getAvailableInterfaces]);

  // Verifier si l'utilisateur a acces a plusieurs interfaces
  const isMultiWorkspace = useCallback(() => {
    return getAvailableInterfaces().length > 1;
  }, [getAvailableInterfaces]);

  // Switcher d'interface (admin seulement)
  const switchWorkspace = useCallback((targetWorkspace) => {
    if (!canAccessInterface(targetWorkspace)) {
      console.warn(`Acces refuse a l'interface: ${targetWorkspace}`);
      return false;
    }

    setCurrentWorkspace(targetWorkspace);
    localStorage.setItem('pp_workspace', targetWorkspace);
    return true;
  }, [canAccessInterface]);

  // Initialiser le workspace au chargement ou changement d'utilisateur
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCurrentWorkspace(null);
      setIsReady(true);
      return;
    }

    const availableInterfaces = getAvailableInterfaces();

    if (availableInterfaces.length === 0) {
      console.error('Aucune interface disponible pour cet utilisateur');
      setCurrentWorkspace(null);
      setIsReady(true);
      return;
    }

    // Pour les utilisateurs mono-interface, auto-selectionner
    if (availableInterfaces.length === 1) {
      setCurrentWorkspace(availableInterfaces[0]);
      localStorage.setItem('pp_workspace', availableInterfaces[0]);
      setIsReady(true);
      return;
    }

    // Pour les multi-interface (admins), essayer de restaurer la derniere selection
    const savedWorkspace = localStorage.getItem('pp_workspace');
    if (savedWorkspace && availableInterfaces.includes(savedWorkspace)) {
      setCurrentWorkspace(savedWorkspace);
      setIsReady(true);
      return;
    }

    // Sinon, laisser null pour que le WorkspaceSelector s'affiche
    setCurrentWorkspace(null);
    setIsReady(true);
  }, [isAuthenticated, user, getAvailableInterfaces]);

  // Configuration du workspace actuel
  const workspaceConfig = currentWorkspace ? WORKSPACE_CONFIG[currentWorkspace] : null;

  // Determiner si le selecteur de workspace doit etre affiche
  const needsWorkspaceSelection = isReady && isAuthenticated && isMultiWorkspace() && !currentWorkspace;

  const contextValue = {
    // Etat
    currentWorkspace,
    workspaceConfig,
    isReady,
    needsWorkspaceSelection,

    // Interfaces disponibles
    availableInterfaces: getAvailableInterfaces(),
    isMultiWorkspace: isMultiWorkspace(),

    // Actions
    switchWorkspace,
    canAccessInterface,

    // Config
    INTERFACES,
    WORKSPACE_CONFIG
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace doit etre utilise dans un WorkspaceProvider');
  }
  return context;
};

export { INTERFACES, WORKSPACE_CONFIG, ROLE_INTERFACE_ACCESS };
export default WorkspaceContext;
