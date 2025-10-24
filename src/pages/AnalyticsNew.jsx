import React, { useState, useEffect } from "react";
import { TrendingUp, Mail, Users, Eye, MousePointer, Calendar, Download, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import "../styles/Dashboard.css";
import "../styles/DashboardExtended.css";
import "../styles/ContactsNew.css";
import "../styles/Analytics.css";
import logo from "../assets/logo-bandstream.png";

// Composants
import Sidebar from "../components/Sidebar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const AnalyticsNew = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [user, setUser] = useState(null);

  // Données d'analytics
  const [analytics, setAnalytics] = useState({
    overview: {
      totalCampaigns: 12,
      totalEmails: 3450,
      avgOpenRate: 42.5,
      avgClickRate: 18.2,
      totalReplies: 89,
      totalUnsubscribes: 23
    },
    trends: {
      openRate: 2.5,
      clickRate: -1.2,
      replyRate: 5.8,
      unsubscribeRate: -0.5
    },
    topCampaigns: [
      {
        id: 1,
        name: "Lancement Album - Nova Dreams",
        openRate: 58.2,
        clickRate: 24.1,
        replies: 15,
        sentDate: "2024-01-15"
      },
      {
        id: 2,
        name: "Interview Radio Disponible",
        openRate: 55.8,
        clickRate: 28.4,
        replies: 12,
        sentDate: "2024-01-08"
      },
      {
        id: 3,
        name: "Single Promo - Echo",
        openRate: 38.9,
        clickRate: 15.6,
        replies: 5,
        sentDate: "2024-01-12"
      }
    ],
    topContacts: [
      {
        id: 1,
        name: "Marie Dubois",
        company: "Le Figaro",
        engagement: 85,
        replies: 8,
        opens: 24
      },
      {
        id: 2,
        name: "Pierre Martin",
        company: "Radio Nova",
        engagement: 78,
        replies: 6,
        opens: 19
      },
      {
        id: 3,
        name: "Sophie Leroux",
        company: "Les Inrockuptibles",
        engagement: 72,
        replies: 5,
        opens: 15
      }
    ],
    timeData: {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul"],
      openRates: [35, 42, 38, 45, 48, 43, 47],
      clickRates: [12, 18, 15, 21, 24, 19, 22],
      emailsSent: [180, 245, 320, 280, 350, 295, 380]
    }
  });

  useEffect(() => {
    loadAnalytics();
    fetchUserData();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Simulation API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Les données sont déjà définies dans le state
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
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

  const getTrendIcon = (trend) => {
    return trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  const getTrendColor = (trend) => {
    return trend > 0 ? "#10b981" : "#ef4444";
  };

  // Configuration des graphiques
  const performanceChartData = {
    labels: analytics.timeData.labels,
    datasets: [
      {
        label: "Taux d'ouverture (%)",
        data: analytics.timeData.openRates,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: "Taux de clic (%)",
        data: analytics.timeData.clickRates,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        yAxisID: 'y'
      }
    ]
  };

  const emailVolumeData = {
    labels: analytics.timeData.labels,
    datasets: [
      {
        label: "Emails envoyés",
        data: analytics.timeData.emailsSent,
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderColor: "#6366f1",
        borderWidth: 1
      }
    ]
  };

  const engagementData = {
    labels: ["Ouvertures", "Clics", "Réponses", "Désabonnements"],
    datasets: [
      {
        data: [analytics.overview.avgOpenRate, analytics.overview.avgClickRate, 12.5, 2.1],
        backgroundColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444"
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)"
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15
        }
      }
    }
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
          <div className="analytics-header">
            <div className="dashboard-header-content">
              <h1 className="dashboard-title">Analytics</h1>
              <p className="dashboard-subtitle">Analysez les performances de vos campagnes</p>
            </div>

            <div className="analytics-controls">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="period-select"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="1y">Dernière année</option>
              </select>
              <button className="btn-secondary">
                <Download size={16} />
                Exporter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="contacts-loading">
              <div className="contacts-loading-spinner"></div>
              <span>Chargement des analytics...</span>
            </div>
          ) : (
            <>
              {/* Métriques principales */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
                    <Mail style={{ color: "#2196F3" }} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Emails envoyés</p>
                    <h3 className="stat-value">{analytics.overview.totalEmails.toLocaleString()}</h3>
                    <div className="stat-trend" style={{ color: getTrendColor(analytics.trends.openRate) }}>
                      {getTrendIcon(analytics.trends.openRate)}
                      <span>{Math.abs(analytics.trends.openRate)}% ce mois</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
                    <Eye style={{ color: "#4CAF50" }} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Taux d'ouverture</p>
                    <h3 className="stat-value">{analytics.overview.avgOpenRate}%</h3>
                    <div className="stat-trend" style={{ color: getTrendColor(analytics.trends.openRate) }}>
                      {getTrendIcon(analytics.trends.openRate)}
                      <span>{Math.abs(analytics.trends.openRate)}% vs mois dernier</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#FFF3E0" }}>
                    <MousePointer style={{ color: "#FF9800" }} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Taux de clic</p>
                    <h3 className="stat-value">{analytics.overview.avgClickRate}%</h3>
                    <div className="stat-trend" style={{ color: getTrendColor(analytics.trends.clickRate) }}>
                      {getTrendIcon(analytics.trends.clickRate)}
                      <span>{Math.abs(analytics.trends.clickRate)}% vs mois dernier</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#F3E5F5" }}>
                    <TrendingUp style={{ color: "#9C27B0" }} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Réponses</p>
                    <h3 className="stat-value">{analytics.overview.totalReplies}</h3>
                    <div className="stat-trend" style={{ color: getTrendColor(analytics.trends.replyRate) }}>
                      {getTrendIcon(analytics.trends.replyRate)}
                      <span>{Math.abs(analytics.trends.replyRate)}% vs mois dernier</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Graphiques de performance */}
              <section className="analytics-charts">
                <div className="chart-row">
                  <div className="chart-card large">
                    <div className="chart-header">
                      <h3 className="chart-title">Performance des campagnes</h3>
                      <p className="chart-subtitle">Évolution des taux d'ouverture et de clic</p>
                    </div>
                    <div className="chart-container">
                      <Line data={performanceChartData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="chart-header">
                      <h3 className="chart-title">Répartition de l'engagement</h3>
                    </div>
                    <div className="chart-container small">
                      <Doughnut data={engagementData} options={doughnutOptions} />
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-header">
                    <h3 className="chart-title">Volume d'emails envoyés</h3>
                  </div>
                  <div className="chart-container medium">
                    <Bar data={emailVolumeData} options={chartOptions} />
                  </div>
                </div>
              </section>

              {/* Tableaux de performance */}
              <section className="analytics-tables">
                <div className="table-row">
                  <div className="analytics-table">
                    <div className="table-header">
                      <h3 className="table-title">Top des campagnes</h3>
                    </div>
                    <div className="table-content">
                      {analytics.topCampaigns.map((campaign, index) => (
                        <div key={campaign.id} className="table-row-item">
                          <div className="rank">#{index + 1}</div>
                          <div className="campaign-info">
                            <h4>{campaign.name}</h4>
                            <span className="date">{new Date(campaign.sentDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="metrics">
                            <div className="metric">
                              <span className="value">{campaign.openRate}%</span>
                              <span className="label">Ouverture</span>
                            </div>
                            <div className="metric">
                              <span className="value">{campaign.clickRate}%</span>
                              <span className="label">Clic</span>
                            </div>
                            <div className="metric">
                              <span className="value">{campaign.replies}</span>
                              <span className="label">Réponses</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-table">
                    <div className="table-header">
                      <h3 className="table-title">Contacts les plus engagés</h3>
                    </div>
                    <div className="table-content">
                      {analytics.topContacts.map((contact, index) => (
                        <div key={contact.id} className="table-row-item">
                          <div className="rank">#{index + 1}</div>
                          <div className="contact-info">
                            <h4>{contact.name}</h4>
                            <span className="company">{contact.company}</span>
                          </div>
                          <div className="engagement-score">
                            <div className="score">{contact.engagement}%</div>
                            <div className="details">
                              <span>{contact.opens} ouvertures</span>
                              <span>{contact.replies} réponses</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AnalyticsNew;