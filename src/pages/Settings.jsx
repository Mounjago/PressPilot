import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Lock, Bell, Mail, Globe, Palette, Database, Send } from 'lucide-react';
import Layout from '../components/Layout';
import IMAPSettings from '../components/IMAPSettings';
import { authApi } from '../api';
import '../styles/Dashboard.css';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Formulaire de profil
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    role: user?.role || ''
  });

  // Paramètres de notification
  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    emailResponses: true,
    phoneCallReminders: true,
    weeklyReports: true,
    monthlyAnalytics: false
  });

  // Paramètres généraux
  const [generalSettings, setGeneralSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/mm/yyyy',
    theme: 'light'
  });

  // Paramètres d'email
  const [emailSettings, setEmailSettings] = useState({
    senderEmail: user?.email || '',
    senderName: user?.name || '',
    replyToEmail: '',
    signature: '',
    trackOpens: true,
    trackClicks: true,
    unsubscribeLink: true
  });

  // Charger les paramètres email existants
  useEffect(() => {
    const loadEmailSettings = async () => {
      try {
        const response = await authApi.getEmailSettings();
        if (response.success) {
          setEmailSettings(response.emailSettings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres email:', error);
      }
    };

    if (user) {
      loadEmailSettings();
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setMessage('Profil mis à jour avec succès !');
      } else {
        setMessage('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      setMessage('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEmailSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await authApi.updateEmailSettings(emailSettings);
      if (result.success) {
        setMessage('Paramètres email mis à jour avec succès !');
      } else {
        setMessage('Erreur lors de la mise à jour des paramètres email');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres email:', error);
      setMessage('Erreur lors de la mise à jour des paramètres email');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'email', label: 'Email', icon: Send },
    { id: 'imap', label: 'IMAP/POP3', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'security', label: 'Sécurité', icon: Lock }
  ];

  return (
    <Layout title="PARAMETRES" subtitle="Gérez vos préférences et paramètres de compte">

        <div className="settings-container">
          {/* Navigation des onglets */}
          <div className="settings-tabs">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <IconComponent size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="settings-content">
            {message && (
              <div className={`settings-message ${message.includes('succès') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {/* Onglet Profil */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <User size={20} />
                  Informations du profil
                </h2>

                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nom complet</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Votre nom complet"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>

                    <div className="form-group">
                      <label>Entreprise</label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <Save size={16} />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                  </button>
                </form>
              </div>
            )}

            {/* Onglet Email */}
            {activeTab === 'email' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <Send size={20} />
                  Parametres d'envoi email
                </h2>

                <form onSubmit={handleEmailSettingsSubmit} className="settings-form">
                  <div className="form-section">
                    <h3>Identité de l'expéditeur</h3>
                    <p className="form-section-description">
                      Ces informations seront utilisées pour l'envoi de vos campagnes email
                    </p>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Email d'expédition</label>
                        <input
                          type="email"
                          value={emailSettings.senderEmail}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                          placeholder="votre@email.com"
                          required
                        />
                        <small className="form-help">
                          L'adresse email qui apparaîtra comme expéditeur de vos campagnes
                        </small>
                      </div>

                      <div className="form-group">
                        <label>Nom d'expéditeur</label>
                        <input
                          type="text"
                          value={emailSettings.senderName}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                          placeholder="Votre nom ou nom d'entreprise"
                          required
                        />
                        <small className="form-help">
                          Le nom qui apparaîtra comme expéditeur de vos campagnes
                        </small>
                      </div>

                      <div className="form-group form-group-full">
                        <label>Email de réponse (optionnel)</label>
                        <input
                          type="email"
                          value={emailSettings.replyToEmail}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
                          placeholder="reponse@votre-domaine.com"
                        />
                        <small className="form-help">
                          Si différent de l'email d'expédition, les réponses seront dirigées vers cette adresse
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Signature email</h3>
                    <div className="form-group">
                      <label>Signature automatique</label>
                      <textarea
                        value={emailSettings.signature}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, signature: e.target.value }))}
                        placeholder="Votre signature professionnelle..."
                        rows={4}
                        className="form-textarea"
                      />
                      <small className="form-help">
                        Cette signature sera automatiquement ajoutée à la fin de vos emails
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Suivi et analytics</h3>
                    <div className="settings-toggles">
                      <div className="settings-toggle-item">
                        <div className="toggle-info">
                          <label>Suivi des ouvertures</label>
                          <p>Suivre quand vos emails sont ouverts par les destinataires</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={emailSettings.trackOpens}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, trackOpens: e.target.checked }))}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="settings-toggle-item">
                        <div className="toggle-info">
                          <label>Suivi des clics</label>
                          <p>Suivre quand les liens dans vos emails sont cliqués</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={emailSettings.trackClicks}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, trackClicks: e.target.checked }))}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="settings-toggle-item">
                        <div className="toggle-info">
                          <label>Lien de désabonnement</label>
                          <p>Ajouter automatiquement un lien de désabonnement à vos emails</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={emailSettings.unsubscribeLink}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, unsubscribeLink: e.target.checked }))}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="email-preview">
                      <h3>Aperçu de l'expéditeur</h3>
                      <div className="preview-card">
                        <div className="preview-from">
                          <strong>{emailSettings.senderName || 'Nom expéditeur'}</strong>
                          <span>&lt;{emailSettings.senderEmail || 'email@example.com'}&gt;</span>
                        </div>
                        {emailSettings.replyToEmail && (
                          <div className="preview-reply">
                            Répondre à: {emailSettings.replyToEmail}
                          </div>
                        )}
                        {emailSettings.signature && (
                          <div className="preview-signature">
                            <hr />
                            <div>{emailSettings.signature}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <Save size={16} />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres email'}
                  </button>
                </form>
              </div>
            )}

            {/* Onglet IMAP/POP3 */}
            {activeTab === 'imap' && (
              <div className="settings-section">
                <IMAPSettings />
              </div>
            )}

            {/* Onglet Notifications */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <Bell size={20} />
                  Préférences de notification
                </h2>

                <div className="notification-settings">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="notification-item">
                      <div className="notification-info">
                        <label className="notification-label">
                          {key === 'emailCampaigns' && 'Notifications de campagnes email'}
                          {key === 'emailResponses' && 'Réponses aux emails'}
                          {key === 'phoneCallReminders' && 'Rappels d\'appels téléphoniques'}
                          {key === 'weeklyReports' && 'Rapports hebdomadaires'}
                          {key === 'monthlyAnalytics' && 'Analytics mensuels'}
                        </label>
                        <p className="notification-description">
                          {key === 'emailCampaigns' && 'Recevez des notifications lors de l\'envoi de campagnes'}
                          {key === 'emailResponses' && 'Soyez alerté des nouvelles réponses à vos emails'}
                          {key === 'phoneCallReminders' && 'Rappels automatiques pour vos appels programmés'}
                          {key === 'weeklyReports' && 'Résumé hebdomadaire de vos activités'}
                          {key === 'monthlyAnalytics' && 'Rapport mensuel détaillé des performances'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleNotificationChange(key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglet Général */}
            {activeTab === 'general' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <Globe size={20} />
                  Paramètres généraux
                </h2>

                <div className="settings-form">
                  <div className="form-group">
                    <label>Langue</label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fuseau horaire</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Format de date</label>
                    <select
                      value={generalSettings.dateFormat}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    >
                      <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Thème</label>
                    <select
                      value={generalSettings.theme}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, theme: e.target.value }))}
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="auto">Automatique</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <Lock size={20} />
                  Securite et confidentialite
                </h2>

                <div className="security-settings">
                  <div className="security-item">
                    <div className="security-info">
                      <h3>Changer le mot de passe</h3>
                      <p>Mettez à jour votre mot de passe régulièrement pour maintenir la sécurité</p>
                    </div>
                    <button className="btn-secondary">
                      Modifier le mot de passe
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h3>Authentification à deux facteurs</h3>
                      <p>Ajoutez une couche de sécurité supplémentaire à votre compte</p>
                    </div>
                    <button className="btn-secondary">
                      Configurer 2FA
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h3>Sessions actives</h3>
                      <p>Gérez vos sessions actives sur différents appareils</p>
                    </div>
                    <button className="btn-secondary">
                      Voir les sessions
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h3>Exporter mes données</h3>
                      <p>Téléchargez une copie de toutes vos données PressPilot</p>
                    </div>
                    <button className="btn-secondary">
                      <Database size={16} />
                      Exporter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </Layout>
  );
};

export default Settings;