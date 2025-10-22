import React, { useState, useEffect } from 'react';
import '../styles/Phoning.css';
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

      // Charger les contacts (simulation - à remplacer par votre API)
      const mockContacts = [
        {
          id: 1,
          name: 'Marie Dubois',
          email: 'marie.dubois@lemonde.fr',
          phone: '+33123456789',
          company: 'Le Monde',
          position: 'Journaliste Culture',
          lastCall: new Date(Date.now() - 86400000) // Hier
        },
        {
          id: 2,
          name: 'Pierre Martin',
          email: 'p.martin@radiofrance.fr',
          phone: '+33987654321',
          company: 'Radio France',
          position: 'Responsable Musique',
          lastCall: new Date(Date.now() - 259200000) // Il y a 3 jours
        },
        {
          id: 3,
          name: 'Sophie Laurent',
          email: 'sophie@rocknfolk.com',
          phone: '+33555123456',
          company: 'Rock & Folk',
          position: 'Rédactrice en Chef',
          lastCall: null
        }
      ];
      setContacts(mockContacts);

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
      <div className="phoning-page">
        <div className="phoning-loading">
          <div className="phoning-loading-spinner"></div>
          <p>Chargement du système de phoning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phoning-page">
      <div className="phoning-header">
        <div className="phoning-title-section">
          <h1 className="phoning-title">📞 Centre d'appels</h1>
          <div className="phoning-status online">
            <span className="status-indicator"></span>
            En ligne
          </div>
        </div>

        <div className="phoning-actions">
          <button className="btn btn-secondary">
            <span>📊</span>
            Rapports
          </button>
          <button className="btn btn-primary">
            <span>⚙️</span>
            Configuration
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="phoning-stats">
        <div className="stat-card">
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <div className="stat-value">{callStats.totalCalls}</div>
            <div className="stat-label">Appels totaux</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{callStats.answeredCalls}</div>
            <div className="stat-label">Décrochés</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatDuration(callStats.totalDuration)}</div>
            <div className="stat-label">Durée totale</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{callStats.todayCalls}</div>
            <div className="stat-label">Aujourd'hui</div>
          </div>
        </div>
      </div>

      <div className="phoning-content">
        {/* Section contacts à appeler */}
        <div className="phoning-contacts">
          <div className="section-header">
            <h2>Contacts à appeler</h2>
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
        <h2>Appels récents</h2>
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
    </div>
  );
};

export default Phoning;