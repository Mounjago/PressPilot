/**
 * Utilitaire pour réinitialiser toutes les données de l'application
 */

// Fonction pour vider le localStorage
export const clearLocalStorage = () => {
  console.log('🧹 Nettoyage du localStorage...');

  // Lister toutes les clés PressPilot
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('presspilot-')) {
      keysToRemove.push(key);
    }
  }

  // Supprimer toutes les clés PressPilot
  keysToRemove.forEach(key => {
    console.log(`🗑️ Suppression de la clé: ${key}`);
    localStorage.removeItem(key);
  });

  // Supprimer aussi les autres clés communes
  const commonKeys = [
    'auth-token',
    'user-data',
    'artists',
    'projects',
    'campaigns',
    'contacts'
  ];

  commonKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Suppression de la clé: ${key}`);
      localStorage.removeItem(key);
    }
  });

  console.log('✅ localStorage nettoyé avec succès');
};

// Fonction pour vider le sessionStorage
export const clearSessionStorage = () => {
  console.log('🧹 Nettoyage du sessionStorage...');
  sessionStorage.clear();
  console.log('✅ sessionStorage nettoyé avec succès');
};

// Fonction pour réinitialiser toutes les données
export const resetAllData = () => {
  console.log('🔄 Réinitialisation complète des données...');

  clearLocalStorage();
  clearSessionStorage();

  // Recharger la page pour s'assurer que tous les états sont réinitialisés
  console.log('🔄 Rechargement de la page...');
  window.location.reload();
};

// Fonction pour nettoyer les tokens JWT en conflit
export const cleanupAuthTokens = () => {
  console.log('🔧 Nettoyage des tokens d\'authentification...');

  // Lister tous les tokens potentiels
  const authKeys = ['token', 'authToken', 'auth-token', 'jwt-token', 'user', 'authUser', 'auth-user'];
  let removedCount = 0;

  authKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Suppression du token: ${key}`);
      localStorage.removeItem(key);
      removedCount++;
    }
  });

  if (removedCount > 0) {
    console.log(`✅ ${removedCount} token(s) nettoyé(s)`);
  } else {
    console.log('ℹ️ Aucun token à nettoyer');
  }
};

// Nettoyage automatique au chargement si tokens incohérents
const autoCleanup = () => {
  const oldToken = localStorage.getItem('token');
  const newToken = localStorage.getItem('authToken');

  // Si les deux existent, c'est qu'il y a conflit
  if (oldToken && newToken) {
    console.warn('⚠️ Conflit détecté entre les systèmes de tokens. Nettoyage automatique...');
    cleanupAuthTokens();
  }
  // Si seul l'ancien token existe, le migrer
  else if (oldToken && !newToken) {
    console.log('🔄 Migration de l\'ancien token...');
    cleanupAuthTokens(); // Nettoie tout pour éviter les problèmes
  }
};

// Exécuter le nettoyage automatique
autoCleanup();

// Fonction à appeler depuis la console du navigateur
window.resetPressPilotData = resetAllData;
window.clearPressPilotStorage = clearLocalStorage;
window.cleanupAuthTokens = cleanupAuthTokens;

console.log('🔧 Utilitaires de réinitialisation chargés:');
console.log('  - window.resetPressPilotData() : Réinitialise tout');
console.log('  - window.clearPressPilotStorage() : Vide le localStorage');
console.log('  - window.cleanupAuthTokens() : Nettoie les tokens en conflit');