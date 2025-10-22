/**
 * CRÉATION D'UTILISATEUR ADMIN
 * Script pour créer un compte administrateur
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/presspilot_dev');
    console.log('📊 Connexion à MongoDB réussie');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findByEmail('admin@presspilot.fr');

    if (existingAdmin) {
      console.log('⚠️  L\'utilisateur admin@presspilot.fr existe déjà');

      // Mettre à jour le mot de passe
      existingAdmin.password = 'admin123';
      existingAdmin.role = 'admin';
      existingAdmin.emailVerified = true;
      await existingAdmin.save();

      console.log('✅ Mot de passe admin mis à jour');
    } else {
      // Créer le nouvel admin
      const admin = new User({
        name: 'Administrateur PressPilot',
        email: 'admin@presspilot.fr',
        password: 'admin123',
        company: 'PressPilot',
        role: 'admin',
        emailVerified: true,
        isActive: true
      });

      await admin.save();
      console.log('✅ Utilisateur admin créé avec succès');
    }

    // Afficher les détails
    const adminUser = await User.findByEmail('admin@presspilot.fr');
    console.log('\n👤 Détails de l\'admin :');
    console.log('   Email:', adminUser.email);
    console.log('   Nom:', adminUser.name);
    console.log('   Rôle:', adminUser.role);
    console.log('   Actif:', adminUser.isActive);
    console.log('   Vérifié:', adminUser.emailVerified);

    console.log('\n🔑 Vous pouvez maintenant vous connecter avec :');
    console.log('   Email: admin@presspilot.fr');
    console.log('   Mot de passe: admin123');

    await mongoose.disconnect();
    console.log('\n✅ Script terminé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
createAdmin();