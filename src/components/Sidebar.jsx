import React from "react";
import { NavLink } from "react-router-dom";
import { X, BarChart3, Users, Mail, Phone, Settings, Calendar, TrendingUp } from "lucide-react";
import "../styles/Dashboard.css";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
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
        </nav>
      </aside>
  );
};

export default Sidebar;
