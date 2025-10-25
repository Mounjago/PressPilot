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
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);


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
      <Layout title="CONTACTS" subtitle="Chargement des contacts...">
        <div className="loading-spinner"></div>
      </Layout>
    );
  }

  return (
    <Layout title="CONTACTS" subtitle="Gestion de vos contacts presse et médias">
      <div className="contacts-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowCsvImporter(true)}
              style={{ marginRight: '10px' }}
            >
              📁 Importer
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowContactModal(true)}
            >
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

        {/* Modal de création de contact */}
        <AnimatePresence>
          {showContactModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowContactModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px', width: '90%' }}
              >
                <div className="modal-header">
                  <h2>Nouveau contact</h2>
                  <button
                    className="modal-close"
                    onClick={() => setShowContactModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);

                      // Séparer le nom complet en prénom et nom
                      const fullName = formData.get('name').trim();
                      const nameParts = fullName.split(' ');
                      const firstName = nameParts[0] || '';
                      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

                      const contactData = {
                        firstName: firstName,
                        lastName: lastName,
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        jobTitle: formData.get('jobTitle'),
                        media: {
                          name: formData.get('company'),
                          type: formData.get('mediaType') || 'web'
                        },
                        notes: formData.get('notes')
                      };

                      try {
                        await contactsApi.create(contactData);
                        await loadContacts();
                        setShowContactModal(false);
                        e.target.reset();
                      } catch (error) {
                        console.error('Erreur création contact:', error);
                        alert('Erreur lors de la création du contact. Vérifiez que tous les champs requis sont remplis.');
                      }
                    }}
                  >
                    <div className="form-group">
                      <label>Nom complet *</label>
                      <input type="text" name="name" placeholder="Prénom Nom" required />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" name="email" placeholder="email@exemple.com" required />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input type="tel" name="phone" placeholder="+33 6 12 34 56 78" />
                    </div>
                    <div className="form-group">
                      <label>Média / Entreprise</label>
                      <input type="text" name="company" placeholder="Le Monde, Radio France..." />
                    </div>
                    <div className="form-group">
                      <label>Type de média</label>
                      <select name="mediaType">
                        <option value="web">Web</option>
                        <option value="journal">Journal</option>
                        <option value="magazine">Magazine</option>
                        <option value="radio">Radio</option>
                        <option value="tv">TV</option>
                        <option value="blog">Blog</option>
                        <option value="podcast">Podcast</option>
                        <option value="influencer">Influenceur</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fonction</label>
                      <input type="text" name="jobTitle" placeholder="Journaliste, Rédacteur en chef..." />
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea name="notes" rows="3" placeholder="Informations complémentaires..."></textarea>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowContactModal(false)}>
                        Annuler
                      </button>
                      <button type="submit" className="btn-primary">
                        Créer le contact
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </Layout>
  );
};

export default Contacts;