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
    fetchDashboardData();
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
      <section className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="stat-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="stat-icon flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="stat-content min-w-0 flex-1">
              <p className="stat-label text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
              <h3 className="stat-value text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalContacts.toLocaleString()}</h3>
              <span className="stat-change text-xs sm:text-sm font-medium text-green-600">+{stats.monthlyGrowth}% ce mois</span>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="stat-icon flex-shrink-0 w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div className="stat-content min-w-0 flex-1">
              <p className="stat-label text-sm font-medium text-gray-600 mb-1">Campagnes</p>
              <h3 className="stat-value text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalCampaigns}</h3>
              <span className="stat-subtitle text-xs sm:text-sm text-gray-500">{stats.totalEmails} emails envoyés</span>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="stat-icon flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="stat-content min-w-0 flex-1">
              <p className="stat-label text-sm font-medium text-gray-600 mb-1">Taux d'ouverture</p>
              <h3 className="stat-value text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.avgOpenRate.toFixed(1)}%</h3>
              <span className="stat-subtitle text-xs sm:text-sm text-gray-500">Moyenne globale</span>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="stat-icon flex-shrink-0 w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="stat-content min-w-0 flex-1">
              <p className="stat-label text-sm font-medium text-gray-600 mb-1">Prochaine campagne</p>
              {loading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              ) : stats.totalCampaigns > 0 ? (
                <>
                  <h3 className="stat-value text-lg sm:text-xl font-bold text-gray-900 mb-1">Planifiée</h3>
                  <span className="stat-subtitle text-xs sm:text-sm text-gray-500 truncate">Consultez vos campagnes</span>
                </>
              ) : (
                <>
                  <h3 className="stat-value text-lg sm:text-xl font-bold text-gray-500 mb-1">Aucune</h3>
                  <span className="stat-subtitle text-xs sm:text-sm text-gray-500 truncate">Créez votre première campagne</span>
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
