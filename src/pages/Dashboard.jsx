import React from "react";
import "../styles/Dashboard.css";
import logo from "../assets/logo-bandstream.png";

// Composants réactivés
import StatsGraph from "../components/StatsGraph";
import CampaignList from "../components/CampaignList";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <img src={logo} alt="Logo PressPilot" className="logo" />
          <div className="app-name">PressPilot</div>
        </div>
        <div className="user-menu">
          <div className="avatar">JP</div>
        </div>
      </header>

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <h1 className="dashboard-title">Tableau de bord</h1>

          <section className="dashboard-section">
            <StatsGraph />
          </section>

          <section className="dashboard-section">
            <CampaignList />
          </section>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;
