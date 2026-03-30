import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-presspilot.png';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
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
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validation côté client
    if (!email || !password) {
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    }
    // Les erreurs sont gérées automatiquement par le contexte
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="header-link">
          <span className="back-arrow">←</span> Retour à l'accueil
        </Link>
      </header>

      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-container">
            <img src={logo} alt="PressPilot" className="login-logo" />
          </div>

          <h1 className="login-title">Connexion à PressPilot</h1>
          <p className="login-subtitle">Accédez à votre espace de gestion des relations presse</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email professionnel
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-actions">
              <Link to="/forgot-password" className="forgot-link">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="submit-button"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
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
            Continuer avec Google
          </button>

          <div className="register-link">
            <p>
              Nouveau sur PressPilot ?
              <Link to="/register" className="register-cta">
                Créer un compte gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <p>© 2025 Bandstream. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default Login;