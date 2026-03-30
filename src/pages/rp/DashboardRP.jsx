/**
 * PAGE DASHBOARD RP - Vue d'ensemble BandStream RP
 * Statistiques: communiques, evenements, media kits
 */

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, FolderOpen, TrendingUp, Eye, Download } from 'lucide-react';
import pressReleasesApi from '../../services/pressReleasesApi';
import eventsApi from '../../services/eventsApi';
import mediaKitsApi from '../../services/mediaKitsApi';
import Layout from '../../components/Layout';
import '../../styles/Dashboard.css';

const DashboardRP = () => {
  const [stats, setStats] = useState({
    pressReleases: { total: 0, byStatus: {} },
    events: { total: 0, upcoming: 0 },
    mediaKits: { total: 0, aggregated: { totalViews: 0, totalDownloads: 0 } }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [prRes, evRes, mkRes] = await Promise.all([
        pressReleasesApi.getStats().catch(() => ({ data: { total: 0, byStatus: {} } })),
        eventsApi.getStats().catch(() => ({ data: { total: 0, upcoming: 0 } })),
        mediaKitsApi.getStats().catch(() => ({ data: { total: 0, aggregated: { totalViews: 0, totalDownloads: 0 } } }))
      ]);

      setStats({
        pressReleases: prRes.data || { total: 0, byStatus: {} },
        events: evRes.data || { total: 0, upcoming: 0 },
        mediaKits: mkRes.data || { total: 0, aggregated: { totalViews: 0, totalDownloads: 0 } }
      });
    } catch (error) {
      console.error('Erreur chargement stats RP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="BandStream RP" subtitle="Vue d'ensemble des relations publiques">
      {/* Cartes de statistiques */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon blue">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Communiques de presse</p>
              <h3 className="stat-value">{stats.pressReleases.total}</h3>
              <span className="stat-subtitle">
                {stats.pressReleases.byStatus?.published || 0} publies
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon purple">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Evenements</p>
              <h3 className="stat-value">{stats.events.total}</h3>
              <span className="stat-subtitle">
                {stats.events.upcoming || 0} a venir
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon green">
              <FolderOpen size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Dossiers de presse</p>
              <h3 className="stat-value">{stats.mediaKits.total}</h3>
              <span className="stat-subtitle">
                {stats.mediaKits.aggregated?.totalAssets || 0} assets
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon orange">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Performance</p>
              <h3 className="stat-value">
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {stats.mediaKits.aggregated?.totalViews || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={14} /> {stats.mediaKits.aggregated?.totalDownloads || 0}
                  </span>
                </span>
              </h3>
              <span className="stat-subtitle">Vues et telechargements</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sections a venir */}
      <section className="dashboard-section">
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          border: '2px dashed #e5e7eb'
        }}>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>
            Activite recente
          </h3>
          <p style={{ color: '#6b7280' }}>
            Les derniers communiques, evenements et dossiers de presse apparaitront ici.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default DashboardRP;
