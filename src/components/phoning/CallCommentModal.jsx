import React, { useState } from 'react';
import { X, MessageSquare, User, Calendar, Star } from 'lucide-react';
import '../../styles/Dashboard.css';

const CallCommentModal = ({ callData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    comments: '',
    outcome: '',
    followUpDate: '',
    followUpNotes: '',
    journalistFeedback: {
      mediaInterest: '',
      preferredFormat: '',
      deadline: '',
      additionalRequests: ''
    }
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    if (field.startsWith('journalistFeedback.')) {
      const feedbackField = field.replace('journalistFeedback.', '');
      setFormData(prev => ({
        ...prev,
        journalistFeedback: {
          ...prev.journalistFeedback,
          [feedbackField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Supprimer l'erreur si le champ est maintenant rempli
    if (errors[field] && value.trim()) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.comments.trim()) {
      newErrors.comments = 'Les commentaires sont obligatoires';
    }

    if (!formData.outcome) {
      newErrors.outcome = 'Veuillez sélectionner un résultat';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const finalData = {
      ...formData,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : null
    };

    onSave(callData, formData.comments, formData.outcome, formData.journalistFeedback);
  };

  const handleCancel = () => {
    const hasData = formData.comments.trim() || formData.outcome;

    if (hasData) {
      const confirm = window.confirm(
        'Vous avez des données non sauvegardées. Êtes-vous sûr de vouloir annuler ?'
      );
      if (!confirm) return;
    }

    onCancel();
  };

  const getOutcomeOptions = () => [
    { value: 'interested', label: 'Intéressé', description: 'Le journaliste est intéressé par le projet' },
    { value: 'not_interested', label: 'Pas intéressé', description: 'Le journaliste n\'est pas intéressé' },
    { value: 'callback_requested', label: 'Rappel demandé', description: 'Le journaliste demande à être rappelé' },
    { value: 'follow_up_email', label: 'Email de suivi', description: 'Le journaliste préfère recevoir un email' },
    { value: 'no_response', label: 'Aucune réponse', description: 'Aucune réponse claire obtenue' },
    { value: 'wrong_person', label: 'Mauvaise personne', description: 'Ce n\'est pas la bonne personne à contacter' }
  ];

  const getFormatOptions = () => [
    { value: 'interview', label: 'Interview' },
    { value: 'review', label: 'Review/Critique' },
    { value: 'news', label: 'Article news' },
    { value: 'feature', label: 'Article de fond' },
    { value: 'none', label: 'Aucun format spécifique' }
  ];

  const getInterestLevels = () => [
    { value: 'high', label: 'Élevé', color: '#10B981' },
    { value: 'medium', label: 'Moyen', color: '#F59E0B' },
    { value: 'low', label: 'Faible', color: '#EF4444' },
    { value: 'none', label: 'Aucun', color: '#6B7280' }
  ];

  const statusLabels = {
    'answered': 'Répondu',
    'no-answer': 'Pas de réponse',
    'busy': 'Occupé',
    'voicemail': 'Messagerie',
    'failed': 'Échec'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container call-comment-modal">
        <div className="modal-header">
          <div className="modal-title">
            <MessageSquare className="modal-icon" />
            <div>
              <h3>Commentaire d'appel obligatoire</h3>
              <p>Veuillez documenter cet appel avant de continuer</p>
            </div>
          </div>
          <button className="modal-close" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* Résumé de l'appel */}
          <div className="call-summary">
            <div className="summary-header">
              <User className="summary-icon" />
              <div className="summary-info">
                <h4>{callData.contactName}</h4>
                <p>{callData.phoneNumber}</p>
                <p>Statut: <span className={`status-badge status-${callData.status}`}>
                  {statusLabels[callData.status]}
                </span></p>
              </div>
            </div>

            {callData.duration > 0 && (
              <div className="call-duration-info">
                <p>Durée: {Math.floor(callData.duration / 60)}:{(callData.duration % 60).toString().padStart(2, '0')}</p>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="outcome" className="required">
                Résultat de l'appel *
              </label>
              <select
                id="outcome"
                value={formData.outcome}
                onChange={(e) => handleInputChange('outcome', e.target.value)}
                className={errors.outcome ? 'error' : ''}
                required
              >
                <option value="">Sélectionnez un résultat...</option>
                {getOutcomeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.outcome && <span className="error-message">{errors.outcome}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="comments" className="required">
                Commentaires détaillés *
              </label>
              <textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Décrivez le déroulement de l'appel, les réactions du journaliste, les points clés abordés..."
                rows="4"
                className={errors.comments ? 'error' : ''}
                required
              />
              {errors.comments && <span className="error-message">{errors.comments}</span>}
              <small className="form-helper">
                Minimum 10 caractères - Soyez précis pour le suivi
              </small>
            </div>

            {/* Section feedback journaliste - seulement si intéressé ou rappel demandé */}
            {(formData.outcome === 'interested' || formData.outcome === 'callback_requested') && (
              <div className="journalist-feedback-section">
                <h4>Feedback du journaliste</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="mediaInterest">
                      <Star className="label-icon" />
                      Niveau d'intérêt
                    </label>
                    <select
                      id="mediaInterest"
                      value={formData.journalistFeedback.mediaInterest}
                      onChange={(e) => handleInputChange('journalistFeedback.mediaInterest', e.target.value)}
                    >
                      <option value="">Non précisé</option>
                      {getInterestLevels().map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="preferredFormat">Format préféré</label>
                    <select
                      id="preferredFormat"
                      value={formData.journalistFeedback.preferredFormat}
                      onChange={(e) => handleInputChange('journalistFeedback.preferredFormat', e.target.value)}
                    >
                      <option value="">Non précisé</option>
                      {getFormatOptions().map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">
                    <Calendar className="label-icon" />
                    Deadline mentionnée
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={formData.journalistFeedback.deadline}
                    onChange={(e) => handleInputChange('journalistFeedback.deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="additionalRequests">Demandes supplémentaires</label>
                  <textarea
                    id="additionalRequests"
                    value={formData.journalistFeedback.additionalRequests}
                    onChange={(e) => handleInputChange('journalistFeedback.additionalRequests', e.target.value)}
                    placeholder="Photos spécifiques, informations complémentaires, contacts particuliers..."
                    rows="2"
                  />
                </div>
              </div>
            )}

            {/* Section suivi */}
            {formData.outcome === 'callback_requested' && (
              <div className="follow-up-section">
                <h4>Suivi nécessaire</h4>

                <div className="form-group">
                  <label htmlFor="followUpDate">Date de rappel</label>
                  <input
                    type="date"
                    id="followUpDate"
                    value={formData.followUpDate}
                    onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="followUpNotes">Notes pour le suivi</label>
                  <textarea
                    id="followUpNotes"
                    value={formData.followUpNotes}
                    onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                    placeholder="Informations importantes pour le rappel..."
                    rows="2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleCancel}>
            Annuler
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!formData.comments.trim() || !formData.outcome}
          >
            Sauvegarder l'appel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallCommentModal;