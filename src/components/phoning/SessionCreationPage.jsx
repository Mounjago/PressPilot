import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Target, Calendar, Clock, Plus, X, Search } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/Dashboard.css';

const SessionCreationPage = ({ artist, project, onCreateSession, onBack }) => {
  const [sessionData, setSessionData] = useState({
    sessionName: '',
    description: '',
    targets: {
      totalCalls: 20,
      expectedAnswers: 10,
      targetOutcome: 'coverage'
    }
  });

  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);

  useEffect(() => {
    // Générer un nom de session par défaut
    const defaultName = `Session ${project.name} - ${new Date().toLocaleDateString('fr-FR')}`;
    setSessionData(prev => ({
      ...prev,
      sessionName: defaultName
    }));

    loadContacts();
  }, [project]);

  const loadContacts = async () => {
    try {
      setContactsLoading(true);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des contacts');
      }

      const contacts = await response.json();
      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSessionData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSessionData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addContactToSession = (contact) => {
    if (!selectedContacts.find(c => c._id === contact._id)) {
      setSelectedContacts(prev => [...prev, {
        contactId: contact._id,
        contact: contact,
        priority: 'medium',
        notes: ''
      }]);
    }
  };

  const removeContactFromSession = (contactId) => {
    setSelectedContacts(prev => prev.filter(c => c.contactId !== contactId));
  };

  const updateContactPriority = (contactId, priority) => {
    setSelectedContacts(prev =>
      prev.map(c => c.contactId === contactId ? { ...c, priority } : c)
    );
  };

  const updateContactNotes = (contactId, notes) => {
    setSelectedContacts(prev =>
      prev.map(c => c.contactId === contactId ? { ...c, notes } : c)
    );
  };

  const getFilteredContacts = () => {
    return availableContacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || contact.category === categoryFilter;

      const notSelected = !selectedContacts.find(c => c.contactId === contact._id);

      return matchesSearch && matchesCategory && notSelected;
    });
  };

  const handleCreateSession = async () => {
    if (!sessionData.sessionName.trim()) {
      alert('Le nom de la session est requis');
      return;
    }

    if (selectedContacts.length === 0) {
      const confirm = window.confirm(
        'Aucun contact sélectionné. Voulez-vous créer la session sans contacts pré-sélectionnés ? Vous pourrez en ajouter plus tard.'
      );
      if (!confirm) return;
    }

    setLoading(true);

    try {
      const sessionPayload = {
        projectId: project._id,
        sessionName: sessionData.sessionName,
        description: sessionData.description,
        targets: sessionData.targets,
        targetContacts: selectedContacts.map(({ contactId, priority, notes }) => ({
          contactId,
          priority,
          notes
        }))
      };

      await onCreateSession(sessionPayload);
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      alert('Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = [...new Set(availableContacts.map(c => c.category))].filter(Boolean);

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#EF4444',
      'medium': '#F59E0B',
      'low': '#10B981'
    };
    return colors[priority] || '#6B7280';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'high': 'Haute',
      'medium': 'Moyenne',
      'low': 'Basse'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="phoning-workflow-step">
        <div className="step-header">
          <h2>Création de la session</h2>
        </div>
        <LoadingSpinner />
        <p>Création de la session en cours...</p>
      </div>
    );
  }

  return (
    <div className="phoning-workflow-step">
      <div className="step-header">
        <div>
          <button className="btn-icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="step-title-section">
            <h2>Création de la session d'appels</h2>
            <p className="step-description">
              Configurez votre session d'appels pour <strong>{project.name}</strong> de <strong>{artist.name}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="session-creation-form">
        <div className="form-section">
          <h3>Informations de la session</h3>

          <div className="form-group">
            <label htmlFor="sessionName">Nom de la session *</label>
            <input
              type="text"
              id="sessionName"
              value={sessionData.sessionName}
              onChange={(e) => handleInputChange('sessionName', e.target.value)}
              placeholder="Ex: Session promo single..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={sessionData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Décrivez l'objectif de cette session d'appels..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Objectifs de la session</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalCalls">
                <Target className="label-icon" />
                Nombre d'appels prévus
              </label>
              <input
                type="number"
                id="totalCalls"
                value={sessionData.targets.totalCalls}
                onChange={(e) => handleInputChange('targets.totalCalls', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedAnswers">
                <Users className="label-icon" />
                Réponses attendues
              </label>
              <input
                type="number"
                id="expectedAnswers"
                value={sessionData.targets.expectedAnswers}
                onChange={(e) => handleInputChange('targets.expectedAnswers', parseInt(e.target.value))}
                min="1"
                max={sessionData.targets.totalCalls}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="targetOutcome">Objectif principal</label>
            <select
              id="targetOutcome"
              value={sessionData.targets.targetOutcome}
              onChange={(e) => handleInputChange('targets.targetOutcome', e.target.value)}
            >
              <option value="coverage">Couverture médiatique</option>
              <option value="interviews">Interviews</option>
              <option value="reviews">Reviews/Critiques</option>
              <option value="networking">Networking</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Contacts à appeler</h3>
            <span className="contacts-count">
              {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} sélectionné{selectedContacts.length > 1 ? 's' : ''}
            </span>
          </div>

          {selectedContacts.length > 0 && (
            <div className="selected-contacts">
              <h4>Contacts sélectionnés :</h4>
              <div className="selected-contacts-list">
                {selectedContacts.map((item) => (
                  <div key={item.contactId} className="selected-contact-item">
                    <div className="contact-info">
                      <div className="contact-avatar">
                        {item.contact.name.charAt(0)}
                      </div>
                      <div className="contact-details">
                        <span className="contact-name">{item.contact.name}</span>
                        <span className="contact-company">
                          {item.contact.journalism?.mediaName || item.contact.company}
                        </span>
                      </div>
                    </div>

                    <div className="contact-settings">
                      <select
                        value={item.priority}
                        onChange={(e) => updateContactPriority(item.contactId, e.target.value)}
                        className="priority-select"
                        style={{ borderColor: getPriorityColor(item.priority) }}
                      >
                        <option value="high">Haute priorité</option>
                        <option value="medium">Priorité moyenne</option>
                        <option value="low">Priorité basse</option>
                      </select>

                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateContactNotes(item.contactId, e.target.value)}
                        placeholder="Notes..."
                        className="contact-notes"
                      />

                      <button
                        className="btn-remove"
                        onClick={() => removeContactFromSession(item.contactId)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="contacts-selector">
            <div className="contacts-search">
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher des contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes les catégories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {contactsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="available-contacts-list">
                {getFilteredContacts().map((contact) => (
                  <div key={contact._id} className="available-contact-item">
                    <div className="contact-info">
                      <div className="contact-avatar">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="contact-details">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-company">
                          {contact.journalism?.mediaName || contact.company}
                        </span>
                        <span className="contact-category">{contact.category}</span>
                      </div>
                    </div>

                    <button
                      className="btn-add-contact"
                      onClick={() => addContactToSession(contact)}
                    >
                      <Plus size={16} />
                      Ajouter
                    </button>
                  </div>
                ))}

                {getFilteredContacts().length === 0 && (
                  <div className="no-contacts">
                    <p>Aucun contact disponible avec ces critères</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleCreateSession}
            disabled={loading || !sessionData.sessionName.trim()}
          >
            Créer la session d'appels
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Retour
          </button>
        </div>
      </div>

      <div className="workflow-info">
        <div className="workflow-steps">
          <div className="step completed">1. Artiste: {artist.name}</div>
          <div className="step completed">2. Projet: {project.name}</div>
          <div className="step active">3. Créer la session</div>
          <div className="step">4. Commencer les appels</div>
        </div>
      </div>
    </div>
  );
};

export default SessionCreationPage;