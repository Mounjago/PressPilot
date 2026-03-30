/**
 * USER MANAGEMENT - Gestion des utilisateurs (admin)
 * CRUD utilisateurs, changement de role, verrouillage
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, Lock, Unlock, Shield,
  AlertCircle, RefreshCw, X, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import Layout from '../../components/Layout';
import adminApi from '../../services/adminApi';

// Roles disponibles
const ROLES = [
  { value: 'press_agent', label: 'Attache de presse', color: '#3b82f6' },
  { value: 'bandstream_rp', label: 'BandStream RP', color: '#10b981' },
  { value: 'admin', label: 'Administrateur', color: '#6366f1' },
  { value: 'super_admin', label: 'Super Admin', color: '#dc2626' }
];

const ROLE_COLORS = {
  press_agent: { label: 'Press', color: '#3b82f6', bg: '#eff6ff' },
  bandstream_rp: { label: 'RP', color: '#10b981', bg: '#ecfdf5' },
  admin: { label: 'Admin', color: '#6366f1', bg: '#eef2ff' },
  super_admin: { label: 'Super', color: '#dc2626', bg: '#fef2f2' },
  user: { label: 'User', color: '#6b7280', bg: '#f9fafb' },
  moderator: { label: 'Mod', color: '#f59e0b', bg: '#fffbeb' }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Formulaire creation
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'press_agent', company: '', organizationId: ''
  });
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Organisations pour le select
  const [organizations, setOrganizations] = useState([]);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter;

      const res = await adminApi.getUsers(params);
      if (res.success) {
        setUsers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter]);

  const loadOrganizations = async () => {
    try {
      const res = await adminApi.getOrganizations({ limit: 100 });
      if (res.success) setOrganizations(res.data);
    } catch (err) {
      console.error('Erreur chargement organisations:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadOrganizations();
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => loadUsers(1), 400);
    return () => clearTimeout(timer);
  }, [search, roleFilter, activeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      const res = await adminApi.createUser(createForm);
      if (res.success) {
        setShowCreate(false);
        setCreateForm({ name: '', email: '', password: '', role: 'press_agent', company: '', organizationId: '' });
        loadUsers(1);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Erreur de creation');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleLock = async (userId, currentlyActive) => {
    if (!window.confirm(currentlyActive ? 'Verrouiller ce compte ?' : 'Deverrouiller ce compte ?')) return;
    try {
      await adminApi.toggleUserLock(userId, currentlyActive); // locked = true si actuellement actif
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminApi.changeUserRole(userId, newRole);
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Supprimer l'utilisateur "${userName}" ? Cette action est irreversible.`)) return;
    try {
      await adminApi.deleteUser(userId);
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <Layout title="Gestion des utilisateurs" subtitle="Administration des comptes">
      {/* Barre d'outils */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', minWidth: '200px', flex: '1', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          {/* Filtre role */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '14px', background: 'white', cursor: 'pointer'
            }}
          >
            <option value="">Tous les roles</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Filtre actif */}
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '14px', background: 'white', cursor: 'pointer'
            }}
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
          }}
        >
          <Plus size={16} /> Creer un utilisateur
        </button>
      </div>

      {/* Formulaire de creation */}
      {showCreate && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          border: '1px solid #e5e7eb', marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Nouvel utilisateur</h3>
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {createError && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="text" placeholder="Nom *" required
              value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email" placeholder="Email *" required
              value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
              style={inputStyle}
            />
            <input
              type="password" placeholder="Mot de passe *" required minLength={12}
              value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
              style={inputStyle}
            />
            <select
              value={createForm.role}
              onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
              style={inputStyle}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <input
              type="text" placeholder="Entreprise"
              value={createForm.company} onChange={e => setCreateForm({ ...createForm, company: e.target.value })}
              style={inputStyle}
            />
            {createForm.role === 'bandstream_rp' && (
              <select
                value={createForm.organizationId}
                onChange={e => setCreateForm({ ...createForm, organizationId: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="">Organisation *</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
            )}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={btnSecondaryStyle}>
                Annuler
              </button>
              <button type="submit" disabled={creating} style={{
                ...btnPrimaryStyle, opacity: creating ? 0.6 : 1
              }}>
                {creating ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
          padding: '16px', textAlign: 'center', marginBottom: '20px'
        }}>
          <AlertCircle size={20} style={{ color: '#dc2626', marginBottom: '4px' }} />
          <p style={{ color: '#dc2626', margin: '4px 0' }}>{error}</p>
          <button onClick={() => loadUsers(1)} style={{ ...btnSecondaryStyle, marginTop: '8px' }}>
            <RefreshCw size={14} /> Reessayer
          </button>
        </div>
      )}

      {/* Table des utilisateurs */}
      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Derniere connexion</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Chargement...
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  Aucun utilisateur trouve
                </td></tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{user.name}</div>
                      {user.company && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{user.company}</div>}
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <select
                        value={user.role}
                        onChange={e => handleChangeRole(user._id, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
                          border: `1px solid ${(ROLE_COLORS[user.role] || ROLE_COLORS.user).color}20`,
                          background: (ROLE_COLORS[user.role] || ROLE_COLORS.user).bg,
                          color: (ROLE_COLORS[user.role] || ROLE_COLORS.user).color,
                          fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '500',
                        background: user.isActive ? '#ecfdf5' : '#fef2f2',
                        color: user.isActive ? '#059669' : '#dc2626'
                      }}>
                        {user.isActive ? <Check size={12} /> : <X size={12} />}
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleLock(user._id, user.isActive)}
                          title={user.isActive ? 'Verrouiller' : 'Deverrouiller'}
                          style={actionBtnStyle}
                        >
                          {user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          title="Supprimer"
                          style={{ ...actionBtnStyle, color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {pagination.total} utilisateur(s) - Page {pagination.page}/{pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
                style={{ ...paginationBtnStyle, opacity: pagination.page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadUsers(pagination.page + 1)}
                style={{ ...paginationBtnStyle, opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Styles inline reutilisables
const inputStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
  fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box'
};

const btnPrimaryStyle = {
  padding: '8px 16px', background: '#6366f1', color: 'white',
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px'
};

const btnSecondaryStyle = {
  padding: '8px 16px', background: 'white', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
  display: 'flex', alignItems: 'center', gap: '4px'
};

const thStyle = {
  textAlign: 'left', padding: '12px 16px', fontSize: '12px',
  fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '12px 16px', verticalAlign: 'middle'
};

const actionBtnStyle = {
  background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
  padding: '6px', cursor: 'pointer', color: '#6b7280', display: 'flex',
  alignItems: 'center'
};

const paginationBtnStyle = {
  background: 'white', border: '1px solid #d1d5db', borderRadius: '6px',
  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
};

export default UserManagement;
