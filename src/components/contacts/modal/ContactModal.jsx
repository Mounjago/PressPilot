/**
 * CONTACT MODAL COMPONENT
 * Modal for creating and editing contacts
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Building, MapPin, FileText, Tag } from 'lucide-react';
import './ContactModal.css';

const ContactModal = ({
  isOpen,
  contact = null, // null for create, contact object for edit
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    mediaType: 'web',
    notes: '',
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media type options
  const mediaTypeOptions = [
    { value: 'web', label: 'Web' },
    { value: 'journal', label: 'Journal' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'radio', label: 'Radio' },
    { value: 'tv', label: 'TV' },
    { value: 'blog', label: 'Blog' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'influencer', label: 'Influenceur' },
    { value: 'autre', label: 'Autre' }
  ];

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      // Edit mode
      setFormData({
        name: getContactName(contact),
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || contact.media?.name || '',
        jobTitle: contact.jobTitle || contact.title || '',
        mediaType: contact.media?.type || contact.mediaType || 'web',
        notes: contact.notes || '',
        tags: contact.tags || []
      });
    } else {
      // Create mode
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        mediaType: 'web',
        notes: '',
        tags: []
      });
    }
    setErrors({});
  }, [contact, isOpen]);

  const getContactName = (contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.name || '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleTagsChange = (tagsString) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    handleInputChange('tags', tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      const contactData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        media: {
          name: formData.company,
          type: formData.mediaType
        },
        notes: formData.notes,
        tags: formData.tags
      };

      // Add id for edit mode
      if (contact) {
        contactData.id = contact.id;
      }

      await onSave(contactData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({
        submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="contact-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="contact-modal-header">
            <h2>
              {contact ? 'Modifier le contact' : 'Nouveau contact'}
            </h2>
            <button
              className="contact-modal-close"
              onClick={onClose}
              type="button"
            >
              <X />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="contact-modal-form">
            <div className="contact-modal-body">
              {/* Name field */}
              <div className="form-group">
                <label htmlFor="name">
                  <User className="form-icon" />
                  Nom complet *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Prénom Nom"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Email field */}
              <div className="form-group">
                <label htmlFor="email">
                  <Mail className="form-icon" />
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemple.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Phone field */}
              <div className="form-group">
                <label htmlFor="phone">
                  <Phone className="form-icon" />
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              {/* Company field */}
              <div className="form-group">
                <label htmlFor="company">
                  <Building className="form-icon" />
                  Média / Entreprise
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Le Monde, Radio France..."
                />
              </div>

              {/* Media type field */}
              <div className="form-group">
                <label htmlFor="mediaType">
                  <MapPin className="form-icon" />
                  Type de média
                </label>
                <select
                  id="mediaType"
                  value={formData.mediaType}
                  onChange={(e) => handleInputChange('mediaType', e.target.value)}
                >
                  {mediaTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job title field */}
              <div className="form-group">
                <label htmlFor="jobTitle">
                  <User className="form-icon" />
                  Fonction
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="Journaliste, Rédacteur en chef..."
                />
              </div>

              {/* Tags field */}
              <div className="form-group">
                <label htmlFor="tags">
                  <Tag className="form-icon" />
                  Tags (séparés par des virgules)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="musique, pop, interview..."
                />
              </div>

              {/* Notes field */}
              <div className="form-group">
                <label htmlFor="notes">
                  <FileText className="form-icon" />
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows="3"
                  placeholder="Informations complémentaires..."
                />
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="error-message submit-error">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="contact-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? 'Sauvegarde...' : (contact ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ContactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  contact: PropTypes.object, // null for create mode
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ContactModal;