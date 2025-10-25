import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { contactsApi } from "../api";
import "../styles/Dashboard.css";
import "../styles/ContactsNew.css";
import "../components/contacts/ContactsLayout.css";

// Composants
import ContactsImporter from "../components/CSVImporter";
import Layout from "../components/Layout";
import CallModal from "../components/phone/CallModal";
import ringoverService from "../services/ringoverService";

// New modular contact components
import {
  ContactFilters,
  ContactList,
  ContactModal,
  ContactDetails
} from "../components/contacts";

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
  const [editingContact, setEditingContact] = useState(null);


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
        contact.firstName?.toLowerCase().includes(term) ||
        contact.lastName?.toLowerCase().includes(term) ||
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  const handleContactSave = async (contactData) => {
    try {
      if (contactData.id) {
        // Edit existing contact
        await contactsApi.update(contactData.id, contactData);
      } else {
        // Create new contact
        await contactsApi.create(contactData);
      }
      await loadContacts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact:', error);
      throw error;
    }
  };

  const handleContactDelete = async (contact) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${contact.firstName || contact.name} ${contact.lastName || ''}?`)) {
      try {
        await contactsApi.delete(contact.id);
        await loadContacts();
        if (selectedContact?.id === contact.id) {
          setSelectedContact(null);
          setShowPhoneSystem(false);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du contact:', error);
        alert('Erreur lors de la suppression du contact.');
      }
    }
  };

  const handleContactEdit = (contact) => {
    setEditingContact(contact);
    setShowContactModal(true);
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

      {/* Filters */}
      <ContactFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalContacts={contacts.length}
        filteredCount={filteredContacts.length}
        onClearFilters={handleClearFilters}
      />

      {/* Main content */}
      <div className="contacts-content">
        {/* Contact list */}
        <div className="contacts-list-container">
          <ContactList
            contacts={filteredContacts}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
            onContactCall={handleCallContact}
            onContactEdit={handleContactEdit}
            onContactDelete={handleContactDelete}
            viewMode={viewMode}
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            onCreateContact={() => setShowContactModal(true)}
            onImportContacts={() => setShowCsvImporter(true)}
            onClearFilters={handleClearFilters}
            loading={loading}
          />
        </div>

        {/* Contact details sidebar */}
        {selectedContact && (
          <ContactDetails
            contact={selectedContact}
            onClose={handleClosePhoneSystem}
            showPhoneSystem={showPhoneSystem}
            onCallStart={(call) => {
              setCurrentCall(call);
              setShowCallModal(true);
            }}
            onCallEnd={() => {
              setCurrentCall(null);
              setShowCallModal(false);
            }}
          />
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

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        contact={editingContact}
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        onSave={handleContactSave}
        loading={loading}
      />
    </Layout>
  );
};

export default Contacts;