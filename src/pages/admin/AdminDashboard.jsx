/**
 * ADMIN DASHBOARD - Vue d'ensemble cross-workspace
 * Statistiques globales, activite recente, analytics press + rp
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, Building2, Mail, FileText, Calendar,
  FolderOpen, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import Layout from '../../components/Layout';
import adminApi from '../../services/adminApi';

// Configuration des periodes
const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, analyticsRes] = await Promise.all([
        adminApi.getGlobalStats(),
        adminApi.getAnalytics(period)
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Erreur chargement admin dashboard:', err);
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading && !stats) {
    return (
      <Layout title="Administration" subtitle="Tableau de bord global">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (error && !stats) {
    return (
      <Layout title="Administration" subtitle="Tableau de bord global">
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
          padding: '24px', textAlign: 'center', margin: '20px 0'
        }}>
          <AlertCircle size={24} style={{ color: '#dc2626', marginBottom: '8px' }} />
          <p style={{ color: '#dc2626', fontWeight: '500' }}>{error}</p>
          <button onClick={loadData} style={{
            marginTop: '12px', padding: '8px 16px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}>Reessayer</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administration" subtitle="Tableau de bord global">
      {/* Selecteur de periode */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '8px' }}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: period === p.value ? '2px solid #6366f1' : '1px solid #d1d5db',
              background: period === p.value ? '#eef2ff' : 'white',
              color: period === p.value ? '#6366f1' : '#6b7280',
              fontWeight: period === p.value ? '600' : '400',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cartes statistiques principales */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '24px'
      }}>
        <StatCard
          icon={Users} color="#6366f1" label="Utilisateurs"
          value={stats?.users?.active || 0}
          sub={`${stats?.users?.inactive || 0} inactifs`}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          icon={Building2} color="#10b981" label="Organisations"
          value={stats?.organizations || 0}
          onClick={() => navigate('/admin/organizations')}
        />
        <StatCard
          icon={Mail} color="#f59e0b" label="Campagnes (Press)"
          value={stats?.press?.campaigns || 0}
          sub={`${stats?.press?.contacts || 0} contacts`}
        />
        <StatCard
          icon={FileText} color="#8b5cf6" label="Communiques (RP)"
          value={stats?.rp?.pressReleases?.total || 0}
          sub={`${stats?.rp?.pressReleases?.published || 0} publies`}
        />
        <StatCard
          icon={Calendar} color="#ec4899" label="Evenements (RP)"
          value={stats?.rp?.events?.total || 0}
          sub={`${stats?.rp?.events?.upcoming || 0} a venir`}
        />
        <StatCard
          icon={FolderOpen} color="#14b8a6" label="Media Kits (RP)"
          value={stats?.rp?.mediaKits || 0}
        />
      </div>

      {/* Repartition par role */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px', marginBottom: '24px'
      }}>
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Repartition par role
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <RoleBar label="Attaches de presse" count={stats?.users?.byRole?.press_agent || 0} total={stats?.users?.active || 1} color="#3b82f6" />
            <RoleBar label="BandStream RP" count={stats?.users?.byRole?.bandstream_rp || 0} total={stats?.users?.active || 1} color="#10b981" />
            <RoleBar label="Administrateurs" count={stats?.users?.byRole?.admin || 0} total={stats?.users?.active || 1} color="#6366f1" />
          </div>
        </div>

        {/* Analytics periode */}
        {analytics && (
          <div style={{
            background: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              <TrendingUp size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              Activite ({PERIODS.find(p => p.value === period)?.label})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <MiniStat label="Nouveaux users" value={analytics.users?.newUsers || 0} />
              <MiniStat label="Users actifs" value={analytics.users?.activeUsersInPeriod || 0} />
              <MiniStat label="Nouveaux contacts" value={analytics.press?.newContacts || 0} />
              <MiniStat label="Campagnes actives" value={analytics.press?.activeCampaigns || 0} />
              <MiniStat label="Communiques crees" value={analytics.rp?.newPressReleases || 0} />
              <MiniStat label="Communiques publies" value={analytics.rp?.publishedPressReleases || 0} />
              <MiniStat label="Evenements crees" value={analytics.rp?.newEvents || 0} />
              <MiniStat label="Media kits crees" value={analytics.rp?.newMediaKits || 0} />
            </div>
          </div>
        )}
      </div>

      {/* Derniers utilisateurs inscrits */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Derniers inscrits
          </h3>
          {stats?.recentUsers?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentUsers.map(user => (
                <div key={user._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', background: '#f9fafb'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Aucun utilisateur recent</p>
          )}
        </div>

        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Activite recente
          </h3>
          {stats?.recentActivity?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentActivity.map(user => (
                <div key={user._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', background: '#f9fafb'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                    </div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Aucune activite recente</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

const StatCard = ({ icon: Icon, color, label, value, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'white', borderRadius: '12px', padding: '20px',
      border: '1px solid #e5e7eb', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s'
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{label}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
  </div>
);

const RoleBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '3px', transition: 'width 0.3s'
        }} />
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div style={{
    padding: '10px 12px', background: '#f9fafb', borderRadius: '8px'
  }}>
    <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{value}</div>
  </div>
);

const ROLE_CONFIG = {
  press_agent: { label: 'Press', color: '#3b82f6', bg: '#eff6ff' },
  bandstream_rp: { label: 'RP', color: '#10b981', bg: '#ecfdf5' },
  admin: { label: 'Admin', color: '#6366f1', bg: '#eef2ff' },
  super_admin: { label: 'Super', color: '#dc2626', bg: '#fef2f2' },
  user: { label: 'User', color: '#6b7280', bg: '#f9fafb' },
  moderator: { label: 'Mod', color: '#f59e0b', bg: '#fffbeb' }
};

const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span style={{
      fontSize: '11px', fontWeight: '600', padding: '2px 8px',
      borderRadius: '4px', color: config.color, background: config.bg
    }}>
      {config.label}
    </span>
  );
};

export default AdminDashboard;
