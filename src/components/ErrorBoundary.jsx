// src/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Mise à jour de l'état pour afficher le fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Vous pouvez aussi enregistrer l'erreur dans un service de reporting
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Une erreur est survenue</h1>
          <details style={{ whiteSpace: 'pre-wrap', margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <summary>Détails de l'erreur</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
