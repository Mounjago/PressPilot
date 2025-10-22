/**
 * SCRIPT DE DONNÉES DE TEST
 * Crée des artistes, projets et campagnes de test pour PressPilot
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Campaign = require('./models/Campaign');
const Contact = require('./models/Contact');
require('dotenv').config();

async function seedTestData() {
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

    // 1. Créer des contacts de test
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
      }
    ];

    // Supprimer les anciens contacts et en créer de nouveaux
    await Contact.deleteMany({ createdBy: admin._id });
    const createdContacts = await Contact.insertMany(contacts);
    console.log(`✅ ${createdContacts.length} contacts créés`);

    // 2. Créer des campagnes de test
    console.log('\n📧 Création des campagnes de test...');

    const campaigns = [
      {
        name: 'Single "Neon Dreams" - Denis ADAM',
        artist: 'Denis ADAM',
        project: 'Neon Dreams',
        projectType: 'single',
        description: 'Promotion du nouveau single électro de Denis ADAM',
        template: 'press-release',
        subject: '🎵 Nouveau single de Denis ADAM - "Neon Dreams"',
        branding: {
          companyName: 'PressPilot Records',
          primaryColor: '#0ED894',
          backgroundColor: '#000000'
        },
        variables: {
          artistName: 'Denis ADAM',
          projectTitle: 'Neon Dreams',
          releaseDate: '2024-02-15',
          genre: 'Électro/Pop',
          label: 'PressPilot Records',
          streamingLinks: 'https://linktr.ee/denisadam'
        },
        recipients: createdContacts.slice(0, 2).map(c => c._id),
        status: 'draft',
        userId: admin._id,
        analytics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0
        }
      },
      {
        name: 'Album "Digital Horizons" - Denis ADAM',
        artist: 'Denis ADAM',
        project: 'Digital Horizons',
        projectType: 'album',
        description: 'Campagne de presse pour le nouvel album de Denis ADAM',
        template: 'album-announcement',
        subject: '🎼 Nouvel album Denis ADAM - "Digital Horizons" disponible !',
        branding: {
          companyName: 'PressPilot Records',
          primaryColor: '#0ED894',
          backgroundColor: '#000000'
        },
        variables: {
          artistName: 'Denis ADAM',
          projectTitle: 'Digital Horizons',
          releaseDate: '2024-03-01',
          genre: 'Électro/Ambient',
          label: 'PressPilot Records',
          trackCount: '12 titres',
          streamingLinks: 'https://linktr.ee/denisadam'
        },
        recipients: createdContacts.map(c => c._id),
        status: 'draft',
        userId: admin._id,
        analytics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0
        }
      },
      {
        name: 'Tournée 2024 - Denis ADAM',
        artist: 'Denis ADAM',
        project: 'Tournée Printemps 2024',
        projectType: 'tour',
        description: 'Annonce de la tournée française de Denis ADAM',
        template: 'tour-announcement',
        subject: '🎤 Denis ADAM en tournée - Dates françaises annoncées',
        branding: {
          companyName: 'PressPilot Records',
          primaryColor: '#0ED894',
          backgroundColor: '#000000'
        },
        variables: {
          artistName: 'Denis ADAM',
          projectTitle: 'Tournée Printemps 2024',
          tourDates: 'Mars-Mai 2024',
          cities: 'Paris, Lyon, Marseille, Bordeaux',
          ticketing: 'Disponible sur Fnac Spectacles'
        },
        recipients: createdContacts.map(c => c._id),
        status: 'sent',
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
        userId: admin._id,
        analytics: {
          sent: 3,
          delivered: 3,
          opened: 2,
          clicked: 1,
          replied: 1,
          bounced: 0
        }
      }
    ];

    // Supprimer les anciennes campagnes et en créer de nouvelles
    await Campaign.deleteMany({ userId: admin._id });
    const createdCampaigns = await Campaign.insertMany(campaigns);
    console.log(`✅ ${createdCampaigns.length} campagnes créées`);

    // 3. Afficher un résumé
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES :');
    console.log('   👤 Utilisateur admin: admin@presspilot.fr');
    console.log(`   📇 Contacts: ${createdContacts.length}`);
    console.log(`   📧 Campagnes: ${createdCampaigns.length}`);

    console.log('\n🎯 CAMPAGNES CRÉÉES :');
    createdCampaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. ${campaign.name} (${campaign.status})`);
    });

    console.log('\n✅ Interface PressPilot prête à utiliser !');
    console.log('   🔗 Frontend: http://localhost:5176');
    console.log('   🔗 Backend: http://localhost:3002');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
seedTestData();