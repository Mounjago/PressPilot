/**
 * PAGE MEDIA KITS / DOSSIERS DE PRESSE - BandStream RP
 * Liste, creation, gestion des assets et acces public
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FolderOpen, Eye, Download, Link, Unlink, Globe } from 'lucide-react';
import mediaKitsApi from '../../services/mediaKitsApi';
import Layout from '../../components/Layout';
import '../../styles/Dashboard.css';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: '#6b7280' },
  active: { label: 'Actif', color: '#10b981' },
  archived: { label: 'Archive', color: '#9ca3af' }
};

const CONTEXT_LABELS = {
  company: 'Entreprise',
  product: 'Produit',
  event: 'Evenement',
  campaign: 'Campagne',
  executive: 'Dirigeant',
  crisis: 'Crise',
  seasonal: 'Saisonnier',
  other: 'Autre'
};

const MediaKits = () => {
  const [mediaKits, setMediaKits] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', context: 'all', search: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKit, setNewKit] = useState({ name: '', context: 'company', language: 'fr', description: '' });
  const [creating, setCreating] = useState(false);

  const loadMediaKits = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.context !== 'all') params.context = filters.context;
      if (filters.search) params.search = filters.search;

      const result = await mediaKitsApi.getAll(params);
      if (result.success) {
        setMediaKits(result.data.mediaKits || []);
        setPagination(result.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      console.error('Erreur chargement media kits:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    loadMediaKits();
  }, [loadMediaKits]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKit.name.trim()) return;

    setCreating(true);
    try {
      const result = await mediaKitsApi.create(newKit);
      if (result.success) {
        setShowCreateForm(false);
        setNewKit({ name: '', context: 'company', language: 'fr', description: '' });
        loadMediaKits();
      }
    } catch (error) {
      console.error('Erreur creation media kit:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublic = async (kit) => {
    try {
      if (kit.publicAccess?.isEnabled) {
        const result = await mediaKitsApi.disablePublicAccess(kit._id);
        if (result?.success) loadMediaKits();
      } else {
        const result = await mediaKitsApi.enablePublicAccess(kit._id);
        if (result?.success) loadMediaKits();
      }
    } catch (error) {
      console.error('Erreur toggle acces public:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await mediaKitsApi.delete(id);
      if (result?.success) loadMediaKits();
    } catch (error) {
      console.error('Erreur archivage:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <Layout title="Dossiers de presse" subtitle="Gestion des media kits BandStream">
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
              style={{ padding: '8px 12px 8px 32px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', width: '200px' }}
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
            value={filters.context}
            onChange={(e) => setFilters(prev => ({ ...prev, context: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="all">Tous les contextes</option>
            {Object.entries(CONTEXT_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', background: '#0ea5e9', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
          }}
        >
          <Plus size={18} /> Nouveau dossier
        </button>
      </div>

      {/* Formulaire de creation */}
      {showCreateForm && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Nouveau dossier de presse</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="text"
                placeholder="Nom du dossier"
                value={newKit.name}
                onChange={(e) => setNewKit(prev => ({ ...prev, name: e.target.value }))}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                required
              />
              <textarea
                placeholder="Description (optionnel)..."
                value={newKit.description}
                onChange={(e) => setNewKit(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={newKit.context}
                  onChange={(e) => setNewKit(prev => ({ ...prev, context: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', flex: 1 }}
                >
                  {Object.entries(CONTEXT_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{val}</option>
                  ))}
                </select>
                <select
                  value={newKit.language}
                  onChange={(e) => setNewKit(prev => ({ ...prev, language: e.target.value }))}
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
                    padding: '10px 20px', background: '#0ea5e9', color: 'white',
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

      {/* Grille des media kits */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '12px' }}>
          Chargement...
        </div>
      ) : mediaKits.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '12px' }}>
          <FolderOpen size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p>Aucun dossier de presse</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {mediaKits.map((kit) => {
            const statusConfig = STATUS_CONFIG[kit.status] || STATUS_CONFIG.draft;
            const assetsCount = kit.assets?.length || 0;

            return (
              <div key={kit._id} style={{
                background: 'white', borderRadius: '12px', padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {kit.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '500',
                        background: `${statusConfig.color}15`, color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                        background: '#f3f4f6', color: '#374151'
                      }}>
                        {CONTEXT_LABELS[kit.context] || kit.context}
                      </span>
                    </div>
                  </div>
                  {kit.publicAccess?.isEnabled && (
                    <Globe size={16} style={{ color: '#10b981', flexShrink: 0 }} title="Acces public actif" />
                  )}
                </div>

                {/* Description */}
                {kit.description && (
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.4' }}>
                    {kit.description.length > 100 ? kit.description.substring(0, 100) + '...' : kit.description}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FolderOpen size={14} /> {assetsCount} assets
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {kit.metrics?.views || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={14} /> {kit.metrics?.totalDownloads || 0}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleTogglePublic(kit)}
                    style={{
                      ...actionBtnStyle,
                      flex: 1,
                      justifyContent: 'center',
                      color: kit.publicAccess?.isEnabled ? '#ef4444' : '#10b981'
                    }}
                    title={kit.publicAccess?.isEnabled ? 'Desactiver acces public' : 'Activer acces public'}
                  >
                    {kit.publicAccess?.isEnabled ? <Unlink size={14} /> : <Link size={14} />}
                    <span style={{ marginLeft: '4px', fontSize: '12px' }}>
                      {kit.publicAccess?.isEnabled ? 'Desactiver' : 'Publier'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(kit._id)}
                    style={{ ...actionBtnStyle, color: '#9ca3af' }}
                    title="Archiver"
                  >
                    Archiver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: pagination.page === i + 1 ? '#0ea5e9' : '#f3f4f6',
                color: pagination.page === i + 1 ? 'white' : '#374151',
                fontSize: '13px'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
};

const actionBtnStyle = {
  padding: '6px 10px', background: 'none', border: '1px solid #e5e7eb',
  borderRadius: '6px', cursor: 'pointer', color: '#374151',
  display: 'flex', alignItems: 'center', fontSize: '13px'
};

export default MediaKits;
