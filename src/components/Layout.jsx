/**
 * LAYOUT - Mise en page avec theming workspace
 * Applique un data-workspace attribute pour le theming CSS
 */

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { useWorkspace } from "../contexts/WorkspaceContext";
import logo from "../assets/logo-presspilot.png";
import "../styles/Dashboard.css";

const Layout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentWorkspace, workspaceConfig } = useWorkspace();

  const user = (() => {
    try {
      // Essayer authUser d'abord, puis user (legacy)
      const data = localStorage.getItem("authUser") || localStorage.getItem("user");
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  })();

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="dashboard" data-workspace={currentWorkspace || 'press'}>
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo-container">
            <img src={logo} alt="Logo PressPilot" className="logo" />
            {workspaceConfig && (
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: workspaceConfig.color,
                background: `${workspaceConfig.color}10`,
                padding: '2px 8px',
                borderRadius: '4px',
                marginLeft: '8px'
              }}>
                {workspaceConfig.shortLabel}
              </span>
            )}
          </div>
        </div>
        <div className="user-menu">
          <div className="avatar">{getInitials(user?.name || user?.email)}</div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Overlay pour mobile */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="dashboard-main">
          {(title || subtitle) && (
            <div className="dashboard-header-content">
              {title && <h1 className="dashboard-title">{title}</h1>}
              {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
