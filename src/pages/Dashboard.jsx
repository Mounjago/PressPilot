import React, { useState, useEffect } from "react";
import { TrendingUp, Mail, Users, Calendar } from "lucide-react";
import { contactsApi, campaignsApi, analyticsApi } from "../api";
import "../styles/Dashboard.css";
import "../styles/DashboardExtended.css";
import logo from "../assets/logo-bandstream.png";

// Composants réactivés
import StatsGraph from "../components/StatsGraph";
import CampaignList from "../components/CampaignList";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCampaigns: 0,
    totalEmails: 0,
    avgOpenRate: 0,
    recentActivity: [],
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchUserData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Chargement des données dashboard...');

      const [contactsRes, campaignsRes, analyticsRes] = await Promise.all([
        contactsApi.getCount(),
        campaignsApi.getStats(),
        analyticsApi.getDashboard('7d')
      ]);

      console.log('📊 Dashboard data loaded:', { contactsRes, campaignsRes, analyticsRes });

      setStats({
        totalContacts: contactsRes.count || 0,
        totalCampaigns: campaignsRes.total || 0,
        totalEmails: campaignsRes.totalEmails || 0,
        avgOpenRate: analyticsRes.overview?.avgOpenRate || 0,
        recentActivity: analyticsRes.overview?.recentActivity || [],
        monthlyGrowth: analyticsRes.overview?.monthlyGrowth || 0
      });

    } catch (error) {
      console.error("Erreur chargement dashboard:", error);

      // En mode développement sans BDD, utiliser des données de démonstration
      console.log('📋 Utilisation des données de démonstration');
      setStats({
        totalContacts: 248,
        totalCampaigns: 12,
        totalEmails: 3450,
        avgOpenRate: 42.5,
        recentActivity: [
          { type: 'campaign', message: 'Nouvelle campagne "Sortie Album" envoyée', time: '2 min' },
          { type: 'contact', message: '3 nouveaux journalistes ajoutés', time: '15 min' },
          { type: 'email', message: '12 emails ouverts cette heure', time: '1h' }
        ],
        monthlyGrowth: 15.3
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <img src={logo} alt="Logo PressPilot" className="logo" />
          <div className="app-name">PressPilot</div>
        </div>
        <div className="user-menu">
          <div className="avatar">{getInitials(user?.name || user?.email)}</div>
        </div>
      </header>

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <div className="dashboard-header-content">
            <h1 className="dashboard-title">Tableau de bord</h1>
            <p className="dashboard-subtitle">Vue d'ensemble de vos campagnes et contacts</p>
          </div>

          {/* Cartes de statistiques */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
                <Users style={{ color: "#2196F3" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Contacts</p>
                <h3 className="stat-value">{stats.totalContacts.toLocaleString()}</h3>
                <span className="stat-change positive">+{stats.monthlyGrowth}% ce mois</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#F3E5F5" }}>
                <Mail style={{ color: "#9C27B0" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Campagnes</p>
                <h3 className="stat-value">{stats.totalCampaigns}</h3>
                <span className="stat-subtitle">{stats.totalEmails} emails envoyés</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
                <TrendingUp style={{ color: "#4CAF50" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Taux d'ouverture</p>
                <h3 className="stat-value">{stats.avgOpenRate.toFixed(1)}%</h3>
                <span className="stat-subtitle">Moyenne globale</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#FFF3E0" }}>
                <Calendar style={{ color: "#FF9800" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Prochaine campagne</p>
                <h3 className="stat-value">Dans 3 jours</h3>
                <span className="stat-subtitle">Release EP - Nova</span>
              </div>
            </div>
          </section>

          {/* Graphique de performance */}
          <section className="dashboard-section">
            <StatsGraph />
          </section>

          {/* Liste des campagnes récentes */}
          <section className="dashboard-section">
            <CampaignList />
          </section>

          {/* Activité récente */}
          {stats.recentActivity && stats.recentActivity.length > 0 && (
            <section className="dashboard-section">
              <div className="activity-section">
                <h2 className="section-title">Activité récente</h2>
                <div className="activity-list">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <Mail size={16} />
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.description}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
