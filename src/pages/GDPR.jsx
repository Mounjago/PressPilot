import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GDPR.css';

const GDPR = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [consentSettings, setConsentSettings] = useState({
    marketing: false,
    analytics: false,
    necessary: true
  });

  useEffect(() => {
    fetchUserData();
    fetchConsentSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/consent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsentSettings(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    }
  };

  const updateConsent = async (type, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('/api/user/consent', {
        [type]: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsentSettings(prev => ({
        ...prev,
        [type]: value
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mes-donnees-presspilot.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      alert('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete('/api/user/delete', {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gdpr-page">
      <header className="gdpr-header">
        <a href="/dashboard" className="gdpr-header-link">
          <span className="gdpr-back-arrow">←</span>
          Retour au tableau de bord
        </a>
      </header>

      <div className="gdpr-container">
        <div className="gdpr-card">
          <div className="gdpr-title-section">
            <h1 className="gdpr-title">🛡️ Gestion des données personnelles (RGPD)</h1>
            <p className="gdpr-subtitle">Gérez vos données et vos préférences de confidentialité</p>
          </div>

          <div className="gdpr-sections">
            <section className="gdpr-section">
              <h2>📊 Mes données</h2>
              <div className="data-summary">
                {loading ? (
                  <div className="loading">Chargement...</div>
                ) : userData ? (
                  <div className="data-grid">
                    <div className="data-item">
                      <strong>Email:</strong>
                      <span>{userData.email}</span>
                    </div>
                    <div className="data-item">
                      <strong>Compte créé:</strong>
                      <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="data-item">
                      <strong>Dernière connexion:</strong>
                      <span>{new Date(userData.lastLogin).toLocaleDateString()}</span>
                    </div>
                    <div className="data-item">
                      <strong>Contacts importés:</strong>
                      <span>{userData.contactsCount || 0}</span>
                    </div>
                    <div className="data-item">
                      <strong>Campagnes créées:</strong>
                      <span>{userData.campaignsCount || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p>Aucune donnée disponible</p>
                )}
              </div>
            </section>

            <section className="gdpr-section">
              <h2>⚙️ Préférences de consentement</h2>
              <div className="consent-settings">
                <div className="consent-item">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={consentSettings.necessary}
                      disabled
                    />
                    <span className="checkmark"></span>
                    <div className="consent-info">
                      <strong>Cookies nécessaires</strong>
                      <p>Indispensables au fonctionnement du site</p>
                    </div>
                  </label>
                </div>

                <div className="consent-item">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={consentSettings.analytics}
                      onChange={(e) => updateConsent('analytics', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <div className="consent-info">
                      <strong>Cookies d'analyse</strong>
                      <p>Nous aident à améliorer nos services</p>
                    </div>
                  </label>
                </div>

                <div className="consent-item">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={consentSettings.marketing}
                      onChange={(e) => updateConsent('marketing', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <div className="consent-info">
                      <strong>Cookies marketing</strong>
                      <p>Pour personnaliser votre expérience</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section className="gdpr-section">
              <h2>📥 Exporter mes données</h2>
              <p>Téléchargez toutes vos données dans un format lisible (JSON)</p>
              <button
                className="btn btn-primary"
                onClick={exportData}
                disabled={loading}
              >
                {loading ? 'Export en cours...' : '📥 Télécharger mes données'}
              </button>
            </section>

            <section className="gdpr-section danger-zone">
              <h2>⚠️ Zone de danger</h2>
              <p>Actions irréversibles sur votre compte</p>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ Supprimer mon compte
              </button>
            </section>
          </div>
        </div>
      </div>

      <footer className="gdpr-footer">
        <p>© 2024 PressPilot. Données protégées selon le RGPD.</p>
      </footer>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Suppression du compte</h3>
            <p>Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.</p>
            <p>Tapez <strong>SUPPRIMER</strong> pour confirmer :</p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="delete-input"
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={deleteAccount}
                disabled={deleteConfirmation !== 'SUPPRIMER' || loading}
              >
                {loading ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GDPR;