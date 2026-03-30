import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Lock, Bell, Mail, Globe, Palette, Database, Send, Bot, Zap, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import IMAPSettings from '../components/IMAPSettings';
import { authApi, aiApi } from '../api';
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

  // Modal de changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Parametres IA
  const [aiSettings, setAiSettings] = useState({
    provider: 'anthropic',
    apiKey: '',
    model: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [aiHasExistingKey, setAiHasExistingKey] = useState(false);
  const [aiKeyPreview, setAiKeyPreview] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiAvailableModels, setAiAvailableModels] = useState({});
  const [aiDefaultModels, setAiDefaultModels] = useState({});

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

  // Charger les parametres IA
  useEffect(() => {
    const loadAiSettings = async () => {
      try {
        const response = await aiApi.getSettings();
        if (response.success) {
          const data = response.data;
          setAiSettings({
            provider: data.provider || 'anthropic',
            apiKey: '',
            model: data.model || ''
          });
          setAiHasExistingKey(data.hasApiKey);
          setAiKeyPreview(data.apiKeyPreview);
          setAiAvailableModels(data.availableModels || {});
          setAiDefaultModels(data.defaultModels || {});
        }
      } catch (error) {
        console.error('Erreur lors du chargement des parametres IA:', error);
      }
    };

    if (user) {
      loadAiSettings();
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validation des mots de passe
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage('Les nouveaux mots de passe ne correspondent pas');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setMessage('Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }

      // Appel API pour changer le mot de passe
      const result = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        setMessage('Mot de passe mis à jour avec succès !');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(result.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      setMessage('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSettingsSubmit = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setMessage('');
    setAiTestResult(null);

    try {
      const payload = {
        provider: aiSettings.provider,
        model: aiSettings.model || undefined
      };
      // Only send apiKey if user typed a new one
      if (aiSettings.apiKey) {
        payload.apiKey = aiSettings.apiKey;
      }
      const result = await aiApi.updateSettings(payload);
      if (result.success) {
        setMessage('Parametres IA mis a jour avec succes !');
        setAiHasExistingKey(result.data.hasApiKey);
        setAiSettings(prev => ({ ...prev, apiKey: '' }));
        setShowApiKey(false);
        // Reload to get updated preview
        const refreshed = await aiApi.getSettings();
        if (refreshed.success) {
          setAiKeyPreview(refreshed.data.apiKeyPreview);
        }
      } else {
        setMessage(result.message || 'Erreur lors de la mise a jour des parametres IA');
      }
    } catch (error) {
      console.error('Erreur AI settings:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de la mise a jour des parametres IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiTestConnection = async () => {
    setAiTestLoading(true);
    setAiTestResult(null);

    try {
      const result = await aiApi.testConnection();
      setAiTestResult({
        success: true,
        message: result.message,
        latency: result.data?.latencyMs,
        model: result.data?.model
      });
    } catch (error) {
      setAiTestResult({
        success: false,
        message: error.response?.data?.message || 'Echec de la connexion'
      });
    } finally {
      setAiTestLoading(false);
    }
  };

  const providerLabels = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    gemini: 'Google Gemini'
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'email', label: 'Email', icon: Send },
    { id: 'imap', label: 'IMAP/POP3', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'ai', label: 'IA', icon: Bot },
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

            {/* Onglet IA */}
            {activeTab === 'ai' && (
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <Bot size={20} />
                  Configuration Intelligence Artificielle
                </h2>

                <form onSubmit={handleAiSettingsSubmit} className="settings-form">
                  <div className="form-section">
                    <h3>Provider IA</h3>
                    <p className="form-section-description">
                      Choisissez le service d'IA pour la generation de vos communiques de presse
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                      {['anthropic', 'openai', 'gemini'].map(prov => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => {
                            setAiSettings(prev => ({ ...prev, provider: prov, model: '' }));
                            setAiTestResult(null);
                          }}
                          style={{
                            flex: 1,
                            padding: '16px',
                            borderRadius: '12px',
                            border: aiSettings.provider === prov ? '2px solid #0ED894' : '2px solid #e5e7eb',
                            backgroundColor: aiSettings.provider === prov ? '#f0fdf9' : 'white',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: '600', color: aiSettings.provider === prov ? '#0ED894' : '#374151' }}>
                            {providerLabels[prov]}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {prov === 'anthropic' && 'Claude Sonnet / Opus'}
                            {prov === 'openai' && 'GPT-4 / GPT-4o'}
                            {prov === 'gemini' && 'Gemini Pro / Flash'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Cle API {providerLabels[aiSettings.provider]}</h3>
                    <p className="form-section-description">
                      Votre cle est chiffree (AES-256) et stockee de maniere securisee
                    </p>

                    {aiHasExistingKey && aiKeyPreview && (
                      <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <CheckCircle size={16} style={{ color: '#16a34a' }} />
                        <span style={{ fontSize: '13px', color: '#16a34a' }}>
                          Cle configuree : {aiKeyPreview}
                        </span>
                      </div>
                    )}

                    <div className="form-group">
                      <label>{aiHasExistingKey ? 'Remplacer la cle API' : 'Cle API'}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={aiSettings.apiKey}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder={aiHasExistingKey ? 'Laisser vide pour conserver la cle actuelle' : `Entrez votre cle API ${providerLabels[aiSettings.provider]}`}
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: '4px'
                          }}
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <small className="form-help">
                        {aiSettings.provider === 'anthropic' && 'Obtenez votre cle sur console.anthropic.com'}
                        {aiSettings.provider === 'openai' && 'Obtenez votre cle sur platform.openai.com'}
                        {aiSettings.provider === 'gemini' && 'Obtenez votre cle sur aistudio.google.com'}
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Modele</h3>
                    <div className="form-group">
                      <label>Modele IA</label>
                      <select
                        value={aiSettings.model}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Par defaut ({aiDefaultModels[aiSettings.provider] || ''})</option>
                        {(aiAvailableModels[aiSettings.provider] || []).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={aiLoading}
                    >
                      <Save size={16} />
                      {aiLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAiTestConnection}
                      disabled={aiTestLoading || (!aiHasExistingKey && !aiSettings.apiKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: (aiTestLoading || (!aiHasExistingKey && !aiSettings.apiKey)) ? 'not-allowed' : 'pointer',
                        opacity: (aiTestLoading || (!aiHasExistingKey && !aiSettings.apiKey)) ? 0.5 : 1
                      }}
                    >
                      {aiTestLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                      {aiTestLoading ? 'Test en cours...' : 'Tester la connexion'}
                    </button>
                  </div>

                  {aiTestResult && (
                    <div style={{
                      marginTop: '16px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: aiTestResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      backgroundColor: aiTestResult.success ? '#f0fdf4' : '#fef2f2',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      {aiTestResult.success
                        ? <CheckCircle size={18} style={{ color: '#16a34a', marginTop: '1px' }} />
                        : <XCircle size={18} style={{ color: '#dc2626', marginTop: '1px' }} />
                      }
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: aiTestResult.success ? '#16a34a' : '#dc2626'
                        }}>
                          {aiTestResult.message}
                        </div>
                        {aiTestResult.success && aiTestResult.latency && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Latence : {aiTestResult.latency}ms | Modele : {aiTestResult.model}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
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
                    <button
                      className="btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
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

        {/* Modal de changement de mot de passe */}
        {showPasswordModal && (
          <div className="modal-overlay" style={{
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
          }}>
            <div className="modal" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '400px',
              maxWidth: '90vw',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Changer le mot de passe
              </h3>

              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                    minLength="6"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                    minLength="6"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '30px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#0ED894',
                      color: 'white',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </Layout>
  );
};

export default Settings;