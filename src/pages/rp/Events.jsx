/**
 * PAGE EVENEMENTS - BandStream RP
 * Liste, creation, gestion des invites et RSVP
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import eventsApi from '../../services/eventsApi';
import Layout from '../../components/Layout';
import '../../styles/Dashboard.css';

const STATUS_CONFIG = {
  planning: { label: 'Planification', color: '#6b7280' },
  confirmed: { label: 'Confirme', color: '#3b82f6' },
  invitations_sent: { label: 'Invitations envoyees', color: '#8b5cf6' },
  ongoing: { label: 'En cours', color: '#10b981' },
  completed: { label: 'Termine', color: '#6366f1' },
  cancelled: { label: 'Annule', color: '#ef4444' },
  postponed: { label: 'Reporte', color: '#f59e0b' }
};

const TYPE_LABELS = {
  press_conference: 'Conference de presse',
  product_launch: 'Lancement produit',
  networking: 'Networking',
  workshop: 'Workshop',
  webinar: 'Webinaire',
  interview_session: 'Session interviews',
  exhibition: 'Exposition',
  gala: 'Gala',
  other: 'Autre'
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', type: 'all', upcoming: 'false', search: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', startDate: '', type: 'press_conference', location: {} });
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.upcoming === 'true') params.upcoming = 'true';
      if (filters.search) params.search = filters.search;

      const result = await eventsApi.getAll(params);
      if (result.success) {
        setEvents(result.data.events || []);
        setPagination(result.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      console.error('Erreur chargement evenements:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEvent.name.trim() || !newEvent.startDate) return;

    setCreating(true);
    try {
      const result = await eventsApi.create(newEvent);
      if (result.success) {
        setShowCreateForm(false);
        setNewEvent({ name: '', startDate: '', type: 'press_conference', location: {} });
        loadEvents();
      }
    } catch (error) {
      console.error('Erreur creation evenement:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const result = await eventsApi.updateStatus(eventId, newStatus);
      if (result?.success) loadEvents();
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getInviteeStats = (invitees = []) => {
    const total = invitees.length;
    const accepted = invitees.filter(i => i.rsvpStatus === 'accepted').length;
    const declined = invitees.filter(i => i.rsvpStatus === 'declined').length;
    const pending = invitees.filter(i => i.rsvpStatus === 'pending' || i.rsvpStatus === 'no_response').length;
    return { total, accepted, declined, pending };
  };

  return (
    <Layout title="Evenements" subtitle="Gestion des evenements BandStream">
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
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="all">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#374151' }}>
            <input
              type="checkbox"
              checked={filters.upcoming === 'true'}
              onChange={(e) => setFilters(prev => ({ ...prev, upcoming: e.target.checked ? 'true' : 'false' }))}
            />
            A venir uniquement
          </label>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', background: '#0ea5e9', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
          }}
        >
          <Plus size={18} /> Nouvel evenement
        </button>
      </div>

      {/* Formulaire de creation */}
      {showCreateForm && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Nouvel evenement</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="text"
                placeholder="Nom de l'evenement"
                value={newEvent.name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', flex: 1 }}
                  required
                />
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', flex: 1 }}
                >
                  {Object.entries(TYPE_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{val}</option>
                  ))}
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

      {/* Liste des evenements */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '12px' }}>
            Chargement...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '12px' }}>
            <Calendar size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Aucun evenement</p>
          </div>
        ) : events.map((event) => {
          const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.planning;
          const invStats = getInviteeStats(event.invitees);

          return (
            <div key={event._id} style={{
              background: 'white', borderRadius: '12px', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${statusConfig.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                    {event.name}
                  </h3>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                    fontSize: '11px', fontWeight: '500',
                    background: `${statusConfig.color}15`, color: statusConfig.color
                  }}>
                    {statusConfig.label}
                  </span>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                    fontSize: '11px', background: '#f3f4f6', color: '#374151', marginLeft: '6px'
                  }}>
                    {TYPE_LABELS[event.type] || event.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {event.status === 'planning' && (
                    <button onClick={() => handleStatusChange(event._id, 'confirmed')} style={actionBtnStyle} title="Confirmer">
                      <CheckCircle size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#6b7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {formatDate(event.startDate)}
                </span>
                {event.location?.name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {event.location.name}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} /> {invStats.total} invites
                  {invStats.accepted > 0 && <span style={{ color: '#10b981' }}>({invStats.accepted} OK)</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
  padding: '6px', background: 'none', border: '1px solid #e5e7eb',
  borderRadius: '6px', cursor: 'pointer', color: '#374151',
  display: 'flex', alignItems: 'center'
};

export default Events;
