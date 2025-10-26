// Utilitaire pour migrer les données localStorage vers l'API

import artistsService from '../services/artistsApi';
import projectsService from '../services/projectsApi';
import campaignsService from '../services/campaignsApi';

export const migrationHelper = {
  // Migrer tous les artistes du localStorage vers l'API
  async migrateArtistsToAPI() {
    try {
      console.log('🔄 Début migration des artistes...');

      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');

      if (localArtists.length === 0) {
        console.log('❌ Aucun artiste trouvé dans localStorage');
        alert('Aucun artiste trouvé à migrer.');
        return [];
      }

      console.log(`📦 ${localArtists.length} artistes trouvés localement:`, localArtists.map(a => a.name));

      const migratedArtists = [];
      let errors = [];

      for (const artist of localArtists) {
        try {
          console.log(`⬆️ Migration de: ${artist.name}`);

          // Nettoyer les données pour l'API
          const cleanArtist = {
            name: artist.name,
            genre: artist.genre || '',
            label: artist.label || '',
            biography: artist.biography || '',
            avatar: artist.avatar || '',
            socialLinks: artist.socialLinks || {
              instagram: '',
              spotify: '',
              youtube: ''
            },
            epk: artist.epk || {
              pressPhotos: [],
              biographyFull: '',
              audioSamples: [],
              videos: [],
              pressClippings: []
            },
            odesliLinks: artist.odesliLinks || null
          };

          const migratedArtist = await artistsService.createArtist(cleanArtist);
          migratedArtists.push(migratedArtist);
          console.log(`✅ ${artist.name} migré avec succès`);

        } catch (error) {
          console.error(`❌ Erreur migration ${artist.name}:`, error);
          errors.push({ artist: artist.name, error: error.message });
        }
      }

      if (migratedArtists.length > 0) {
        // Backup et clear localStorage
        localStorage.setItem('presspilot-artists-backup', JSON.stringify(localArtists));
        localStorage.removeItem('presspilot-artists');

        console.log(`✅ Migration terminée: ${migratedArtists.length}/${localArtists.length} artistes migrés`);

        const message = `Migration réussie !\n\n✅ ${migratedArtists.length} artistes migrés vers l'API\n${errors.length > 0 ? `❌ ${errors.length} erreurs` : ''}\n\nVos artistes sont maintenant synchronisés sur tous vos appareils !`;
        alert(message);
      }

      if (errors.length > 0) {
        console.error('❌ Erreurs de migration:', errors);
      }

      return { migrated: migratedArtists, errors };

    } catch (error) {
      console.error('❌ Erreur globale de migration:', error);
      alert('Erreur lors de la migration. Vérifiez votre connexion et réessayez.');
      throw error;
    }
  },

  // Forcer la synchronisation avec l'API
  async forceSyncWithAPI() {
    try {
      console.log('🔄 Synchronisation forcée avec l\'API...');

      // Essayer de charger depuis l'API
      const apiArtists = await artistsService.getArtists();
      console.log('📡 Artistes récupérés depuis l\'API:', apiArtists);

      if (apiArtists.length > 0) {
        // Mettre à jour localStorage avec les données de l'API
        localStorage.setItem('presspilot-artists', JSON.stringify(apiArtists));
        console.log('✅ localStorage mis à jour avec les données API');

        alert(`Synchronisation réussie !\n${apiArtists.length} artistes récupérés depuis l'API.`);

        // Recharger la page pour rafraîchir l'interface
        window.location.reload();
      } else {
        console.log('📭 Aucun artiste trouvé sur l\'API');
        alert('Aucun artiste trouvé sur l\'API. Vous devez d\'abord migrer vos données locales.');
      }

      return apiArtists;

    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);
      alert('Erreur de synchronisation. L\'API n\'est peut-être pas encore configurée.');
      throw error;
    }
  },

  // Vérifier l'état de la synchronisation
  async checkSyncStatus() {
    try {
      const localArtists = JSON.parse(localStorage.getItem('presspilot-artists') || '[]');
      const apiArtists = await artistsService.getArtists();

      const status = {
        localCount: localArtists.length,
        apiCount: apiArtists.length,
        needsMigration: localArtists.length > 0 && apiArtists.length === 0,
        isSync: localArtists.length === apiArtists.length
      };

      console.log('📊 État de synchronisation:', status);

      if (status.needsMigration) {
        console.log('⚠️ Migration nécessaire: données locales présentes mais API vide');
      }

      return status;

    } catch (error) {
      console.error('❌ Erreur vérification sync:', error);
      return { error: error.message };
    }
  },

  // Reset complet pour debug
  async resetAndStart() {
    if (confirm('⚠️ ATTENTION: Cela va supprimer toutes les données locales. Continuer ?')) {
      localStorage.removeItem('presspilot-artists');
      localStorage.removeItem('presspilot-projects');
      localStorage.removeItem('presspilot-campaigns');

      console.log('🗑️ Données locales supprimées');
      alert('Reset effectué. Rechargement de la page...');
      window.location.reload();
    }
  }
};

// Exposer les fonctions globalement pour debug
if (typeof window !== 'undefined') {
  window.migrationHelper = migrationHelper;
  window.migrateToAPI = migrationHelper.migrateArtistsToAPI;
  window.forceSyncAPI = migrationHelper.forceSyncWithAPI;
  window.checkSync = migrationHelper.checkSyncStatus;

  console.log('🔧 Utilitaires de migration disponibles:');
  console.log('  - window.migrateToAPI() : Migrer localStorage vers API');
  console.log('  - window.forceSyncAPI() : Forcer sync depuis API');
  console.log('  - window.checkSync() : Vérifier état sync');
  console.log('  - window.migrationHelper.resetAndStart() : Reset complet');
}