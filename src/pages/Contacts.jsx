import React, { useState, useEffect } from "react";
import { Search, Phone, Filter, Grid, List, Plus, PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { contactsApi } from "../api";
import "../styles/Dashboard.css";
import "../styles/ContactsNew.css";
import logo from "../assets/logo-bandstream.png";

// Composants
import ContactsImporter from "../components/CSVImporter";
import Layout from "../components/Layout";
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
      console.log('🔄 Chargement des contacts...');

      const response = await contactsApi.getAll();
      console.log('📇 Contacts loaded:', response);

      setContacts(response.contacts || []);

    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      setContacts([]);
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

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">CONTACTS</h1>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <Layout title="CONTACTS" subtitle="Gestion de vos contacts presse et médias">
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
            {filteredContacts.length === 0 ? (
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
    </Layout>
  );
};

export default Contacts;