/**
 * SCRIPT DE CRÉATION D'ARTISTE ET PROJET
 * Crée Denis ADAM et ses projets pour les campagnes
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Artist = require('./models/Artist');
const Project = require('./models/Project');
const Campaign = require('./models/Campaign');
const Contact = require('./models/Contact');
require('dotenv').config();

async function createArtistAndProject() {
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

    // 1. Créer l'artiste Denis ADAM
    console.log('\n🎤 Création de l\'artiste Denis ADAM...');

    let artist = await Artist.findOne({ name: 'Denis ADAM', createdBy: admin._id });

    if (!artist) {
      artist = new Artist({
        name: 'Denis ADAM',
        genre: 'Électro/Pop',
        description: 'Artiste électro français, producteur et compositeur spécialisé dans la musique électronique moderne avec des influences pop.',
        socialLinks: {
          spotify: 'https://open.spotify.com/artist/denisadam',
          instagram: 'https://instagram.com/denisadam_music',
          youtube: 'https://youtube.com/denisadam'
        },
        contact: {
          email: 'contact@denisadam.fr',
          website: 'https://denisadam.fr'
        },
        createdBy: admin._id
      });
      await artist.save();
      console.log('✅ Artiste Denis ADAM créé');
    } else {
      console.log('✅ Artiste Denis ADAM trouvé');
    }

    // 2. Créer les projets
    console.log('\n🎼 Création des projets...');

    const projects = [
      {
        name: 'Neon Dreams',
        type: 'single',
        description: 'Single électro pop énergique avec des synthés modernes et une mélodie accrocheuse',
        releaseDate: new Date('2024-02-15'),
        status: 'released',
        tracks: [
          { title: 'Neon Dreams', duration: '3:42' }
        ],
        distributionLinks: {
          spotify: 'https://open.spotify.com/track/neondreams',
          appleMusic: 'https://music.apple.com/track/neondreams'
        },
        artistId: artist._id,
        createdBy: admin._id
      },
      {
        name: 'Digital Horizons',
        type: 'album',
        description: 'Album complet explorant les thèmes de la technologie et de l\'avenir',
        releaseDate: new Date('2024-03-01'),
        status: 'ready',
        tracks: [
          { title: 'Digital Dawn', duration: '4:12' },
          { title: 'Neon Dreams', duration: '3:42' },
          { title: 'Cyber Love', duration: '3:58' },
          { title: 'Future Pulse', duration: '4:25' },
          { title: 'Virtual Reality', duration: '3:33' },
          { title: 'Binary Soul', duration: '4:07' },
          { title: 'Electric Dreams', duration: '3:51' },
          { title: 'Digital Horizons', duration: '5:22' }
        ],
        artistId: artist._id,
        createdBy: admin._id
      },
      {
        name: 'Tournée Printemps 2024',
        type: 'tour',
        description: 'Tournée française de Denis ADAM pour présenter Digital Horizons',
        releaseDate: new Date('2024-03-15'),
        status: 'ready',
        artistId: artist._id,
        createdBy: admin._id
      }
    ];

    for (const projectData of projects) {
      let project = await Project.findOne({
        name: projectData.name,
        artistId: artist._id
      });

      if (!project) {
        project = new Project(projectData);
        await project.save();
        console.log(`✅ Projet "${projectData.name}" créé`);
      } else {
        console.log(`✅ Projet "${projectData.name}" trouvé`);
      }
    }

    // 3. Créer des campagnes de test avec l'API
    console.log('\n📧 Création des campagnes...');

    const contacts = await Contact.find({ createdBy: admin._id });
    const contactIds = contacts.map(c => c._id);

    const denisAdamProjects = await Project.find({ artistId: artist._id });

    const campaigns = [
      {
        name: 'Single "Neon Dreams" - Denis ADAM',
        subject: '🎵 Nouveau single de Denis ADAM - "Neon Dreams"',
        content: `Bonjour,

J'ai le plaisir de vous présenter le nouveau single de Denis ADAM : "Neon Dreams".

Ce titre électro pop énergique marque le retour de l'artiste avec une production moderne et une mélodie accrocheuse qui ne vous laissera pas indifférent.

🎧 Écouter "Neon Dreams" :
• Spotify : https://open.spotify.com/track/neondreams
• Apple Music : https://music.apple.com/track/neondreams

Denis ADAM est disponible pour des interviews et présences médias.

Cordialement,
L'équipe PressPilot`,
        recipients: contactIds.slice(0, 3),
        artistId: artist._id,
        projectId: denisAdamProjects.find(p => p.name === 'Neon Dreams')?._id,
        status: 'draft',
        createdBy: admin._id,
        template: 'press-release',
        branding: {
          companyName: 'PressPilot Records',
          primaryColor: '#0ED894'
        },
        variables: {
          artistName: 'Denis ADAM',
          projectTitle: 'Neon Dreams',
          releaseDate: '15 février 2024',
          genre: 'Électro/Pop'
        }
      },
      {
        name: 'Album "Digital Horizons" - Denis ADAM',
        subject: '🎼 Nouvel album Denis ADAM - "Digital Horizons" disponible !',
        content: `Bonjour,

Denis ADAM dévoile son nouvel album "Digital Horizons", une œuvre complète qui explore les thèmes de la technologie et de l'avenir.

Avec 8 titres incluant le single à succès "Neon Dreams", cet album confirme la place de Denis ADAM sur la scène électronique française.

🎧 Écouter l'album complet sur toutes les plateformes

Denis ADAM est disponible pour des interviews et chroniques.

Cordialement,
L'équipe PressPilot`,
        recipients: contactIds,
        artistId: artist._id,
        projectId: denisAdamProjects.find(p => p.name === 'Digital Horizons')?._id,
        status: 'draft',
        createdBy: admin._id,
        template: 'album-announcement',
        branding: {
          companyName: 'PressPilot Records',
          primaryColor: '#0ED894'
        },
        variables: {
          artistName: 'Denis ADAM',
          projectTitle: 'Digital Horizons',
          releaseDate: '1er mars 2024',
          trackCount: '8 titres'
        }
      }
    ];

    // Supprimer les anciennes campagnes et en créer de nouvelles
    await Campaign.deleteMany({ createdBy: admin._id });

    for (const campaignData of campaigns) {
      if (campaignData.projectId) { // Seulement si le projet existe
        const campaign = new Campaign(campaignData);
        await campaign.save();
        console.log(`✅ Campagne "${campaignData.name}" créée`);
      }
    }

    // 4. Afficher un résumé
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES :');
    console.log('   👤 Utilisateur admin: admin@presspilot.fr');
    console.log(`   🎤 Artiste: ${artist.name}`);
    console.log(`   🎼 Projets: ${denisAdamProjects.length}`);
    console.log(`   📧 Campagnes: ${campaigns.length}`);
    console.log(`   📇 Contacts: ${contacts.length}`);

    console.log('\n🎯 ARTISTE ET PROJETS :');
    console.log(`   🎤 ${artist.name} (${artist.genre})`);
    denisAdamProjects.forEach((project) => {
      console.log(`   🎼 ${project.name} (${project.type}) - ${project.status}`);
    });

    console.log('\n✅ Données complètes créées avec succès !');
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
createArtistAndProject();