import React, { useState, useEffect } from "react";
import { Search, Phone, Filter, Grid, List, Plus, PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import "../styles/Dashboard.css";
import "../styles/Contacts.css";
import logo from "../assets/logo-bandstream.png";

// Composants
import ContactsImporter from "../components/CSVImporter";
import Sidebar from "../components/Sidebar";
import ContactCard from "../components/phone/ContactCard";
import PhoneSystem from "../components/phone/PhoneSystem";
import CallHistory from "../components/phone/CallHistory";
import CallModal from "../components/phone/CallModal";
import JournalistImporter from "../components/JournalistImporter";
import ringoverService from "../services/ringoverService";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [showPhoneSystem, setShowPhoneSystem] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCallModalMinimized, setIsCallModalMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);
  const [showCsvImporter, setShowCsvImporter] = useState(false);

  // Contacts de démonstration (à remplacer par une API)
  const demoContacts = [
    {
      id: 1,
      name: "Marie Dubois",
      title: "Journaliste Musique",
      company: "Le Figaro",
      phone: "+33 1 23 45 67 89",
      email: "marie.dubois@lefigaro.fr",
      location: "Paris, France",
      notes: "Spécialisée dans la musique électronique, très intéressée par les nouveaux talents.",
      tags: ["musique", "électronique", "presse"],
      priority: "high",
      avatar: null
    },
    {
      id: 2,
      name: "Pierre Martin",
      title: "Programmateur",
      company: "Radio Nova",
      phone: "+33 1 98 76 54 32",
      email: "p.martin@radionova.com",
      location: "Paris, France",
      notes: "Cherche des artistes émergents pour les playlists nocturnes.",
      tags: ["radio", "programmation"],
      priority: "medium",
      avatar: null
    },
    {
      id: 3,
      name: "Sophie Leroux",
      title: "Critique Musicale",
      company: "Les Inrockuptibles",
      phone: "+33 6 12 34 56 78",
      email: "sophie.leroux@lesinrocks.com",
      location: "Lyon, France",
      notes: "Couvre principalement le rock indépendant et la scène alternative.",
      tags: ["critique", "rock", "indé"],
      priority: "high",
      avatar: null
    },
    {
      id: 4,
      name: "Thomas Bernard",
      title: "Booker",
      company: "Festivals United",
      phone: "+33 4 56 78 90 12",
      email: "thomas@festivals-united.com",
      location: "Marseille, France",
      notes: "Responsable de la programmation pour plusieurs festivals d'été.",
      tags: ["festivals", "booking"],
      priority: "medium",
      avatar: null
    }
  ];

  // Chargement des contacts
  useEffect(() => {
    loadContacts();
  }, []);

  // Filtrage des contacts
  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, filterStatus]);

  // Listeners pour les événements d'appel
  useEffect(() => {
    const handleCallStarted = (call) => {
      setCurrentCall(call);
      setShowCallModal(true);
      setIsCallModalMinimized(false);
    };

    const handleCallEnded = (call) => {
      setCurrentCall(null);
      setShowCallModal(false);
      setIsCallModalMinimized(false);
    };

    ringoverService.on('callStarted', handleCallStarted);
    ringoverService.on('callEnded', handleCallEnded);

    return () => {
      ringoverService.off('callStarted', handleCallStarted);
      ringoverService.off('callEnded', handleCallEnded);
    };
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // Ici, vous intégreriez l'API réelle
      // const response = await api.get('/contacts');
      // setContacts(response.data);

      // Pour la démo, utilisation des contacts statiques
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation loading
      setContacts(demoContacts);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = [...contacts];

    // Filtrage par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(term) ||
        contact.company?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.phone?.includes(term) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filtrage par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter(contact => {
        switch (filterStatus) {
          case "with-phone":
            return contact.phone;
          case "high-priority":
            return contact.priority === "high";
          case "recent-calls":
            // Ici, vous filtreriez par contacts avec appels récents
            return true; // Placeholder
          default:
            return true;
        }
      });
    }

    setFilteredContacts(filtered);
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setShowPhoneSystem(true);
  };

  const handleCallContact = (contact) => {
    setSelectedContact(contact);
    // L'appel sera initié par le PhoneSystem
  };

  const handleClosePhoneSystem = () => {
    setShowPhoneSystem(false);
    setSelectedContact(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <img src={logo} alt="Logo PressPilot" className="logo" />
          <div className="app-name">PressPilot</div>
        </div>
        <div className="user-menu">
          <div className="avatar">JP</div>
        </div>
      </header>

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <div className="contacts-header">
            <div className="contacts-title-section">
              <h1 className="dashboard-title">Contacts</h1>
              <span className="contacts-count">
                {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="contacts-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowImporter(true)}
                style={{ marginRight: '10px' }}
              >
                📻 Importer journalistes FR
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowCsvImporter(true)}
                style={{ marginRight: '10px' }}
              >
                📁 Importer CSV/Excel
              </button>
              <button className="btn-primary">
                <Plus />
                Nouveau contact
              </button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <section className="contacts-filters">
            <div className="contacts-search">
              <Search />
              <input
                type="text"
                placeholder="Rechercher un contact..."
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
                <option value="all">Tous les contacts</option>
                <option value="with-phone">Avec téléphone</option>
                <option value="high-priority">Priorité élevée</option>
                <option value="recent-calls">Appels récents</option>
              </select>

              <div className="contacts-view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List />
                </button>
              </div>
            </div>
          </section>

          {/* Contenu principal */}
          <div className="contacts-content">
            {/* Liste des contacts */}
            <div className={`contacts-list ${viewMode}`}>
              {loading ? (
                <div className="contacts-loading">
                  <div className="contacts-loading-spinner"></div>
                  <span>Chargement des contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="contacts-empty">
                  <Phone className="contacts-empty-icon" />
                  <h3>Aucun contact trouvé</h3>
                  <p>Aucun contact ne correspond à vos critères de recherche.</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContact?.id === contact.id}
                    onSelect={() => handleContactSelect(contact)}
                    onCall={handleCallContact}
                    showPhoneSystem={selectedContact?.id === contact.id && showPhoneSystem}
                    showCallHistory={selectedContact?.id === contact.id && showPhoneSystem}
                  />
                ))
              )}
            </div>

            {/* Sidebar avec détails du contact sélectionné */}
            {selectedContact && (
              <div className="contacts-sidebar">
                <div className="contacts-sidebar-header">
                  <h3>Détails du contact</h3>
                  <button
                    className="contacts-sidebar-close"
                    onClick={handleClosePhoneSystem}
                  >
                    ×
                  </button>
                </div>

                <div className="contacts-sidebar-content">
                  {showPhoneSystem && (
                    <div className="contacts-phone-section">
                      <PhoneSystem
                        contact={selectedContact}
                        onCallStart={(call) => {
                          setCurrentCall(call);
                          setShowCallModal(true);
                        }}
                        onCallEnd={() => {
                          setCurrentCall(null);
                          setShowCallModal(false);
                        }}
                      />
                    </div>
                  )}

                  <div className="contacts-history-section">
                    <CallHistory
                      contactId={selectedContact.id}
                      onCallInitiated={() => {
                        // Gestion si nécessaire
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Modal d'appel */}
      {showCallModal && currentCall && (
        <CallModal
          isOpen={showCallModal}
          call={currentCall}
          onClose={() => {
            setShowCallModal(false);
            setCurrentCall(null);
          }}
          onMinimize={setIsCallModalMinimized}
          isMinimized={isCallModalMinimized}
        />
      )}

      {/* Modal d'import journalistes */}
      <AnimatePresence>
        {showImporter && (
          <JournalistImporter
            onClose={() => setShowImporter(false)}
            onImportComplete={(importData) => {
              // Recharger les contacts après l'import
              loadContacts();
              setShowImporter(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal d'import CSV/Excel */}
      <AnimatePresence>
        {showCsvImporter && (
          <ContactsImporter
            onClose={() => setShowCsvImporter(false)}
            onImportComplete={(importData) => {
              // Recharger les contacts après l'import
              loadContacts();
              setShowCsvImporter(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contacts;