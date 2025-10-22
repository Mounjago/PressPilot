/**
 * SCRIPT SIMPLE DE DONNÉES DE TEST
 * Crée seulement des contacts pour tester l'interface
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Contact = require('./models/Contact');
require('dotenv').config();

async function createSimpleTestData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/presspilot_dev');
    console.log('📊 Connexion à MongoDB réussie');

    // Récupérer l'utilisateur admin
    const admin = await User.findByEmail('admin@presspilot.fr');
    if (!admin) {
      console.log('❌ Utilisateur admin non trouvé. Exécutez d\'abord create-admin.js');
      return;
    }

    // Créer des contacts de test
    console.log('\n📇 Création des contacts de test...');

    const contacts = [
      {
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@lefigaro.fr',
        phone: '+33 1 23 45 67 89',
        jobTitle: 'Journaliste Musique',
        media: {
          name: 'Le Figaro',
          type: 'journal',
          reach: 'national'
        },
        location: {
          city: 'Paris',
          country: 'France'
        },
        specializations: ['pop', 'electro'],
        interests: ['nouveautes', 'interviews'],
        status: 'active',
        createdBy: admin._id,
        source: 'manual'
      },
      {
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'p.martin@radionova.com',
        phone: '+33 1 98 76 54 32',
        jobTitle: 'Programmateur Musical',
        media: {
          name: 'Radio Nova',
          type: 'radio',
          reach: 'national'
        },
        location: {
          city: 'Paris',
          country: 'France'
        },
        specializations: ['alternative', 'indie'],
        interests: ['decouvertes', 'playlists'],
        status: 'active',
        createdBy: admin._id,
        source: 'manual'
      },
      {
        firstName: 'Sophie',
        lastName: 'Leroux',
        email: 'sophie.leroux@lesinrocks.com',
        phone: '+33 6 12 34 56 78',
        jobTitle: 'Critique Musicale',
        media: {
          name: 'Les Inrockuptibles',
          type: 'magazine',
          reach: 'national'
        },
        location: {
          city: 'Lyon',
          country: 'France'
        },
        specializations: ['rock', 'indie'],
        interests: ['critiques', 'interviews'],
        status: 'active',
        createdBy: admin._id,
        source: 'manual'
      },
      {
        firstName: 'Thomas',
        lastName: 'Bernard',
        email: 'thomas@festivals-united.com',
        phone: '+33 4 56 78 90 12',
        jobTitle: 'Booker Festivals',
        media: {
          name: 'Festivals United',
          type: 'autre',
          reach: 'national'
        },
        location: {
          city: 'Marseille',
          country: 'France'
        },
        specializations: ['electro', 'pop'],
        interests: ['festivals', 'decouvertes'],
        status: 'active',
        createdBy: admin._id,
        source: 'manual'
      },
      {
        firstName: 'Julie',
        lastName: 'Moreau',
        email: 'julie@radiocampus.fr',
        phone: '+33 2 34 56 78 90',
        jobTitle: 'Animatrice',
        media: {
          name: 'Radio Campus',
          type: 'radio',
          reach: 'regional'
        },
        location: {
          city: 'Nantes',
          country: 'France'
        },
        specializations: ['indie', 'alternative'],
        interests: ['nouveautes', 'interviews'],
        status: 'active',
        createdBy: admin._id,
        source: 'import'
      }
    ];

    // Supprimer les anciens contacts et en créer de nouveaux
    await Contact.deleteMany({ createdBy: admin._id });
    const createdContacts = await Contact.insertMany(contacts);
    console.log(`✅ ${createdContacts.length} contacts créés`);

    // Afficher un résumé
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES :');
    console.log('   👤 Utilisateur admin: admin@presspilot.fr');
    console.log(`   📇 Contacts: ${createdContacts.length}`);

    console.log('\n📇 CONTACTS CRÉÉS :');
    createdContacts.forEach((contact, index) => {
      console.log(`   ${index + 1}. ${contact.firstName} ${contact.lastName} (${contact.media.name})`);
    });

    console.log('\n✅ Données de test créées avec succès !');
    console.log('   🔗 Frontend: http://localhost:5176');
    console.log('   🔗 Backend: http://localhost:3002');
    console.log('   📧 Login: admin@presspilot.fr / admin123');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
createSimpleTestData();