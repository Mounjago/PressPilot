/**
 * COMPOSANT IMPORT JOURNALISTES FRANÇAIS
 * Interface pour importer la base de données de journalistes français
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const JournalistImporter = ({ onClose, onImportComplete }) => {
  const [step, setStep] = useState('preview'); // 'preview', 'importing', 'success'
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger la prévisualisation au montage
  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts/import/preview');
      const data = await response.json();

      if (data.success) {
        setPreviewData(data.data);
      } else {
        setError(data.message || 'Erreur lors du chargement de la prévisualisation');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    try {
      setStep('importing');
      setLoading(true);

      const response = await fetch('/api/contacts/import/french-journalists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setImportResults(data.data);
        setStep('success');
        if (onImportComplete) {
          onImportComplete(data.data);
        }
      } else {
        setError(data.message || 'Erreur lors de l\'import');
        setStep('preview');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const renderPreviewStep = () => (
    <div style={{ padding: '0 20px 20px' }}>
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #0ED894',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '15px', color: '#666' }}>
            Chargement de la prévisualisation...
          </span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          ❌ {error}
        </div>
      )}

      {previewData && (
        <div>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#1e293b',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              📊 Résumé de l'import
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0ED894' }}>
                  {formatNumber(previewData.totalContacts)}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Contacts total</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {previewData.categories.length}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Catégories</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {Object.keys(previewData.locations).length}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Villes</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#1e293b',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              📻 Catégories de médias
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {previewData.categories.map((category, index) => (
                <div key={index} style={{
                  backgroundColor: '#ffffff',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {category.category}
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        backgroundColor: '#22c55e',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        +{category.newContacts} nouveaux
                      </span>
                      {category.alreadyExists > 0 && (
                        <span style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {category.alreadyExists} existants
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{
                    margin: '0 0 10px 0',
                    color: '#64748b',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {category.description}
                  </p>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    Exemples : {category.sampleContacts.map(contact => contact.media).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div>
              <h4 style={{
                margin: '0 0 10px 0',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                🎵 Top spécialisations
              </h4>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {Object.entries(previewData.specializations).slice(0, 5).map(([spec, count]) => (
                  <div key={spec} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#64748b' }}>{spec}</span>
                    <span style={{ color: '#0ED894', fontWeight: '500' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{
                margin: '0 0 10px 0',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                📍 Répartition géographique
              </h4>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {Object.entries(previewData.locations).slice(0, 5).map(([city, count]) => (
                  <div key={city} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#64748b' }}>{city}</span>
                    <span style={{ color: '#3b82f6', fontWeight: '500' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Annuler
            </button>
            <button
              onClick={startImport}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0ED894',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🚀 Lancer l'import ({formatNumber(previewData.categories.reduce((sum, cat) => sum + cat.newContacts, 0))} nouveaux contacts)
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderImportingStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #0ED894',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <h3 style={{
        margin: '0 0 10px 0',
        color: '#1e293b',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Import en cours...
      </h3>
      <p style={{
        margin: 0,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        Nous importons les contacts journalistes français dans votre base de données.
        <br />
        Cette opération peut prendre quelques secondes.
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div style={{ padding: '20px' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#0ED894',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 15px',
          fontSize: '24px'
        }}>
          ✅
        </div>
        <h3 style={{
          margin: '0 0 10px 0',
          color: '#1e293b',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Import terminé avec succès !
        </h3>
        <p style={{
          margin: 0,
          color: '#64748b'
        }}>
          {formatNumber(importResults?.summary.totalImported)} nouveaux contacts ont été ajoutés à votre base de données
        </p>
      </div>

      {importResults && (
        <div>
          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#166534',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              📈 Résumé de l'import
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '15px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>
                  +{formatNumber(importResults.summary.totalImported)}
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>Importés</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {formatNumber(importResults.summary.totalSkipped)}
                </div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>Ignorés</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {formatNumber(importResults.summary.totalInDatabase)}
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>Total en base</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              📋 Détails par catégorie
            </h4>
            {importResults.details.map((detail, index) => (
              <div key={index} style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: '500', color: '#1e293b' }}>
                    {detail.category}
                  </span>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    +{detail.imported} importés, {detail.skipped} ignorés
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {detail.contacts.slice(0, 3).map(c => c.media).join(', ')}
                  {detail.contacts.length > 3 && ` et ${detail.contacts.length - 3} autres...`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0ED894',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '700px',
          maxHeight: '90vh',
          width: '90%',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '20px 20px 0',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                margin: '0 0 5px 0',
                color: '#1e293b',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                📻 Import Journalistes Français
              </h2>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '14px'
              }}>
                Base de données Ferarock & Radio Campus France
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b',
                padding: '5px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{
          maxHeight: 'calc(90vh - 100px)',
          overflowY: 'auto'
        }}>
          <AnimatePresence mode="wait">
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                {renderPreviewStep()}
              </motion.div>
            )}
            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                {renderImportingStep()}
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                {renderSuccessStep()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default JournalistImporter;