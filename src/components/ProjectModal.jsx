import React, { useState, useEffect } from "react";
import { X, Upload, Calendar } from "lucide-react";
import "../styles/Projects.css";
import "../styles/Campaigns.css";

const ProjectModal = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    artist: "",
    type: "single",
    status: "upcoming",
    releaseDate: "",
    description: "",
    genre: "",
    label: "",
    tracks: 1,
    budget: 1000,
    cover: null,
    pressKitReady: false,
    socialMediaReady: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        artist: project.artist || "",
        type: project.type || "single",
        status: project.status || "upcoming",
        releaseDate: project.releaseDate || "",
        description: project.description || "",
        genre: project.genre || "",
        label: project.label || "",
        tracks: project.tracks || 1,
        budget: project.budget || 1000,
        cover: project.cover || null,
        pressKitReady: project.pressKitReady || false,
        socialMediaReady: project.socialMediaReady || false
      });
    }
  }, [project]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du projet est requis";
    }

    if (!formData.artist.trim()) {
      newErrors.artist = "L'artiste est requis";
    }

    if (!formData.releaseDate) {
      newErrors.releaseDate = "La date de sortie est requise";
    }

    if (!formData.genre.trim()) {
      newErrors.genre = "Le genre musical est requis";
    }

    if (!formData.label.trim()) {
      newErrors.label = "Le label est requis";
    }

    if (formData.budget <= 0) {
      newErrors.budget = "Le budget doit être supérieur à 0";
    }

    if (formData.tracks <= 0) {
      newErrors.tracks = "Le nombre de titres doit être supérieur à 0";
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

  const projectTypes = [
    { value: "single", label: "Single" },
    { value: "album", label: "Album" },
    { value: "ep", label: "EP" },
    { value: "tour", label: "Tournée" },
    { value: "collaboration", label: "Collaboration" }
  ];

  const statusOptions = [
    { value: "upcoming", label: "À venir" },
    { value: "active", label: "En cours" },
    { value: "completed", label: "Terminé" },
    { value: "paused", label: "En pause" }
  ];

  const musicGenres = [
    "Pop", "Rock", "Electronic", "Hip-Hop", "Jazz", "Classical", "Folk",
    "Country", "R&B", "Reggae", "Metal", "Punk", "Indie", "Alternative",
    "Ambient", "World Music", "Blues", "Funk", "Soul", "Disco"
  ];

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Format date from input
  const formatDateFromInput = (inputDate) => {
    if (!inputDate) return "";
    return new Date(inputDate).toISOString();
  };

  return (
    <div className="project-modal">
      <div className="project-modal-content">
        <div className="project-modal-header">
          <h2 className="project-modal-title">
            {project ? "Modifier le projet" : "Nouveau projet"}
          </h2>
          <button className="project-modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="campaign-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nom du projet *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Dreams Album"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type de projet</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Genre musical *</label>
              <select
                className={`form-select ${errors.genre ? 'error' : ''}`}
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
              >
                <option value="">Sélectionner un genre</option>
                {musicGenres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              {errors.genre && <span className="form-error">{errors.genre}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Label *</label>
              <input
                type="text"
                className={`form-input ${errors.label ? 'error' : ''}`}
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Ex: Indépendant, Universal Music..."
              />
              {errors.label && <span className="form-error">{errors.label}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date de sortie *</label>
              <input
                type="date"
                className={`form-input ${errors.releaseDate ? 'error' : ''}`}
                value={formatDateForInput(formData.releaseDate)}
                onChange={(e) => handleChange('releaseDate', formatDateFromInput(e.target.value))}
              />
              {errors.releaseDate && <span className="form-error">{errors.releaseDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Nombre de titres *</label>
              <input
                type="number"
                className={`form-input ${errors.tracks ? 'error' : ''}`}
                value={formData.tracks}
                onChange={(e) => handleChange('tracks', parseInt(e.target.value) || 1)}
                min="1"
                max="50"
              />
              {errors.tracks && <span className="form-error">{errors.tracks}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Budget (€) *</label>
            <input
              type="number"
              className={`form-input ${errors.budget ? 'error' : ''}`}
              value={formData.budget}
              onChange={(e) => handleChange('budget', parseInt(e.target.value) || 1000)}
              min="100"
              step="100"
              placeholder="Ex: 5000"
            />
            {errors.budget && <span className="form-error">{errors.budget}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description du projet</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez votre projet musical..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Couverture du projet</label>
            <div className="upload-area">
              <div className="upload-placeholder">
                <Upload size={24} />
                <span>Glissez votre couverture ici ou cliquez pour parcourir</span>
                <small>Formats acceptés: JPG, PNG (max 5MB)</small>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Préparation</label>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.pressKitReady}
                  onChange={(e) => handleChange('pressKitReady', e.target.checked)}
                />
                <span>Press Kit prêt</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.socialMediaReady}
                  onChange={(e) => handleChange('socialMediaReady', e.target.checked)}
                />
                <span>Réseaux sociaux prêts</span>
              </label>
            </div>
          </div>

          <div className="campaign-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-save">
              {project ? "Mettre à jour" : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;