import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import '../styles/Dashboard.css';

const TemplateSelector = ({ onTemplateSelect, campaignType, artistName, projectName }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Définition des templates - Version standardisée avec le design system
  const templates = {
    communique: {
      id: 'communique',
      name: 'Communiqué de presse',
      category: 'Officiel',
      description: 'Format officiel pour annoncer une sortie, actualité ou événement',
      preview: 'Template professionnel avec en-tête, accroche, corps de texte structuré et informations de contact',
      features: ['Header professionnel', 'Structure journalistique', 'Informations techniques'],
      color: '#3b82f6'
    },
    teaser: {
      id: 'teaser',
      name: 'Teaser / Annonce',
      category: 'Marketing',
      description: 'Format court et percutant pour créer l\'attente',
      preview: 'Design moderne avec mise en avant visuelle, texte accrocheur et call-to-action',
      features: ['Design accrocheur', 'Call-to-action', 'Mise en avant visuelle'],
      color: '#f59e0b'
    },
    interview: {
      id: 'interview',
      name: 'Demande d\'interview',
      category: 'Relations presse',
      description: 'Template personnalisé pour solliciter les journalistes',
      preview: 'Approche courtoise avec présentation de l\'artiste, angle proposé et disponibilités',
      features: ['Approche personnalisée', 'Angles proposés', 'Disponibilités'],
      color: '#10b981'
    },
    review: {
      id: 'review',
      name: 'Demande de chronique',
      category: 'Critique musicale',
      description: 'Format spécialisé pour les demandes de review',
      preview: 'Présentation du projet, éléments d\'écoute et informations techniques',
      features: ['Liens d\'écoute', 'Infos techniques', 'Dossier de presse'],
      color: '#8b5cf6'
    },
    premiere: {
      id: 'premiere',
      name: 'Première exclusive',
      category: 'Premium',
      description: 'Template premium pour les exclusivités médias',
      preview: 'Design exclusif avec badge "Première", délai d\'exclusivité et éléments premium',
      features: ['Badge exclusivité', 'Délai défini', 'Contenu premium'],
      color: '#ef4444'
    },
    playlist: {
      id: 'playlist',
      name: 'Demande playlist',
      category: 'Streaming',
      description: 'Spécialisé pour les curateurs et programmateurs',
      preview: 'Format optimisé avec BPM, genre, mood et informations techniques',
      features: ['BPM et genre', 'Mood description', 'Infos curateurs'],
      color: '#6366f1'
    },
    live: {
      id: 'live',
      name: 'Invitation concert/showcase',
      category: 'Événementiel',
      description: 'Template événementiel avec informations pratiques',
      preview: 'Design événementiel avec date, lieu, accréditation et plan d\'accès',
      features: ['Date et lieu', 'Accréditation', 'Infos pratiques'],
      color: '#eab308'
    },
    'follow-up': {
      id: 'follow-up',
      name: 'Relance presse',
      category: 'Suivi',
      description: 'Template de suivi courtois et professionnel',
      preview: 'Approche délicate avec rappel du premier envoi et nouvelles informations',
      features: ['Ton courtois', 'Rappel délicat', 'Nouvelles infos'],
      color: '#6b7280'
    }
  };

  const currentTemplate = templates[campaignType];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates[templateId];
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const TemplatePreview = ({ template }) => {
    return (
      <div className="chart-card" style={{ marginTop: '20px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Aperçu du template</h3>
          <span
            className="status"
            style={{
              backgroundColor: `${template.color}15`,
              color: template.color,
              borderColor: `${template.color}30`
            }}
          >
            {template.category}
          </span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '15px'
          }}>
            {template.description}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '10px'
          }}>
            Aperçu du template :
          </h4>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '1.5',
            backgroundColor: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {template.preview}
          </p>
        </div>

        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '10px'
          }}>
            Caractéristiques :
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {template.features.map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#0ED894',
                  borderRadius: '50%',
                  marginRight: '8px'
                }}></div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '16px'
        }}>
          <span className="status" style={{
            backgroundColor: '#0ED89415',
            color: '#0ED894',
            borderColor: '#0ED89430'
          }}>
            Responsive
          </span>
          <span className="status" style={{
            backgroundColor: '#0ED89415',
            color: '#0ED894',
            borderColor: '#0ED89430'
          }}>
            Variables dynamiques
          </span>
          <span className="status" style={{
            backgroundColor: '#0ED89415',
            color: '#0ED894',
            borderColor: '#0ED89430'
          }}>
            Charte PressPilot
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="main-content">
      {/* En-tête - Style standardisé */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h2 className="chart-title">Templates professionnels</h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              marginTop: '4px'
            }}>
              Choisissez un template adapté à votre type de campagne
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginBottom: '4px'
            }}>
              Projet actuel
            </p>
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              {artistName} • {projectName}
            </p>
          </div>
        </div>

        {/* Template recommandé */}
        {currentTemplate && (
          <div style={{
            background: 'linear-gradient(135deg, #0ED89408 0%, #0ED89415 100%)',
            border: '1px solid #0ED89430',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    {currentTemplate.name}
                  </h3>
                  <span className="status" style={{
                    backgroundColor: '#0ED894',
                    color: '#ffffff'
                  }}>
                    Recommandé
                  </span>
                  <span className="status" style={{
                    backgroundColor: `${currentTemplate.color}15`,
                    color: currentTemplate.color,
                    borderColor: `${currentTemplate.color}30`
                  }}>
                    {currentTemplate.category}
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0
                }}>
                  {currentTemplate.description}
                </p>
              </div>
              <button
                onClick={() => handleTemplateSelect(currentTemplate.id)}
                className="btn-primary"
              >
                Utiliser ce template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grille des templates - 2-3 par ligne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginTop: '20px'
      }}>
        {Object.values(templates).map((template) => {
          const isRecommended = template.id === campaignType;
          const isSelected = selectedTemplate === template.id;

          return (
            <div
              key={template.id}
              className={`chart-card ${isSelected ? 'selected-template' : ''}`}
              style={{
                cursor: 'pointer',
                position: 'relative',
                border: isSelected ? '2px solid #0ED894' : undefined,
                transform: isSelected ? 'translateY(-2px)' : undefined,
                boxShadow: isSelected ? '0 12px 48px rgba(14, 216, 148, 0.15)' : undefined
              }}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {isRecommended && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#0ED894',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  zIndex: 10
                }}>
                  Recommandé
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    lineHeight: '1.3'
                  }}>
                    {template.name}
                  </h3>
                  <span
                    className="status"
                    style={{
                      backgroundColor: `${template.color}15`,
                      color: template.color,
                      borderColor: `${template.color}30`,
                      fontSize: '10px',
                      padding: '2px 6px',
                      marginLeft: '8px',
                      flexShrink: 0
                    }}
                  >
                    {template.category}
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  {template.description}
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {template.features.slice(0, 3).map((feature, index) => (
                    <span key={index} style={{
                      fontSize: '10px',
                      color: '#6b7280',
                      backgroundColor: '#f8fafc',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#0ED894',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg
                    style={{ width: '12px', height: '12px', color: '#ffffff' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prévisualisation du template sélectionné */}
      {selectedTemplate && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 className="chart-title">Prévisualisation</h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye style={{ width: '16px', height: '16px' }} />
              {showPreview ? 'Masquer' : 'Voir'} l'aperçu
            </button>
          </div>

          {showPreview && (
            <TemplatePreview template={templates[selectedTemplate]} />
          )}
        </div>
      )}

      {/* Actions */}
      {selectedTemplate && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            onClick={() => handleTemplateSelect(selectedTemplate)}
            className="btn-primary"
          >
            Utiliser ce template
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;