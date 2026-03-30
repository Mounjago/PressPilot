/**
 * PAGE COMMUNIQUES DE PRESSE - BandStream RP
 * Liste, creation, workflow (draft > review > approved > published)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Send, CheckCircle, Clock, Archive, Copy, Filter } from 'lucide-react';
import pressReleasesApi from '../../services/pressReleasesApi';
import Layout from '../../components/Layout';
import '../../styles/Dashboard.css';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: '#6b7280', icon: FileText },
  review: { label: 'En relecture', color: '#f59e0b', icon: Clock },
  approved: { label: 'Approuve', color: '#10b981', icon: CheckCircle },
  published: { label: 'Publie', color: '#6366f1', icon: Send },
  archived: { label: 'Archive', color: '#9ca3af', icon: Archive }
};

const CATEGORY_LABELS = {
  corporate: 'Corporate',
  product: 'Produit',
  partnership: 'Partenariat',
  event: 'Evenement',
  financial: 'Financier',
  talent: 'Talent',
  crisis: 'Crise',
  industry: 'Industrie',
  other: 'Autre'
};

const PressReleases = () => {
  const [pressReleases, setPressReleases] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', category: 'all', search: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPR, setNewPR] = useState({ title: '', content: '', category: 'corporate', language: 'fr' });
  const [creating, setCreating] = useState(false);

  const loadPressReleases = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const result = await pressReleasesApi.getAll(params);
      if (result.success) {
        setPressReleases(result.data.pressReleases || []);
        setPagination(result.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      console.error('Erreur chargement communiques:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    loadPressReleases();
  }, [loadPressReleases]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPR.title.trim() || !newPR.content.trim()) return;

    setCreating(true);
    try {
      const result = await pressReleasesApi.create(newPR);
      if (result.success) {
        setShowCreateForm(false);
        setNewPR({ title: '', content: '', category: 'corporate', language: 'fr' });
        loadPressReleases();
      }
    } catch (error) {
      console.error('Erreur creation communique:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      let result;
      switch (action) {
        case 'submit': result = await pressReleasesApi.submitForReview(id); break;
        case 'approve': result = await pressReleasesApi.approve(id); break;
        case 'publish': result = await pressReleasesApi.publish(id); break;
        case 'duplicate': result = await pressReleasesApi.duplicate(id); break;
        case 'delete': result = await pressReleasesApi.delete(id); break;
        default: return;
      }
      if (result?.success) loadPressReleases();
    } catch (error) {
      console.error(`Erreur action ${action}:`, error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <Layout title="Communiques de presse" subtitle="Gestion des communiques BandStream">
      {/* Barre d'outils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{
                padding: '8px 12px 8px 32px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                width: '220px'
              }}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="all">Toutes les categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
          }}
        >
          <Plus size={18} /> Nouveau communique
        </button>
      </div>

      {/* Formulaire de creation */}
      {showCreateForm && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Nouveau communique de presse</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="text"
                placeholder="Titre du communique"
                value={newPR.title}
                onChange={(e) => setNewPR(prev => ({ ...prev, title: e.target.value }))}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                required
              />
              <textarea
                placeholder="Contenu du communique..."
                value={newPR.content}
                onChange={(e) => setNewPR(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={newPR.category}
                  onChange={(e) => setNewPR(prev => ({ ...prev, category: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', flex: 1 }}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{val}</option>
                  ))}
                </select>
                <select
                  value={newPR.language}
                  onChange={(e) => setNewPR(prev => ({ ...prev, language: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="fr">Francais</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                  <option value="de">Allemand</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px', background: '#6366f1', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  {creating ? 'Creation...' : 'Creer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Liste des communiques */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
        ) : pressReleases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Aucun communique de presse</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Titre</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Categorie</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pressReleases.map((pr) => {
                const statusConfig = STATUS_CONFIG[pr.status] || STATUS_CONFIG.draft;
                return (
                  <tr key={pr._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{pr.title}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>
                      {CATEGORY_LABELS[pr.category] || pr.category}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        background: `${statusConfig.color}15`, color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>
                      {formatDate(pr.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {pr.status === 'draft' && (
                          <button onClick={() => handleAction(pr._id, 'submit')} title="Soumettre" style={actionBtnStyle}>
                            <Send size={14} />
                          </button>
                        )}
                        {pr.status === 'review' && (
                          <button onClick={() => handleAction(pr._id, 'approve')} title="Approuver" style={actionBtnStyle}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {pr.status === 'approved' && (
                          <button onClick={() => handleAction(pr._id, 'publish')} title="Publier" style={actionBtnStyle}>
                            <Send size={14} />
                          </button>
                        )}
                        <button onClick={() => handleAction(pr._id, 'duplicate')} title="Dupliquer" style={actionBtnStyle}>
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleAction(pr._id, 'delete')} title="Archiver" style={{ ...actionBtnStyle, color: '#ef4444' }}>
                          <Archive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: pagination.page === i + 1 ? '#6366f1' : '#f3f4f6',
                  color: pagination.page === i + 1 ? 'white' : '#374151',
                  fontSize: '13px'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const actionBtnStyle = {
  padding: '6px', background: 'none', border: '1px solid #e5e7eb',
  borderRadius: '6px', cursor: 'pointer', color: '#374151',
  display: 'flex', alignItems: 'center'
};

export default PressReleases;
