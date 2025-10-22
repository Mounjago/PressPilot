import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

const VariableManager = ({ onVariablesChange, initialVariables = {}, campaignType = 'communique' }) => {
  const [variables, setVariables] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [newVariable, setNewVariable] = useState({ key: '', value: '', label: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Variables prédéfinies par type de campagne
  const predefinedVariables = {
    common: {
      artistName: { label: 'Nom de l\'artiste', type: 'text', required: true },
      projectName: { label: 'Titre du projet', type: 'text', required: true },
      projectType: { label: 'Type de projet', type: 'select', options: ['Album', 'EP', 'Single', 'Mixtape'], required: true },
      releaseDate: { label: 'Date de sortie', type: 'date', required: true },
      label: { label: 'Label', type: 'text', required: false },
      genre: { label: 'Genre musical', type: 'text', required: true },
      description: { label: 'Description', type: 'textarea', required: true },
      contactName: { label: 'Nom du contact', type: 'text', required: true },
      contactEmail: { label: 'Email de contact', type: 'email', required: true },
      contactPhone: { label: 'Téléphone', type: 'tel', required: false },
      epkLink: { label: 'Lien EPK', type: 'url', required: false },
      websiteUrl: { label: 'Site web artiste', type: 'url', required: false },
      spotifyUrl: { label: 'Lien Spotify', type: 'url', required: false },
      youtubeUrl: { label: 'Lien YouTube', type: 'url', required: false },
      instagramUrl: { label: 'Instagram', type: 'url', required: false }
    },
    specific: {
      premiere: {
        exclusivityPeriod: { label: 'Durée d\'exclusivité', type: 'text', required: true },
        deadline: { label: 'Deadline publication', type: 'date', required: true }
      },
      live: {
        venue: { label: 'Nom de la salle', type: 'text', required: true },
        venueAddress: { label: 'Adresse de la salle', type: 'text', required: true },
        eventDate: { label: 'Date de l\'événement', type: 'date', required: true },
        eventTime: { label: 'Heure de l\'événement', type: 'time', required: true }
      },
      playlist: {
        bpm: { label: 'BPM', type: 'number', required: false },
        mood: { label: 'Mood', type: 'text', required: false },
        playlistName: { label: 'Nom de la playlist cible', type: 'text', required: false }
      },
      interview: {
        interviewDuration: { label: 'Durée d\'interview suggérée', type: 'text', required: false }
      },
      'follow-up': {
        lastContactDate: { label: 'Date du dernier contact', type: 'date', required: false }
      }
    }
  };

  // Initialiser les variables avec les valeurs par défaut
  useEffect(() => {
    const combinedVariables = {
      ...predefinedVariables.common,
      ...(predefinedVariables.specific[campaignType] || {})
    };

    const initializedVariables = {};
    Object.keys(combinedVariables).forEach(key => {
      initializedVariables[key] = initialVariables[key] || getDefaultValue(combinedVariables[key]);
    });

    setVariables(initializedVariables);
  }, [campaignType, initialVariables]);

  // Notifier les changements de variables
  useEffect(() => {
    if (onVariablesChange) {
      onVariablesChange(variables);
    }
  }, [variables, onVariablesChange]);

  const getDefaultValue = (variableConfig) => {
    switch (variableConfig.type) {
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return '20:00';
      case 'number':
        return '120';
      case 'select':
        return variableConfig.options?.[0] || '';
      default:
        return '';
    }
  };

  const handleVariableChange = (key, value) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getCurrentVariables = () => {
    const commonVars = predefinedVariables.common;
    const specificVars = predefinedVariables.specific[campaignType] || {};
    return { ...commonVars, ...specificVars };
  };

  const handleAddVariable = () => {
    if (newVariable.key && newVariable.value && newVariable.label) {
      setVariables(prev => ({
        ...prev,
        [newVariable.key]: newVariable.value
      }));
      setNewVariable({ key: '', value: '', label: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteVariable = (key) => {
    setVariables(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const renderVariableInput = (key, config) => {
    const value = variables[key] || '';

    const inputStyle = {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#ffffff'
    };

    switch (config.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleVariableChange(key, e.target.value)}
            style={{
              ...inputStyle,
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder={`Saisir ${config.label.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleVariableChange(key, e.target.value)}
            style={inputStyle}
          >
            {config.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={config.type || 'text'}
            value={value}
            onChange={(e) => handleVariableChange(key, e.target.value)}
            style={inputStyle}
            placeholder={`Saisir ${config.label.toLowerCase()}`}
          />
        );
    }
  };

  const currentVariables = getCurrentVariables();

  return (
    <div className="chart-card">
      {/* En-tête */}
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Variables du template</h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginTop: '4px'
          }}>
            Remplissez les informations qui seront intégrées dans votre email
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Ajouter
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "btn-primary" : "btn-secondary"}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isEditing ? <Save style={{ width: '16px', height: '16px' }} /> : <Edit3 style={{ width: '16px', height: '16px' }} />}
            {isEditing ? 'Terminer' : 'Modifier'}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout de variable */}
      {showAddForm && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e2e8f0',
          margin: '0 -30px 20px -30px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <input
              type="text"
              placeholder="Clé (ex: artistName)"
              value={newVariable.key}
              onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Label (ex: Nom de l'artiste)"
              value={newVariable.label}
              onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Valeur"
              value={newVariable.value}
              onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '15px' }}>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
              Annuler
            </button>
            <button
              onClick={handleAddVariable}
              className="btn-primary"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Liste des variables */}
      <div style={{ padding: '0' }}>
        {/* Variables communes */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '20px',
            padding: '0 20px',
            borderBottom: '2px solid #0ED894',
            paddingBottom: '8px'
          }}>
            📝 Informations générales
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            padding: '0 20px'
          }}>
            {Object.entries(predefinedVariables.common).map(([key, config]) => (
              <div key={key} style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <span>
                    {config.label}
                    {config.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </span>
                  {isEditing && !config.required && (
                    <button
                      onClick={() => handleDeleteVariable(key)}
                      style={{
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </label>
                {renderVariableInput(key, config)}
              </div>
            ))}
          </div>
        </div>

        {/* Variables spécifiques au type de campagne */}
        {predefinedVariables.specific[campaignType] && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '20px',
              padding: '0 20px',
              borderBottom: '2px solid #f59e0b',
              paddingBottom: '8px'
            }}>
              🎯 Variables spécifiques - {campaignType}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              padding: '0 20px'
            }}>
              {Object.entries(predefinedVariables.specific[campaignType]).map(([key, config]) => (
                <div key={key} style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    <span>
                      {config.label}
                      {config.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </span>
                    {isEditing && !config.required && (
                      <button
                        onClick={() => handleDeleteVariable(key)}
                        style={{
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    )}
                  </label>
                  {renderVariableInput(key, config)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variables personnalisées */}
        {Object.keys(variables).some(key => !currentVariables[key]) && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '20px',
              padding: '0 20px',
              borderBottom: '2px solid #8b5cf6',
              paddingBottom: '8px'
            }}>
              ⚙️ Variables personnalisées
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              padding: '0 20px'
            }}>
              {Object.entries(variables)
                .filter(([key]) => !currentVariables[key])
                .map(([key, value]) => (
                <div key={key} style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    <span>{key}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteVariable(key)}
                        style={{
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aide */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '15px',
        margin: '20px'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#1e40af',
          lineHeight: '1.5'
        }}>
          <strong>💡 Astuce :</strong> Les variables marquées d'un * sont obligatoires.
          Toutes les variables saisies ici seront automatiquement intégrées dans votre template.
        </div>
      </div>
    </div>
  );
};

export default VariableManager;