import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Send, Edit3, Trash2, Eye, Calendar, Users, Mail, TrendingUp } from "lucide-react";
import axios from "axios";
import "../styles/Dashboard.css";
import "../styles/DashboardExtended.css";
import "../styles/ContactsNew.css";
import "../styles/Campaigns.css";

// Composants
import Layout from "../components/Layout";
import CampaignModal from "../components/CampaignModal";

const CampaignsNew = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [user, setUser] = useState(null);

  // Stats des campagnes
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    draft: 0,
    avgOpenRate: 0,
    totalEmails: 0
  });


  useEffect(() => {
    loadCampaigns();
    fetchUserData();
  }, []);

  useEffect(() => {
    filterCampaigns();
    calculateStats();
  }, [campaigns, searchTerm, filterStatus]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // Les campagnes seront chargées depuis l'API
      setCampaigns([]);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(campaign =>
        campaign.name?.toLowerCase().includes(term) ||
        campaign.subject?.toLowerCase().includes(term) ||
        campaign.artist?.toLowerCase().includes(term) ||
        campaign.project?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(campaign => campaign.status === filterStatus);
    }

    setFilteredCampaigns(filtered);
  };

  const calculateStats = () => {
    const total = campaigns.length;
    const sent = campaigns.filter(c => c.status === "sent").length;
    const draft = campaigns.filter(c => c.status === "draft").length;
    const sentCampaigns = campaigns.filter(c => c.status === "sent");
    const avgOpenRate = sentCampaigns.length > 0
      ? sentCampaigns.reduce((sum, c) => sum + c.open_rate, 0) / sentCampaigns.length
      : 0;
    const totalEmails = campaigns.reduce((sum, c) => sum + c.recipients_count, 0);

    setStats({ total, sent, draft, avgOpenRate, totalEmails });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent": return "#10b981";
      case "draft": return "#f59e0b";
      case "scheduled": return "#6366f1";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "sent": return "Envoyée";
      case "draft": return "Brouillon";
      case "scheduled": return "Programmée";
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "album": return "💿";
      case "single": return "🎵";
      case "tour": return "🎤";
      case "media": return "📻";
      default: return "📧";
    }
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) {
      try {
        // Simulation suppression
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (window.confirm("Êtes-vous sûr de vouloir envoyer cette campagne ?")) {
      try {
        // Simulation envoi
        setCampaigns(campaigns.map(c =>
          c.id === campaignId
            ? { ...c, status: "sent", sent_at: new Date().toISOString() }
            : c
        ));
      } catch (error) {
        console.error('Erreur envoi:', error);
      }
    }
  };

  return (
    <Layout title="Campagnes" subtitle="Gérez vos campagnes de relations presse">

          {/* Statistiques des campagnes */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
                <Mail style={{ color: "#2196F3" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Campagnes</p>
                <h3 className="stat-value">{stats.total}</h3>
                <span className="stat-subtitle">{stats.totalEmails} emails envoyés</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
                <Send style={{ color: "#4CAF50" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Envoyées</p>
                <h3 className="stat-value">{stats.sent}</h3>
                <span className="stat-subtitle">Campagnes actives</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#FFF3E0" }}>
                <Edit3 style={{ color: "#FF9800" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Brouillons</p>
                <h3 className="stat-value">{stats.draft}</h3>
                <span className="stat-subtitle">En préparation</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#F3E5F5" }}>
                <TrendingUp style={{ color: "#9C27B0" }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Taux d'ouverture</p>
                <h3 className="stat-value">{stats.avgOpenRate.toFixed(1)}%</h3>
                <span className="stat-subtitle">Moyenne générale</span>
              </div>
            </div>
          </section>

          {/* En-tête avec actions */}
          <div className="contacts-header">
            <div className="contacts-title-section">
              <span className="contacts-count">
                {filteredCampaigns.length} campagne{filteredCampaigns.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="contacts-actions">
              <button className="btn-primary" onClick={handleCreateCampaign}>
                <Plus />
                Nouvelle campagne
              </button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <section className="contacts-filters">
            <div className="contacts-search">
              <Search />
              <input
                type="text"
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="contacts-filter-controls">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="contacts-filter-select"
              >
                <option value="all">Toutes les campagnes</option>
                <option value="sent">Envoyées</option>
                <option value="draft">Brouillons</option>
                <option value="scheduled">Programmées</option>
              </select>
            </div>
          </section>

          {/* Liste des campagnes */}
          <section className="campaigns-grid">
            {loading ? (
              <div className="contacts-loading">
                <div className="contacts-loading-spinner"></div>
                <span>Chargement des campagnes...</span>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="contacts-empty">
                <Mail className="contacts-empty-icon" />
                <h3>Aucune campagne trouvée</h3>
                <p>Créez votre première campagne pour commencer.</p>
                <button className="btn-primary" onClick={handleCreateCampaign}>
                  <Plus />
                  Créer une campagne
                </button>
              </div>
            ) : (
              <div className="campaigns-list">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="campaign-card">
                    <div className="campaign-card-header">
                      <div className="campaign-type-icon">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div className="campaign-info">
                        <h3 className="campaign-name">{campaign.name}</h3>
                        <p className="campaign-subject">{campaign.subject}</p>
                        <div className="campaign-meta">
                          <span className="campaign-artist">{campaign.artist}</span>
                          <span className="campaign-separator">•</span>
                          <span className="campaign-project">{campaign.project}</span>
                        </div>
                      </div>
                      <div className="campaign-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(campaign.status) }}
                        >
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                    </div>

                    <div className="campaign-card-body">
                      <div className="campaign-metrics">
                        <div className="metric">
                          <Users size={16} />
                          <span>{campaign.recipients_count} destinataires</span>
                        </div>
                        {campaign.status === "sent" && (
                          <>
                            <div className="metric">
                              <Eye size={16} />
                              <span>{campaign.open_rate}% ouvertures</span>
                            </div>
                            <div className="metric">
                              <TrendingUp size={16} />
                              <span>{campaign.click_rate}% clics</span>
                            </div>
                          </>
                        )}
                        <div className="metric">
                          <Calendar size={16} />
                          <span>
                            {campaign.sent_at
                              ? `Envoyée le ${formatDate(campaign.sent_at)}`
                              : `Créée le ${formatDate(campaign.created_at)}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="campaign-actions">
                      <button
                        className="campaign-action-btn view"
                        title="Voir la campagne"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="campaign-action-btn edit"
                        onClick={() => handleEditCampaign(campaign)}
                        title="Modifier"
                      >
                        <Edit3 size={16} />
                      </button>
                      {campaign.status === "draft" && (
                        <button
                          className="campaign-action-btn send"
                          onClick={() => handleSendCampaign(campaign.id)}
                          title="Envoyer"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        className="campaign-action-btn delete"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

      {/* Modal de création/édition */}
      {showCreateModal && (
        <CampaignModal
          campaign={selectedCampaign}
          onClose={() => setShowCreateModal(false)}
          onSave={(campaignData) => {
            if (selectedCampaign) {
              // Modifier campagne existante
              setCampaigns(campaigns.map(c =>
                c.id === selectedCampaign.id ? { ...c, ...campaignData } : c
              ));
            } else {
              // Créer nouvelle campagne
              const newCampaign = {
                ...campaignData,
                id: Date.now(),
                created_at: new Date().toISOString(),
                status: "draft",
                open_rate: 0,
                click_rate: 0,
                replies: 0
              };
              setCampaigns([...campaigns, newCampaign]);
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </Layout>
  );
};

export default CampaignsNew;