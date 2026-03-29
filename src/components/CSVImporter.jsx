import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import "../styles/Dashboard.css";

const ContactsImporter = ({ onClose, onImportComplete }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'mapping', 'importing', 'success'
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customFields, setCustomFields] = useState([]); // {id, field, value}

  // Champs disponibles pour le mapping
  const availableFields = [
    { key: '', label: '-- Ignorer cette colonne --' },
    { key: 'fullName', label: 'Nom complet *' },
    { key: 'firstName', label: 'Prenom *' },
    { key: 'lastName', label: 'Nom de famille *' },
    { key: 'email', label: 'Email *', required: true },
    { key: 'phone', label: 'Telephone' },
    { key: 'jobTitle', label: 'Poste' },
    { key: 'media.name', label: 'Nom du media' },
    { key: 'media.type', label: 'Type de media (radio, magazine, web...)' },
    { key: 'media.website', label: 'Site web du media' },
    { key: 'location.city', label: 'Ville' },
    { key: 'specializations', label: 'Specialisations (separees par ;)' },
    { key: 'tags', label: 'Tags (separes par ;)' },
    { key: 'notes', label: 'Notes' }
  ];

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setError(null);

    try {
      setLoading(true);

      let text;
      if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        // Pour Excel, on utiliserait une librairie comme xlsx
        // Pour cette démo, on demande à l'utilisateur de convertir en CSV
        setError('Veuillez convertir votre fichier Excel en CSV pour l\'import. Support Excel complet à venir.');
        return;
      } else {
        // Lecture CSV
        text = await readFileAsText(uploadedFile);
      }

      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError('Le fichier semble vide ou mal formaté.');
        return;
      }

      const [headerRow, ...dataRows] = rows;
      setHeaders(headerRow);
      setRawData(dataRows.slice(0, 100)); // Limiter à 100 lignes pour la démo

      // Mapping automatique intelligent
      const autoMapping = {};
      headerRow.forEach((header, index) => {
        const lowerHeader = header.toLowerCase().trim();

        // Mapping automatique base sur les noms de colonnes courants
        if (lowerHeader.includes('prenom') || lowerHeader.includes('prénom') || lowerHeader === 'firstname' || lowerHeader === 'first_name') {
          autoMapping[index] = 'firstName';
        } else if (lowerHeader === 'nom' || lowerHeader === 'name' || lowerHeader === 'nom complet' || lowerHeader === 'fullname' || lowerHeader === 'full_name') {
          autoMapping[index] = 'fullName';
        } else if (lowerHeader === 'nom de famille' || lowerHeader === 'lastname' || lowerHeader === 'last_name') {
          autoMapping[index] = 'lastName';
        } else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
          autoMapping[index] = 'email';
        } else if (lowerHeader.includes('téléphone') || lowerHeader.includes('telephone') || lowerHeader.includes('phone') || lowerHeader.includes('tel')) {
          autoMapping[index] = 'phone';
        } else if (lowerHeader.includes('poste') || lowerHeader.includes('fonction') || lowerHeader.includes('title') || lowerHeader.includes('job')) {
          autoMapping[index] = 'jobTitle';
        } else if (lowerHeader.includes('média') || lowerHeader.includes('media') || lowerHeader.includes('entreprise') || lowerHeader.includes('company')) {
          autoMapping[index] = 'media.name';
        } else if (lowerHeader.includes('ville') || lowerHeader.includes('city')) {
          autoMapping[index] = 'location.city';
        } else if (lowerHeader.includes('site') || lowerHeader.includes('website') || lowerHeader.includes('url')) {
          autoMapping[index] = 'media.website';
        } else if (lowerHeader.includes('spécialisation') || lowerHeader.includes('specialisation') || lowerHeader.includes('genre')) {
          autoMapping[index] = 'specializations';
        } else if (lowerHeader.includes('tag') || lowerHeader.includes('catégorie') || lowerHeader.includes('categorie')) {
          autoMapping[index] = 'tags';
        } else if (lowerHeader.includes('note') || lowerHeader.includes('commentaire') || lowerHeader.includes('description')) {
          autoMapping[index] = 'notes';
        }
      });

      setColumnMapping(autoMapping);
      setStep('mapping');

    } catch (err) {
      setError('Erreur lors de la lecture du fichier: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'UTF-8');
    });
  };

  const parseCSV = (text) => {
    const rows = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.trim() === '') continue;

      // Parser CSV simple (pour un parser plus robuste, utiliser une librairie comme papaparse)
      const row = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Date.now(), field: '', value: '' }]);
  };

  const updateCustomField = (id, key, val) => {
    setCustomFields(customFields.map(cf => cf.id === id ? { ...cf, [key]: val } : cf));
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(cf => cf.id !== id));
  };

  const validateMapping = () => {
    const mappedFields = Object.values(columnMapping);
    const customFieldKeys = customFields.filter(cf => cf.field && cf.value).map(cf => cf.field);
    const allFields = [...mappedFields, ...customFieldKeys];

    // Email is always required
    if (!allFields.includes('email')) {
      setError('Champ obligatoire manquant: email');
      return false;
    }

    // Either fullName OR (firstName + lastName) is required
    const hasFullName = allFields.includes('fullName');
    const hasFirstName = allFields.includes('firstName');
    const hasLastName = allFields.includes('lastName');

    if (!hasFullName && !hasFirstName && !hasLastName) {
      setError('Champ obligatoire manquant: Nom complet ou Prenom + Nom de famille');
      return false;
    }

    // Validate custom fields have both field and value
    const incompleteCustom = customFields.filter(cf => (cf.field && !cf.value) || (!cf.field && cf.value));
    if (incompleteCustom.length > 0) {
      setError('Champs manuels incomplets: remplissez le champ et la valeur');
      return false;
    }

    return true;
  };

  const processImport = async () => {
    if (!validateMapping()) return;

    try {
      setStep('importing');
      setLoading(true);

      // Transformer les donnees selon le mapping
      const contacts = rawData.map(row => {
        const contact = {
          source: 'import'
        };

        Object.entries(columnMapping).forEach(([columnIndex, fieldPath]) => {
          if (!fieldPath || !row[columnIndex]) return;

          const value = row[columnIndex].trim();
          if (!value) return;

          // Gerer le champ "Nom complet" -> split en firstName + lastName
          if (fieldPath === 'fullName') {
            const parts = value.split(/\s+/);
            if (parts.length >= 2) {
              contact.firstName = parts[0];
              contact.lastName = parts.slice(1).join(' ');
            } else {
              contact.firstName = value;
              contact.lastName = value;
            }
          // Gerer les champs imbriques (ex: media.name)
          } else if (fieldPath.includes('.')) {
            const [parent, child] = fieldPath.split('.');
            if (!contact[parent]) contact[parent] = {};
            contact[parent][child] = value;
          } else if (fieldPath === 'specializations' || fieldPath === 'tags') {
            contact[fieldPath] = value.split(';').map(item => item.trim()).filter(item => item);
          } else {
            contact[fieldPath] = value;
          }
        });

        // Appliquer les champs manuels (valeur par defaut pour tous les contacts)
        customFields.forEach(cf => {
          if (!cf.field || !cf.value) return;
          if (cf.field === 'fullName') {
            const parts = cf.value.split(/\s+/);
            if (parts.length >= 2) {
              if (!contact.firstName) contact.firstName = parts[0];
              if (!contact.lastName) contact.lastName = parts.slice(1).join(' ');
            } else {
              if (!contact.firstName) contact.firstName = cf.value;
              if (!contact.lastName) contact.lastName = cf.value;
            }
          } else if (cf.field.includes('.')) {
            const [parent, child] = cf.field.split('.');
            if (!contact[parent]) contact[parent] = {};
            if (!contact[parent][child]) contact[parent][child] = cf.value;
          } else if (cf.field === 'specializations' || cf.field === 'tags') {
            if (!contact[cf.field] || contact[cf.field].length === 0) {
              contact[cf.field] = cf.value.split(';').map(item => item.trim()).filter(item => item);
            }
          } else {
            if (!contact[cf.field]) contact[cf.field] = cf.value;
          }
        });

        // Si pas de firstName, utiliser lastName comme fallback
        if (!contact.firstName && contact.lastName) {
          contact.firstName = contact.lastName;
        }
        if (!contact.lastName && contact.firstName) {
          contact.lastName = contact.firstName;
        }

        return contact;
      }).filter(contact => contact.email);

      // Envoyer a l'API avec le token JWT
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts/import/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contacts })
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
        setStep('mapping');
      }

    } catch (err) {
      setError('Erreur de connexion: ' + err.message);
      setStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadStep = () => (
    <div style={{ padding: '20px' }}>
      <div style={{
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          📁
        </div>
        <h3 style={{
          margin: '0 0 10px 0',
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Importer vos contacts
        </h3>
        <p style={{
          margin: '0 0 25px 0',
          color: '#6b7280',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Supporté : CSV (.csv)<br />
          Excel (.xlsx) - conversion nécessaire pour l'instant
        </p>

        <label htmlFor="fileUpload" style={{
          display: 'inline-block',
          padding: '12px 20px',
          backgroundColor: '#0ED894',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {fileName ? `Fichier: ${fileName}` : 'Choisir un fichier'}
        </label>
        <input
          type="file"
          id="fileUpload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0ED894',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '10px', color: '#666' }}>
            Analyse du fichier...
          </span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #fecaca'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{
          margin: '0 0 10px 0',
          color: '#0369a1',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          💡 Format recommandé
        </h4>
        <p style={{
          margin: '0 0 10px 0',
          color: '#0369a1',
          fontSize: '13px',
          lineHeight: '1.4'
        }}>
          Votre fichier CSV doit contenir au minimum : <strong>Nom</strong> (ou Prenom + Nom de famille) et <strong>Email</strong>
        </p>
        <div style={{
          fontSize: '12px',
          color: '#0369a1',
          fontFamily: 'monospace',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #bae6fd'
        }}>
          nom,email,media,telephone,poste,ville<br />
          Marie Dubois,marie@example.com,Le Figaro,01234567,Journaliste,Paris
        </div>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#1f2937',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        🔄 Correspondance des colonnes
      </h3>
      <p style={{
        margin: '0 0 20px 0',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        Faites correspondre les colonnes de votre fichier avec les champs PressPilot :
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {headers.map((header, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              minWidth: '150px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}>
              {header}
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>→</div>
            <select
              value={columnMapping[index] || ''}
              onChange={(e) => setColumnMapping({...columnMapping, [index]: e.target.value})}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {availableFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Champs manuels */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <h4 style={{
            margin: 0,
            color: '#374151',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            + Champs manuels (valeur par defaut)
          </h4>
          <button
            onClick={addCustomField}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            + Ajouter un champ
          </button>
        </div>

        {customFields.length > 0 && (
          <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '12px' }}>
            Ces valeurs seront appliquees a tous les contacts importes (sauf si le CSV fournit deja la valeur).
          </p>
        )}

        {customFields.map(cf => (
          <div key={cf.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            marginBottom: '8px'
          }}>
            <select
              value={cf.field}
              onChange={(e) => updateCustomField(cf.id, 'field', e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: 'white'
              }}
            >
              <option value="">-- Choisir un champ --</option>
              {availableFields.filter(f => f.key).map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>=</div>
            <input
              type="text"
              value={cf.value}
              onChange={(e) => updateCustomField(cf.id, 'value', e.target.value)}
              placeholder="Valeur par defaut..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => removeCustomField(cf.id)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: '1'
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>

      {/* Prévisualisation */}
      {rawData.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            📋 Aperçu (3 premiers contacts)
          </h4>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {rawData.slice(0, 3).map((row, rowIndex) => (
              <div key={rowIndex} style={{
                padding: '12px',
                borderBottom: rowIndex < 2 ? '1px solid #f3f4f6' : 'none'
              }}>
                {Object.entries(columnMapping).map(([colIndex, fieldPath]) => {
                  if (!fieldPath || !row[colIndex]) return null;
                  const fieldLabel = availableFields.find(f => f.key === fieldPath)?.label || fieldPath;
                  return (
                    <div key={colIndex} style={{
                      display: 'inline-block',
                      margin: '2px 8px 2px 0',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#6b7280' }}>{fieldLabel}:</span>{' '}
                      <span style={{ color: '#374151', fontWeight: '500' }}>{row[colIndex]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
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

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setStep('upload')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#f9fafb',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Retour
        </button>
        <button
          onClick={processImport}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0ED894',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Importer {rawData.length} contacts
        </button>
      </div>
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
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Import en cours...
      </h3>
      <p style={{
        margin: 0,
        color: '#6b7280',
        textAlign: 'center'
      }}>
        Traitement de vos contacts en cours...
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
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
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Import terminé !
        </h3>
        <p style={{
          margin: 0,
          color: '#6b7280'
        }}>
          {importResults?.imported || 0} contacts ont ete importes avec succes
        </p>
      </div>

      {/* Details duplicates/errors */}
      {importResults && (importResults.duplicates > 0 || importResults.errors > 0) && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          {importResults.duplicates > 0 && (
            <p style={{ margin: '0 0 5px 0', color: '#92400e', fontSize: '14px' }}>
              ⚠️ {importResults.duplicates} contact(s) deja existant(s) (ignores)
            </p>
          )}
          {importResults.errors > 0 && (
            <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>
              ❌ {importResults.errors} erreur(s) lors de l'import
            </p>
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '20px'
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

  if (!onClose) {
    // Mode intégré dans la page (ancien comportement)
    return (
      <div className="imports-section">
        <h2 className="chart-title">Importer un fichier CSV/Excel</h2>
        {renderUploadStep()}
      </div>
    );
  }

  // Mode modal
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
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              margin: 0,
              color: '#1f2937',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              📁 Import CSV/Excel
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
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
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                {renderUploadStep()}
              </motion.div>
            )}
            {step === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                {renderMappingStep()}
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

export default ContactsImporter;
