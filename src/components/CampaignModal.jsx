import React, { useState, useEffect } from "react";
import { X, Upload, Eye } from "lucide-react";
import "../styles/Campaigns.css";

const CampaignModal = ({ campaign, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    type: "single",
    artist: "",
    project: "",
    recipients_count: 0,
    priority: "medium",
    content: "",
    template: "default"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        subject: campaign.subject || "",
        type: campaign.type || "single",
        artist: campaign.artist || "",
        project: campaign.project || "",
        recipients_count: campaign.recipients_count || 0,
        priority: campaign.priority || "medium",
        content: campaign.content || "",
        template: campaign.template || "default"
      });
    }
  }, [campaign]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la campagne est requis";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Le sujet de l'email est requis";
    }

    if (!formData.artist.trim()) {
      newErrors.artist = "L'artiste est requis";
    }

    if (!formData.project.trim()) {
      newErrors.project = "Le projet est requis";
    }

    if (formData.recipients_count <= 0) {
      newErrors.recipients_count = "Le nombre de destinataires doit être supérieur à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const campaignTypes = [
    { value: "single", label: "Single" },
    { value: "album", label: "Album" },
    { value: "ep", label: "EP" },
    { value: "tour", label: "Tournée" },
    { value: "media", label: "Couverture média" },
    { value: "interview", label: "Interview" },
    { value: "playlist", label: "Playlist" }
  ];

  const priorityLevels = [
    { value: "low", label: "Faible" },
    { value: "medium", label: "Moyenne" },
    { value: "high", label: "Élevée" }
  ];

  const templates = [
    { value: "default", label: "Template par défaut" },
    { value: "single-promo", label: "Promotion Single" },
    { value: "album-announcement", label: "Annonce Album" },
    { value: "tour-announcement", label: "Annonce Tournée" },
    { value: "media-coverage", label: "Couverture Média" },
    { value: "interview-request", label: "Demande d'Interview" },
    { value: "playlist-submission", label: "Soumission Playlist" }
  ];

  return (
    <div className="campaign-modal">
      <div className="campaign-modal-content">
        <div className="campaign-modal-header">
          <h2 className="campaign-modal-title">
            {campaign ? "Modifier la campagne" : "Nouvelle campagne"}
          </h2>
          <button className="campaign-modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="campaign-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom de la campagne *</label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Lancement Album - Dreams"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Sujet de l'email *</label>
            <input
              type="text"
              className={`form-input ${errors.subject ? 'error' : ''}`}
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Ex: 🎵 Découvrez le nouvel album de Nova - Dreams"
            />
            {errors.subject && <span className="form-error">{errors.subject}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type de campagne</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {campaignTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priorité</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Artiste *</label>
              <input
                type="text"
                className={`form-input ${errors.artist ? 'error' : ''}`}
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
                placeholder="Nom de l'artiste"
              />
              {errors.artist && <span className="form-error">{errors.artist}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Projet *</label>
              <input
                type="text"
                className={`form-input ${errors.project ? 'error' : ''}`}
                value={formData.project}
                onChange={(e) => handleChange('project', e.target.value)}
                placeholder="Nom du projet/album/single"
              />
              {errors.project && <span className="form-error">{errors.project}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre de destinataires *</label>
              <input
                type="number"
                className={`form-input ${errors.recipients_count ? 'error' : ''}`}
                value={formData.recipients_count}
                onChange={(e) => handleChange('recipients_count', parseInt(e.target.value) || 0)}
                min="1"
                placeholder="Ex: 250"
              />
              {errors.recipients_count && <span className="form-error">{errors.recipients_count}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Template</label>
              <select
                className="form-select"
                value={formData.template}
                onChange={(e) => handleChange('template', e.target.value)}
              >
                {templates.map(template => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contenu de l'email</label>
            <textarea
              className="form-textarea"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Rédigez le contenu de votre email ici..."
              rows="8"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pièces jointes</label>
            <div className="upload-area">
              <div className="upload-placeholder">
                <Upload size={24} />
                <span>Glissez vos fichiers ici ou cliquez pour parcourir</span>
                <small>Formats acceptés: PDF, JPG, PNG, MP3 (max 10MB)</small>
              </div>
            </div>
          </div>

          <div className="campaign-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-save">
              {campaign ? "Mettre à jour" : "Créer la campagne"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;