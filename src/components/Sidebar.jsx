/**
 * SIDEBAR - Navigation contextuelle selon le workspace actif
 * Affiche des menus differents pour press vs rp
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  X, BarChart3, Users, Mail, Phone, Settings, Calendar,
  TrendingUp, LogOut, FileText, FolderOpen, Building2, ArrowLeftRight,
  Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import "../styles/Dashboard.css";

// Menu items pour l'espace Attaches de presse
const PRESS_MENU = [
  { to: "/press/dashboard", label: "Tableau de bord", icon: BarChart3 },
  { to: "/press/artists", label: "Artistes", icon: Users },
  { to: "/press/contacts", label: "Contacts", icon: Users },
  { to: "/press/campaigns", label: "Campagnes", icon: Mail },
  { to: "/press/phoning", label: "Phoning", icon: Phone },
  { to: "/press/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/press/analytics/best-times", label: "Meilleurs moments", icon: Calendar },
  { to: "/press/settings", label: "Parametres", icon: Settings },
];

// Menu items pour l'espace BandStream RP
const RP_MENU = [
  { to: "/rp/dashboard", label: "Tableau de bord", icon: BarChart3 },
  { to: "/rp/press-releases", label: "Communiques", icon: FileText },
  { to: "/rp/events", label: "Evenements", icon: Calendar },
  { to: "/rp/media-kits", label: "Dossiers de presse", icon: FolderOpen },
  { to: "/rp/contacts", label: "Contacts", icon: Users },
  { to: "/rp/settings", label: "Parametres", icon: Settings },
];

// Menu items pour l'espace Admin
const ADMIN_MENU = [
  { to: "/admin/dashboard", label: "Admin", icon: Shield },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/organizations", label: "Organisations", icon: Building2 },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { currentWorkspace, workspaceConfig, isMultiWorkspace, switchWorkspace, INTERFACES } = useWorkspace();

  // Verifier si l'utilisateur est admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la deconnexion:', error);
      navigate('/login');
    }
  };

  const handleSwitchWorkspace = () => {
    // Aller vers le selecteur de workspace
    navigate('/workspace');
  };

  // Selectionner le menu selon le workspace
  const menuItems = currentWorkspace === 'rp' ? RP_MENU : PRESS_MENU;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile close button */}
      <div className="sidebar-header">
        <span className="sidebar-title">
          {workspaceConfig?.shortLabel || 'Menu'}
        </span>
        <button
          onClick={onClose}
          className="sidebar-close"
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Workspace indicator */}
      {workspaceConfig && (
        <div style={{
          padding: '8px 16px',
          margin: '0 12px 8px',
          borderRadius: '8px',
          background: `${workspaceConfig.color}10`,
          borderLeft: `3px solid ${workspaceConfig.color}`,
          fontSize: '12px',
          color: workspaceConfig.color,
          fontWeight: '500'
        }}>
          {currentWorkspace === 'rp' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> {workspaceConfig.label}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> {workspaceConfig.label}
            </span>
          )}
        </div>
      )}

      <nav className="nav-menu">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => {
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
            >
              <IconComponent className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Bouton switch workspace (multi-workspace seulement) */}
        {isMultiWorkspace && (
          <div style={{ padding: '8px 12px', marginTop: '8px' }}>
            <button
              onClick={handleSwitchWorkspace}
              className="nav-item"
              style={{
                width: '100%',
                background: 'none',
                border: '1px dashed #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                color: '#6b7280',
                fontSize: '14px'
              }}
              title="Changer d'espace de travail"
            >
              <ArrowLeftRight size={16} />
              <span>Changer d'espace</span>
            </button>
          </div>
        )}

        {/* Section Admin (admin/super_admin seulement) */}
        {isAdmin && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{
              padding: '4px 16px', fontSize: '10px', fontWeight: '600',
              color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Administration
            </div>
            {ADMIN_MENU.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                >
                  <IconComponent className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Bouton de deconnexion */}
        <div className="nav-logout">
          <button
            onClick={handleLogout}
            className="nav-item logout-button"
            title="Se deconnecter"
          >
            <LogOut className="nav-icon" />
            <span className="nav-label">Deconnexion</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
