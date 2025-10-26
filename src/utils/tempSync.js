// Solution temporaire pour synchroniser LesJack entre appareils

export const tempSync = {
  // Exporter LesJack depuis votre ordinateur
  exportLesJack() {
    try {
      const artists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const lesJack = artists.find(artist =>
        artist.name.toLowerCase().includes('lesjack') ||
        artist.name.toLowerCase().includes('les jack')
      );

      if (!lesJack) {
        alert('LesJack introuvable dans les données locales.');
        return null;
      }

      // Créer un code de transfert
      const transferCode = btoa(JSON.stringify({
        artist: lesJack,
        timestamp: Date.now(),
        from: 'desktop'
      }));

      // Afficher le code pour transfert manual
      const codeDiv = document.createElement('div');
      codeDiv.innerHTML = `
        <div style="
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000; max-width: 500px; text-align: center;
        ">
          <h3 style="margin-bottom: 20px;">📱 Code de transfert LesJack</h3>
          <p style="margin-bottom: 15px;">Copiez ce code et utilisez-le sur votre téléphone :</p>
          <div style="
            background: #f8f9fa; padding: 15px; border-radius: 5px;
            font-family: monospace; word-break: break-all; font-size: 12px;
            margin-bottom: 20px; border: 1px solid #dee2e6;
          ">${transferCode}</div>
          <button onclick="navigator.clipboard.writeText('${transferCode}'); alert('Code copié !');"
                  style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px;">
            📋 Copier le code
          </button>
          <button onclick="this.parentElement.parentElement.remove();"
                  style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px;">
            Fermer
          </button>
        </div>
      `;

      document.body.appendChild(codeDiv);

      console.log('📤 LesJack exporté:', lesJack);
      return transferCode;

    } catch (error) {
      console.error('❌ Erreur export LesJack:', error);
      alert('Erreur lors de l\'export de LesJack');
      return null;
    }
  },

  // Importer LesJack sur votre téléphone
  importLesJack() {
    try {
      const code = prompt('📱 Entrez le code de transfert LesJack:');
      if (!code) return null;

      const data = JSON.parse(atob(code));

      if (!data.artist || !data.artist.name) {
        alert('Code invalide.');
        return null;
      }

      // Ajouter LesJack aux artistes locaux
      const artists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');

      // Vérifier s'il existe déjà
      const existingIndex = artists.findIndex(a => a.name === data.artist.name);

      if (existingIndex >= 0) {
        // Mettre à jour
        artists[existingIndex] = data.artist;
        alert('LesJack mis à jour !');
      } else {
        // Ajouter
        artists.push(data.artist);
        alert('LesJack ajouté !');
      }

      localStorage.setItem('presspilot-artists', JSON.stringify(artists));

      console.log('📥 LesJack importé:', data.artist);

      // Recharger la page
      window.location.reload();

      return data.artist;

    } catch (error) {
      console.error('❌ Erreur import LesJack:', error);
      alert('Code invalide ou erreur lors de l\'import');
      return null;
    }
  },

  // Créer LesJack temporairement pour test
  createTempLesJack() {
    try {
      const artists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');

      // Vérifier si LesJack existe déjà
      const existing = artists.find(a => a.name.toLowerCase().includes('lesjack'));
      if (existing) {
        alert('LesJack existe déjà !');
        return existing;
      }

      const lesJack = {
        id: Date.now().toString(),
        name: "LesJack",
        genre: "Pop/Rock",
        label: "Independent",
        biography: "Artiste créé temporairement pour test de synchronisation",
        avatar: "https://via.placeholder.com/60x60/0ED894/FFFFFF?text=LJ",
        projectsCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        socialLinks: {
          instagram: "",
          spotify: "",
          youtube: ""
        },
        epk: {
          pressPhotos: [],
          biographyFull: "",
          audioSamples: [],
          videos: [],
          pressClippings: []
        },
        odesliLinks: null,
        isTemp: true // Marqueur temporaire
      };

      artists.push(lesJack);
      localStorage.setItem('presspilot-artists', JSON.stringify(artists));

      alert('LesJack temporaire créé ! Rechargement...');
      window.location.reload();

      return lesJack;

    } catch (error) {
      console.error('❌ Erreur création LesJack temporaire:', error);
      alert('Erreur lors de la création de LesJack temporaire');
      return null;
    }
  }
};

// Exposer globalement pour debug
if (typeof window !== 'undefined') {
  window.tempSync = tempSync;
  window.exportLesJack = tempSync.exportLesJack;
  window.importLesJack = tempSync.importLesJack;
  window.createTempLesJack = tempSync.createTempLesJack;

  console.log('🔧 Utilitaires de synchronisation temporaire:');
  console.log('  - window.exportLesJack() : Exporter LesJack (ordinateur)');
  console.log('  - window.importLesJack() : Importer LesJack (téléphone)');
  console.log('  - window.createTempLesJack() : Créer LesJack temporaire');
}