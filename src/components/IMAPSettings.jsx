import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Settings,
  Trash2,
  TestTube,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Loader,
  RefreshCw
} from 'lucide-react';
import { imapApi } from '../api';

const IMAPSettings = () => {
  const [configurations, setConfigurations] = useState([]);
  const [presets, setPresets] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);
  const [message, setMessage] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    provider: 'gmail',
    imapConfig: {
      host: '',
      port: 993,
      secure: true,
      username: '',
      password: ''
    },
    pollingConfig: {
      enabled: true,
      intervalMinutes: 5,
      maxMessages: 50,
      onlyUnread: true,
      markAsRead: false
    }
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadConfigurations();
    loadPresets();
  }, []);

  const loadConfigurations = async () => {
    try {
      const response = await imapApi.getAll();
      if (response.success) {
        setConfigurations(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement configurations:', error);
      setMessage('Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await imapApi.getPresets();
      if (response.success) {
        setPresets(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement presets:', error);
    }
  };

  const handleProviderChange = (provider) => {
    const preset = presets[provider];
    setFormData(prev => ({
      ...prev,
      provider,
      imapConfig: {
        ...prev.imapConfig,
        ...preset,
        username: prev.imapConfig.username,
        password: prev.imapConfig.password
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let response;
      if (editingConfig) {
        response = await imapApi.update(editingConfig.id, formData);
      } else {
        response = await imapApi.create(formData);
      }

      if (response.success) {
        setMessage(editingConfig ? 'Configuration mise à jour avec succès' : 'Configuration créée avec succès');
        setShowForm(false);
        setEditingConfig(null);
        resetForm();
        await loadConfigurations();
      } else {
        setMessage(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setMessage('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (configId) => {
    setTestingConnection(configId);
    try {
      const response = await imapApi.testConnection(configId);
      if (response.success) {
        setMessage('Connexion réussie !');
        await loadConfigurations();
      } else {
        setMessage(`Erreur de connexion: ${response.message}`);
      }
    } catch (error) {
      console.error('Erreur test connexion:', error);
      setMessage(`Erreur de connexion: ${error.response?.data?.message || error.message}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleTogglePolling = async (configId) => {
    try {
      const response = await imapApi.togglePolling(configId);
      if (response.success) {
        setMessage(response.message);
        await loadConfigurations();
      }
    } catch (error) {
      console.error('Erreur toggle polling:', error);
      setMessage('Erreur lors du basculement du polling');
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return;
    }

    try {
      const response = await imapApi.delete(configId);
      if (response.success) {
        setMessage('Configuration supprimée avec succès');
        await loadConfigurations();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage('Erreur lors de la suppression de la configuration');
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      email: config.email,
      provider: config.provider,
      imapConfig: {
        host: config.imapConfig?.host || '',
        port: config.imapConfig?.port || 993,
        secure: config.imapConfig?.secure !== false,
        username: config.imapConfig?.username || '',
        password: ''
      },
      pollingConfig: {
        enabled: config.pollingConfig?.enabled !== false,
        intervalMinutes: config.pollingConfig?.intervalMinutes || 5,
        maxMessages: config.pollingConfig?.maxMessages || 50,
        onlyUnread: config.pollingConfig?.onlyUnread !== false,
        markAsRead: config.pollingConfig?.markAsRead === true
      }
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      provider: 'gmail',
      imapConfig: {
        host: '',
        port: 993,
        secure: true,
        username: '',
        password: ''
      },
      pollingConfig: {
        enabled: true,
        intervalMinutes: 5,
        maxMessages: 50,
        onlyUnread: true,
        markAsRead: false
      }
    });
    setEditingConfig(null);
    setShowPassword(false);
  };

  const getStatusIcon = (config) => {
    if (config.status === 'active' && config.isConnected) {
      return <CheckCircle className="status-icon success" size={16} />;
    } else if (config.status === 'error') {
      return <XCircle className="status-icon error" size={16} />;
    } else if (config.status === 'testing') {
      return <Loader className="status-icon testing animate-spin" size={16} />;
    } else {
      return <Clock className="status-icon inactive" size={16} />;
    }
  };

  const getHealthBadge = (health) => {
    const colors = {
      excellent: '#10b981',
      good: '#f59e0b',
      poor: '#ef4444',
      critical: '#dc2626',
      unknown: '#6b7280'
    };

    return (
      <span
        className="health-badge"
        style={{ backgroundColor: colors[health] || colors.unknown }}
      >
        {health}
      </span>
    );
  };

  if (loading && configurations.length === 0) {
    return (
      <div className="imap-settings">
        <div className="loading-container">
          <Loader className="animate-spin" size={24} />
          <span>Chargement des configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="imap-settings">
      <div className="imap-header">
        <div className="imap-title">
          <Mail size={24} />
          <h3>Configuration des comptes email IMAP</h3>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          <Plus size={16} />
          Ajouter un compte
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('succès') || message.includes('réussie') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Liste des configurations */}
      <div className="configurations-list">
        {configurations.length === 0 ? (
          <div className="empty-state">
            <Mail size={48} />
            <h4>Aucun compte configuré</h4>
            <p>Ajoutez votre premier compte email pour commencer à recevoir les réponses automatiquement.</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Ajouter un compte
            </button>
          </div>
        ) : (
          configurations.map(config => (
            <div key={config.id} className="config-card">
              <div className="config-header">
                <div className="config-info">
                  <div className="config-name">
                    {getStatusIcon(config)}
                    <span>{config.name}</span>
                    {getHealthBadge(config.connectionHealth)}
                  </div>
                  <div className="config-email">{config.email}</div>
                  <div className="config-provider">{config.provider}</div>
                </div>
                <div className="config-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleTestConnection(config.id)}
                    disabled={testingConnection === config.id}
                    title="Tester la connexion"
                  >
                    {testingConnection === config.id ? (
                      <Loader className="animate-spin" size={16} />
                    ) : (
                      <TestTube size={16} />
                    )}
                  </button>

                  <button
                    className={`btn-icon ${config.pollingConfig?.enabled ? 'active' : ''}`}
                    onClick={() => handleTogglePolling(config.id)}
                    title={config.pollingConfig?.enabled ? 'Désactiver le polling' : 'Activer le polling'}
                  >
                    {config.pollingConfig?.enabled ? (
                      <Power size={16} />
                    ) : (
                      <PowerOff size={16} />
                    )}
                  </button>

                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(config)}
                    title="Modifier"
                  >
                    <Settings size={16} />
                  </button>

                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(config.id)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="config-stats">
                <div className="stat">
                  <span className="stat-label">Emails traités</span>
                  <span className="stat-value">{config.statistics?.totalEmailsProcessed || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Campagnes associées</span>
                  <span className="stat-value">{config.statistics?.campaignsMatched || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Intervalle</span>
                  <span className="stat-value">{config.pollingConfig?.intervalMinutes || 0}min</span>
                </div>
                {config.lastConnection?.successful && (
                  <div className="stat">
                    <span className="stat-label">Dernière connexion</span>
                    <span className="stat-value">
                      {new Date(config.lastConnection.successful).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {config.lastConnection?.lastError && (
                <div className="config-error">
                  <AlertCircle size={16} />
                  <span>{config.lastConnection.lastError.message}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulaire de configuration */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingConfig ? 'Modifier la configuration' : 'Nouvelle configuration IMAP'}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="imap-form">
              <div className="form-section">
                <h4>Informations générales</h4>

                <div className="form-group">
                  <label>Nom de la configuration</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Gmail Principal"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre.email@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook / Hotmail</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="custom">Configuration personnalisée</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Configuration IMAP</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Serveur IMAP</label>
                    <input
                      type="text"
                      value={formData.imapConfig.host}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        imapConfig: { ...prev.imapConfig, host: e.target.value }
                      }))}
                      placeholder="imap.gmail.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Port</label>
                    <input
                      type="number"
                      value={formData.imapConfig.port}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        imapConfig: { ...prev.imapConfig, port: parseInt(e.target.value) }
                      }))}
                      min="1"
                      max="65535"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={formData.imapConfig.username}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      imapConfig: { ...prev.imapConfig, username: e.target.value }
                    }))}
                    placeholder="Généralement votre adresse email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mot de passe</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.imapConfig.password}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        imapConfig: { ...prev.imapConfig, password: e.target.value }
                      }))}
                      placeholder={editingConfig ? "Laisser vide pour garder l'actuel" : "Votre mot de passe email"}
                      required={!editingConfig}
                    />
                    <button
                      type="button"
                      className="btn-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.provider === 'gmail' && (
                    <small className="form-help">
                      Pour Gmail, utilisez un mot de passe d'application.
                      <a href="https://support.google.com/mail/answer/185833" target="_blank" rel="noopener noreferrer">
                        En savoir plus
                      </a>
                    </small>
                  )}
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.imapConfig.secure}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        imapConfig: { ...prev.imapConfig, secure: e.target.checked }
                      }))}
                    />
                    Connexion sécurisée (SSL/TLS)
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h4>Configuration du polling</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Intervalle de vérification (minutes)</label>
                    <input
                      type="number"
                      value={formData.pollingConfig.intervalMinutes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pollingConfig: { ...prev.pollingConfig, intervalMinutes: parseInt(e.target.value) }
                      }))}
                      min="1"
                      max="60"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Messages max par vérification</label>
                    <input
                      type="number"
                      value={formData.pollingConfig.maxMessages}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pollingConfig: { ...prev.pollingConfig, maxMessages: parseInt(e.target.value) }
                      }))}
                      min="1"
                      max="500"
                      required
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.pollingConfig.onlyUnread}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pollingConfig: { ...prev.pollingConfig, onlyUnread: e.target.checked }
                      }))}
                    />
                    Seulement les emails non lus
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.pollingConfig.markAsRead}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pollingConfig: { ...prev.pollingConfig, markAsRead: e.target.checked }
                      }))}
                    />
                    Marquer comme lu après traitement
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Sauvegarde...
                    </>
                  ) : (
                    editingConfig ? 'Mettre à jour' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .imap-settings {
          padding: 20px 0;
        }

        .imap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .imap-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .imap-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #6b7280;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert.success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #d1fae5;
        }

        .alert.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .configurations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-state svg {
          color: #d1d5db;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          margin: 0 0 8px 0;
          color: #374151;
        }

        .empty-state p {
          margin: 0 0 24px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .config-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .config-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .config-info {
          flex: 1;
        }

        .config-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .config-email {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .config-provider {
          color: #9ca3af;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .config-actions {
          display: flex;
          gap: 8px;
        }

        .config-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .config-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
        }

        .status-icon.success {
          color: #10b981;
        }

        .status-icon.error {
          color: #ef4444;
        }

        .status-icon.testing {
          color: #3b82f6;
        }

        .status-icon.inactive {
          color: #6b7280;
        }

        .health-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
          letter-spacing: 0.5px;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-icon.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .btn-icon.danger:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .btn-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .imap-form {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .btn-password-toggle {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .btn-password-toggle:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .form-help {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .form-help a {
          color: #3b82f6;
          text-decoration: none;
        }

        .form-help a:hover {
          text-decoration: underline;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .imap-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .config-header {
            flex-direction: column;
            gap: 16px;
          }

          .config-actions {
            justify-content: flex-start;
          }

          .config-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-content {
            margin: 0;
            max-height: 100vh;
            border-radius: 0;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default IMAPSettings;