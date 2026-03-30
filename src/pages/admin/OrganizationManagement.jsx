/**
 * ORGANIZATION MANAGEMENT - Gestion des organisations (admin)
 * CRUD organisations, gestion des membres, parametres
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, Users, Settings,
  AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import Layout from '../../components/Layout';
import adminApi from '../../services/adminApi';

const ORG_TYPES = [
  { value: 'label', label: 'Label' },
  { value: 'agency', label: 'Agence' },
  { value: 'corporate', label: 'Entreprise' },
  { value: 'independent', label: 'Independant' }
];

const SUB_STATUSES = {
  active: { label: 'Actif', color: '#059669', bg: '#ecfdf5' },
  trial: { label: 'Essai', color: '#f59e0b', bg: '#fffbeb' },
  suspended: { label: 'Suspendu', color: '#dc2626', bg: '#fef2f2' },
  cancelled: { label: 'Annule', color: '#6b7280', bg: '#f9fafb' }
};

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Formulaire creation
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', type: 'corporate', description: '', contactEmail: '', website: ''
  });
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Detail organisation
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetail, setOrgDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadOrganizations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;

      const res = await adminApi.getOrganizations(params);
      if (res.success) {
        setOrganizations(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadOrganizations(1), 400);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const loadOrgDetail = async (orgId) => {
    try {
      setLoadingDetail(true);
      setSelectedOrg(orgId);
      const res = await adminApi.getOrganizationById(orgId);
      if (res.success) setOrgDetail(res.data);
    } catch (err) {
      console.error('Erreur chargement detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      const res = await adminApi.createOrganization(createForm);
      if (res.success) {
        setShowCreate(false);
        setCreateForm({ name: '', type: 'corporate', description: '', contactEmail: '', website: '' });
        loadOrganizations(1);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Erreur de creation');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (orgId, orgName) => {
    if (!window.confirm(`Desactiver l'organisation "${orgName}" ?`)) return;
    try {
      await adminApi.deleteOrganization(orgId);
      loadOrganizations(pagination.page);
      if (selectedOrg === orgId) {
        setSelectedOrg(null);
        setOrgDetail(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <Layout title="Gestion des organisations" subtitle="Administration des organisations">
      {/* Barre d'outils */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1' }}>
          <div style={{ position: 'relative', minWidth: '200px', flex: '1', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <select
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', background: 'white', cursor: 'pointer' }}
          >
            <option value="">Tous les types</option>
            {ORG_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: '#10b981', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
        }}>
          <Plus size={16} /> Nouvelle organisation
        </button>
      </div>

      {/* Formulaire de creation */}
      {showCreate && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Nouvelle organisation</h3>
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
            <input type="text" placeholder="Nom de l'organisation *" required
              value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              style={inputStyle} />
            <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
              style={inputStyle}>
              {ORG_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input type="email" placeholder="Email de contact"
              value={createForm.contactEmail} onChange={e => setCreateForm({ ...createForm, contactEmail: e.target.value })}
              style={inputStyle} />
            <input type="url" placeholder="Site web"
              value={createForm.website} onChange={e => setCreateForm({ ...createForm, website: e.target.value })}
              style={inputStyle} />
            <textarea placeholder="Description" rows={2}
              value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={btnSecondaryStyle}>Annuler</button>
              <button type="submit" disabled={creating} style={{ ...btnPrimaryStyle, opacity: creating ? 0.6 : 1 }}>
                {creating ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <p style={{ color: '#dc2626', margin: '4px 0' }}>{error}</p>
        </div>
      )}

      {/* Layout 2 colonnes: liste + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOrg ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Liste des organisations */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Chargement...
            </div>
          ) : organizations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Aucune organisation trouvee
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {organizations.map(org => {
                const subStatus = SUB_STATUSES[org.subscription?.status] || SUB_STATUSES.active;
                return (
                  <div
                    key={org._id}
                    onClick={() => loadOrgDetail(org._id)}
                    style={{
                      padding: '16px', borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: selectedOrg === org._id ? '#eef2ff' : 'white'
                    }}
                    onMouseEnter={e => { if (selectedOrg !== org._id) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (selectedOrg !== org._id) e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Building2 size={16} style={{ color: '#10b981' }} />
                          <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{org.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {ORG_TYPES.find(t => t.value === org.type)?.label || org.type}
                          </span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>-</span>
                          <span style={{
                            fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                            color: subStatus.color, background: subStatus.bg, fontWeight: '500'
                          }}>
                            {subStatus.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={12} /> {org.memberCount || 0}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(org._id, org.name); }}
                          style={{ ...actionBtnStyle, color: '#dc2626' }}
                          title="Desactiver"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb'
            }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {pagination.total} organisation(s)
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button disabled={pagination.page <= 1} onClick={() => loadOrganizations(pagination.page - 1)}
                  style={{ ...paginationBtnStyle, opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={16} />
                </button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadOrganizations(pagination.page + 1)}
                  style={{ ...paginationBtnStyle, opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail de l'organisation selectionnee */}
        {selectedOrg && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : orgDetail ? (
              <div>
                {/* Header detail */}
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
                        {orgDetail.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                        {orgDetail.slug} - {ORG_TYPES.find(t => t.value === orgDetail.type)?.label}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedOrg(null); setOrgDetail(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {orgDetail.description && (
                    <p style={{ fontSize: '13px', color: '#374151', marginTop: '8px' }}>{orgDetail.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px' }}>
                    {orgDetail.contactEmail && (
                      <span style={{ color: '#6b7280' }}>{orgDetail.contactEmail}</span>
                    )}
                    {orgDetail.website && (
                      <a href={orgDetail.website} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Site web
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Membres</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                        {orgDetail.stats?.totalMembers || 0}
                        <span style={{ fontSize: '12px', fontWeight: '400', color: '#9ca3af' }}>/{orgDetail.settings?.maxUsers || 50}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Contacts</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{orgDetail.stats?.totalContacts || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Campagnes</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{orgDetail.stats?.totalCampaigns || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Fonctionnalites */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    <Settings size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Fonctionnalites
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(orgDetail.settings?.features || {}).map(([key, enabled]) => (
                      <span key={key} style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                        background: enabled ? '#ecfdf5' : '#f3f4f6',
                        color: enabled ? '#059669' : '#9ca3af',
                        fontWeight: '500'
                      }}>
                        {key}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Membres */}
                <div style={{ padding: '16px 20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    <Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Membres ({orgDetail.members?.length || 0})
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {(orgDetail.members || []).map(member => (
                      <div key={member._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{member.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{member.email}</div>
                        </div>
                        <span style={{
                          fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                          background: member.isActive ? '#ecfdf5' : '#fef2f2',
                          color: member.isActive ? '#059669' : '#dc2626',
                          fontWeight: '500'
                        }}>
                          {member.isActive ? member.role : 'Inactif'}
                        </span>
                      </div>
                    ))}
                    {(!orgDetail.members || orgDetail.members.length === 0) && (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>Aucun membre</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Styles
const inputStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
  fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box'
};
const btnPrimaryStyle = {
  padding: '8px 16px', background: '#10b981', color: 'white',
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px'
};
const btnSecondaryStyle = {
  padding: '8px 16px', background: 'white', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
};
const actionBtnStyle = {
  background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
  padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'
};
const paginationBtnStyle = {
  background: 'white', border: '1px solid #d1d5db', borderRadius: '6px',
  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
};

export default OrganizationManagement;
