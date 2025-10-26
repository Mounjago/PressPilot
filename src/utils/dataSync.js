// Utilitaires pour synchroniser les données entre appareils

// Fonction pour exporter toutes les données localStorage vers un fichier JSON
export const exportLocalData = () => {
  try {
    const data = {};
    const keys = [
      'presspilot-artists',
      'presspilot-projects',
      'presspilot-campaigns',
      'presspilot-contacts'
    ];

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      }
    });

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `presspilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    console.log('✅ Données exportées avec succès');
    alert('Données exportées avec succès ! Transférez le fichier sur votre téléphone.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    alert('Erreur lors de l\'export des données');
  }
};

// Fonction pour importer des données depuis un fichier JSON
export const importLocalData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
          console.log(`✅ Importé: ${key}`);
        }
      });

      alert('Données importées avec succès ! Rechargez la page pour voir les changements.');
      window.location.reload();

    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import : fichier invalide');
    }
  };

  reader.readAsText(file);
};

// Fonction pour synchroniser avec l'API (si disponible)
export const syncWithAPI = async () => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    // Récupérer les artistes du localStorage
    const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');

    if (localArtists.length === 0) {
      console.log('Aucun artiste local à synchroniser');
      return;
    }

    // Envoyer vers l'API (supposé endpoint)
    const response = await fetch('/api/artists/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artists: localArtists })
    });

    if (response.ok) {
      console.log('✅ Données synchronisées avec l\'API');
      localStorage.setItem('presspilot-sync-date', new Date().toISOString());
      alert('Données synchronisées avec succès !');
    } else {
      throw new Error('Erreur de synchronisation');
    }

  } catch (error) {
    console.error('❌ Erreur de synchronisation:', error);
    alert('La synchronisation avec l\'API n\'est pas encore disponible. Utilisez l\'export/import pour le moment.');
  }
};

// Fonction pour récupérer les données depuis l'API
export const loadFromAPI = async () => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch('/api/artists', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const artists = await response.json();
      localStorage.setItem('presspilot-artists', JSON.stringify(artists));
      console.log('✅ Artistes chargés depuis l\'API');
      return artists;
    } else {
      throw new Error('Erreur de chargement');
    }

  } catch (error) {
    console.error('❌ Erreur de chargement API:', error);
    // Fallback vers localStorage
    const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
    return localArtists;
  }
};

// Fonctions exposées globalement pour debug
if (typeof window !== 'undefined') {
  window.exportPressPilotData = exportLocalData;
  window.syncPressPilotData = syncWithAPI;
  window.loadPressPilotData = loadFromAPI;

  console.log('🔧 Utilitaires de synchronisation disponibles:');
  console.log('  - window.exportPressPilotData() : Exporter les données');
  console.log('  - window.syncPressPilotData() : Synchroniser avec l\'API');
  console.log('  - window.loadPressPilotData() : Charger depuis l\'API');
}