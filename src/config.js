// src/config.js
const config = {
  // API et endpoints
  apiUrl: import.meta.env.VITE_API_URL || '',
  
  // Auth
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
  
  // Autres configurations
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  
  // Helpers
  isDevelopment: import.meta.env.DEV === true,
  isProduction: import.meta.env.PROD === true,
  
  // Validation
  isConfigValid: function() {
    const issues = [];
    
    if (!this.googleClientId) issues.push("VITE_GOOGLE_CLIENT_ID manquant");
    if (!this.facebookAppId) issues.push("VITE_FACEBOOK_APP_ID manquant");
    if (!this.apiUrl) issues.push("VITE_API_URL manquant");
    
    if (issues.length > 0) {
      console.warn("Problèmes de configuration détectés:", issues);
      return false;
    }
    
    return true;
  },
  
  // Logging de la configuration (sans les secrets)
  logConfig: function() {
    console.log("Configuration de l'application:", {
      apiUrl: this.apiUrl,
      googleClientId: this.googleClientId ? "Défini" : "Non défini",
      facebookAppId: this.facebookAppId ? "Défini" : "Non défini",
      environment: this.isProduction ? "production" : "développement"
    });
  }
};

// Only log configuration in development mode
if (import.meta.env.DEV) {
  config.logConfig();
}

export default config;
