import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Dashboard.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="nav-menu">
        <NavLink to="/dashboard" className="nav-item">
          Tableau de bord
        </NavLink>

        <NavLink to="/artists" className="nav-item">
          Artistes
        </NavLink>

        <NavLink to="/contacts" className="nav-item">
          Contacts
        </NavLink>

        <NavLink to="/campaigns" className="nav-item">
          Campagnes
        </NavLink>

        <NavLink to="/phoning" className="nav-item">
          Phoning
        </NavLink>

        <NavLink to="/analytics" className="nav-item">
          Analytics
        </NavLink>

        <NavLink to="/analytics/best-times" className="nav-item">
          Meilleurs moments
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          Paramètres
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
