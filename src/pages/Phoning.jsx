import React, { useState, useEffect } from 'react';
import { Phone, Clock, Users, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import PhoneSystem from '../components/phone/PhoneSystem';
import CallHistory from '../components/phone/CallHistory';
import callsApi from '../services/callsApi';

const Phoning = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    totalDuration: 0,
    todayCalls: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les appels récents
      const callsResponse = await callsApi.getRecentCalls(20);
      setRecentCalls(callsResponse.data || []);

      // Charger les statistiques
      const statsResponse = await callsApi.getCallStats();
      setCallStats(statsResponse.data || callStats);

      // Les contacts seront chargés depuis l'API des contacts
      setContacts([]);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallEnd = async (callData) => {
    // Recharger les données après un appel
    await loadData();
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCallTime = (date) => {
    return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
      Math.round((date - new Date()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">PHONING</h1>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">PHONING</h1>
          <p className="dashboard-subtitle">Centre d'appels et gestion des contacts</p>

          <div className="phoning-status online">
            <span className="status-indicator"></span>
            En ligne
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Phone className="metric-icon" />
              <span className="metric-label">Appels totaux</span>
            </div>
            <div className="metric-value">{callStats.totalCalls}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <TrendingUp className="metric-icon" />
              <span className="metric-label">Décrochés</span>
            </div>
            <div className="metric-value">{callStats.answeredCalls}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Clock className="metric-icon" />
              <span className="metric-label">Durée totale</span>
            </div>
            <div className="metric-value">{formatDuration(callStats.totalDuration)}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Users className="metric-icon" />
              <span className="metric-label">Aujourd'hui</span>
            </div>
            <div className="metric-value">{callStats.todayCalls}</div>
          </div>
        </div>

      <div className="phoning-content">
        {/* Section contacts à appeler */}
        <div className="phoning-contacts">
          <div className="section-header">
            <h2>Contacts a appeler</h2>
            <div className="contacts-search">
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="contacts-to-call">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`contact-call-card ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="contact-info">
                  <div className="contact-avatar">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="contact-details">
                    <h3>{contact.name}</h3>
                    <p>{contact.position} - {contact.company}</p>
                    <p className="contact-phone">{contact.phone}</p>
                    {contact.lastCall && (
                      <p className="contact-last-call">
                        Dernier appel: {formatCallTime(contact.lastCall)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="contact-actions">
                  <button
                    className="btn-call"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(contact);
                    }}
                  >
                    📞
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section système d'appel et historique */}
        <div className="phoning-sidebar">
          {selectedContact ? (
            <div className="phoning-active">
              <div className="selected-contact-header">
                <h3>Contact sélectionné</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedContact(null)}
                >
                  ✕
                </button>
              </div>

              <div className="selected-contact-info">
                <div className="contact-avatar large">
                  {selectedContact.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4>{selectedContact.name}</h4>
                <p>{selectedContact.position}</p>
                <p>{selectedContact.company}</p>
                <p className="phone-number">{selectedContact.phone}</p>
              </div>

              <PhoneSystem
                contact={selectedContact}
                onCallEnd={handleCallEnd}
              />

              <div className="contact-call-history">
                <h4>Historique des appels</h4>
                <CallHistory
                  contactId={selectedContact.id}
                  onCallAgain={() => {}}
                />
              </div>
            </div>
          ) : (
            <div className="phoning-placeholder">
              <div className="placeholder-icon">📞</div>
              <h3>Sélectionnez un contact</h3>
              <p>Choisissez un contact dans la liste pour commencer un appel</p>
            </div>
          )}
        </div>
      </div>

        {/* Historique récent en bas */}
        <div className="phoning-recent-history">
          <h2>Appels recents</h2>
          <div className="recent-calls-list">
            {recentCalls.slice(0, 5).map(call => (
              <div key={call.id} className="recent-call-item">
                <div className="call-status">
                  {call.status === 'answered' ? '✅' :
                   call.status === 'no-answer' ? '❌' :
                   call.status === 'busy' ? '🔴' : '⏸️'}
                </div>
                <div className="call-details">
                  <div className="call-contact">{call.contactName || call.phoneNumber}</div>
                  <div className="call-time">{new Date(call.createdAt).toLocaleString('fr-FR')}</div>
                </div>
                <div className="call-duration">
                  {call.duration ? formatDuration(call.duration) : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Phoning;