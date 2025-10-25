import React, { useState, useEffect } from "react";
import { TrendingUp, Mail, Users, Calendar } from "lucide-react";
import { contactsApi, campaignsApi, analyticsApi } from "../api";
import "../styles/Dashboard.css";
import "../styles/DashboardExtended.css";

// Composants réactivés
import StatsGraph from "../components/StatsGraph";
import CampaignList from "../components/CampaignList";
import Layout from "../components/Layout";

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

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
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

      // Reset to empty state when API fails
      setStats({
        totalContacts: 0,
        totalCampaigns: 0,
        totalEmails: 0,
        avgOpenRate: 0,
        recentActivity: [],
        monthlyGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Layout title="Tableau de bord" subtitle="Vue d'ensemble de vos campagnes et contacts">
      {/* Cartes de statistiques */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon blue">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Contacts</p>
              <h3 className="stat-value">{stats.totalContacts.toLocaleString()}</h3>
              <span className="stat-change">+{stats.monthlyGrowth}% ce mois</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon purple">
              <Mail size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Campagnes</p>
              <h3 className="stat-value">{stats.totalCampaigns}</h3>
              <span className="stat-subtitle">{stats.totalEmails} emails envoyés</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Taux d'ouverture</p>
              <h3 className="stat-value">{stats.avgOpenRate.toFixed(1)}%</h3>
              <span className="stat-subtitle">Moyenne globale</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon orange">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Prochaine campagne</p>
              {loading ? (
                <div style={{height: '1.5rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.25rem'}}></div>
              ) : stats.totalCampaigns > 0 ? (
                <>
                  <h3 className="stat-value">Planifiée</h3>
                  <span className="stat-subtitle">Consultez vos campagnes</span>
                </>
              ) : (
                <>
                  <h3 className="stat-value" style={{color: '#6b7280'}}>Aucune</h3>
                  <span className="stat-subtitle">Créez votre première campagne</span>
                </>
              )}
            </div>
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
    </Layout>
  );
};

export default Dashboard;
