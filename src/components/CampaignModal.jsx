import React, { useState, useEffect } from "react";
import { X, Upload, Eye } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {campaign ? "Modifier la campagne" : "Nouvelle campagne"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Nom de la campagne */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Nom de la campagne *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Lancement Album - Dreams"
            />
            {errors.name && (
              <span className="mt-1 text-sm text-red-600">{errors.name}</span>
            )}
          </div>

          {/* Sujet de l'email */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Sujet de l'email *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Ex: 🎵 Découvrez le nouvel album de Nova - Dreams"
            />
            {errors.subject && (
              <span className="mt-1 text-sm text-red-600">{errors.subject}</span>
            )}
          </div>

          {/* Type et Priorité - Mobile: Stack, Desktop: Side by side */}
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type de campagne
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Priorité
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Artiste et Projet - Mobile: Stack, Desktop: Side by side */}
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Artiste *
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.artist ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
                placeholder="Nom de l'artiste"
              />
              {errors.artist && (
                <span className="mt-1 text-sm text-red-600">{errors.artist}</span>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Projet *
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.project ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.project}
                onChange={(e) => handleChange('project', e.target.value)}
                placeholder="Nom du projet/album/single"
              />
              {errors.project && (
                <span className="mt-1 text-sm text-red-600">{errors.project}</span>
              )}
            </div>
          </div>

          {/* Destinataires et Template - Mobile: Stack, Desktop: Side by side */}
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Nombre de destinataires *
              </label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.recipients_count ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.recipients_count}
                onChange={(e) => handleChange('recipients_count', parseInt(e.target.value) || 0)}
                min="1"
                placeholder="Ex: 250"
              />
              {errors.recipients_count && (
                <span className="mt-1 text-sm text-red-600">{errors.recipients_count}</span>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Contenu de l'email */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Contenu de l'email
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Rédigez le contenu de votre email ici..."
              rows="6"
            />
          </div>

          {/* Pièces jointes */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Pièces jointes
            </label>
            <div className="flex items-center justify-center w-full p-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez vos fichiers ici
                </p>
                <p className="text-xs text-gray-500">
                  ou cliquez pour parcourir
                </p>
              </div>
            </div>
          </div>

          {/* Actions - Mobile responsive */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {campaign ? "Mettre à jour" : "Créer la campagne"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;