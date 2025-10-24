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
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav-menu flex flex-col p-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => {
                  // Close sidebar on mobile when link is clicked
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
              >
                <IconComponent size={20} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
