import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-bandstream.png';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    acceptTerms: false
  });
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Nettoyer les erreurs au démontage
  useEffect(() => {
    return () => {
      clearError();
      setValidationError('');
    };
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setValidationError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (formData.password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    // Vérification plus stricte du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (!formData.acceptTerms) {
      setValidationError('Veuillez accepter les conditions d\'utilisation');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!validateForm()) {
      return;
    }

    const userData = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim(),
      password: formData.password,
      company: formData.company.trim() || undefined
    };

    const result = await register(userData);

    if (result.success) {
      navigate('/dashboard');
    }
    // Les erreurs sont gérées automatiquement par le contexte
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <Link to="/" className="header-link">
          <span className="back-arrow">←</span> Retour à l'accueil
        </Link>
      </header>

      <div className="register-container">
        <div className="register-card">
          <div className="register-logo-container">
            <img src={logo} alt="PressPilot" className="register-logo" />
          </div>

          <h1 className="register-title">Créer votre compte PressPilot</h1>
          <p className="register-subtitle">Commencez à gérer vos relations presse efficacement</p>

          {(error || validationError) && (
            <div className="error-message">
              {error || validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Jean"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email professionnel *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="jean.dupont@entreprise.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="company" className="form-label">
                Entreprise / Organisation
              </label>
              <input
                id="company"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="form-input"
                placeholder="Nom de votre entreprise"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
                <span className="form-hint">Minimum 8 caractères</span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmer le mot de passe *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="form-checkbox">
              <input
                id="acceptTerms"
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="checkbox-input"
                required
              />
              <label htmlFor="acceptTerms" className="checkbox-label">
                J'accepte les{' '}
                <Link to="/terms" className="link-terms">conditions d'utilisation</Link>
                {' '}et la{' '}
                <Link to="/privacy" className="link-terms">politique de confidentialité</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.acceptTerms}
              className="submit-button"
            >
              {isLoading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="divider">
            <span>ou</span>
          </div>

          <button className="google-button">
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            S'inscrire avec Google
          </button>

          <div className="login-link">
            <p>
              Déjà un compte ?
              <Link to="/login" className="login-cta">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="register-footer">
        <p>© 2025 Bandstream. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default Register;