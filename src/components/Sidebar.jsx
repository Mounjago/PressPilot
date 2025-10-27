import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { X, BarChart3, Users, Mail, Phone, Settings, Calendar, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Dashboard.css";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/login');
    }
  };

  const menuItems = [
    { to: "/dashboard", label: "Tableau de bord", icon: BarChart3 },
    { to: "/artists", label: "Artistes", icon: Users },
    { to: "/contacts", label: "Contacts", icon: Users },
    { to: "/campaigns", label: "Campagnes", icon: Mail },
    { to: "/phoning", label: "Phoning", icon: Phone },
    { to: "/analytics", label: "Analytics", icon: TrendingUp },
    { to: "/analytics/best-times", label: "Meilleurs moments", icon: Calendar },
    { to: "/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile close button */}
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button
            onClick={onClose}
            className="sidebar-close"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

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
                  // Close sidebar on mobile when link is clicked
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

          {/* Bouton de déconnexion */}
          <div className="nav-logout">
            <button
              onClick={handleLogout}
              className="nav-item logout-button"
              title="Se déconnecter"
            >
              <LogOut className="nav-icon" />
              <span className="nav-label">Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>
  );
};

export default Sidebar;
