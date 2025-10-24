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

// Fonction à appeler depuis la console du navigateur
window.resetPressPilotData = resetAllData;
window.clearPressPilotStorage = clearLocalStorage;

console.log('🔧 Utilitaires de réinitialisation chargés:');
console.log('  - window.resetPressPilotData() : Réinitialise tout');
console.log('  - window.clearPressPilotStorage() : Vide le localStorage');