/**
 * CREATION D'UTILISATEUR ADMIN
 * Script pour creer un compte administrateur avec mot de passe securise
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Validate required env vars
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('your_')) {
      console.error('FATAL: MONGODB_URI must be configured in .env');
      process.exit(1);
    }

    // Connexion a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion a MongoDB reussie');

    // Generate a secure random password that meets validation rules
    // Must have: uppercase, lowercase, digit, special char, min 12 chars
    const randomPart = crypto.randomBytes(12).toString('hex').slice(0, 16);
    const generatedPassword = 'Pp!' + randomPart + 'Z9';

    // Parametres configurables via env ou arguments
    const email = process.env.ADMIN_EMAIL || 'admin@presspilot.fr';
    const name = process.env.ADMIN_NAME || 'Super Admin PressPilot';
    const role = process.env.ADMIN_ROLE || 'super_admin';
    const interfaces = role === 'super_admin' || role === 'admin' ? ['press', 'rp'] : ['press'];

    // Verifier si l'admin existe deja
    const existingAdmin = await User.findByEmail(email);

    if (existingAdmin) {
      console.log('L\'utilisateur ' + email + ' existe deja');

      // Mettre a jour le mot de passe et le role
      existingAdmin.password = generatedPassword;
      existingAdmin.role = role;
      existingAdmin.interfaces = interfaces;
      existingAdmin.emailVerified = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();

      console.log('Utilisateur mis a jour avec role: ' + role);
    } else {
      // Creer le nouvel admin
      const admin = new User({
        name: name,
        email: email,
        password: generatedPassword,
        company: 'PressPilot',
        role: role,
        interfaces: interfaces,
        organizationId: null,
        emailVerified: true,
        isActive: true
      });

      await admin.save();
      console.log('Utilisateur ' + role + ' cree avec succes');
    }

    // Afficher les details
    console.log('\nDetails du compte :');
    console.log('   Email: ' + email);
    console.log('   Role: ' + role);
    console.log('   Interfaces: ' + interfaces.join(', '));
    console.log('   Mot de passe genere: ' + generatedPassword);
    console.log('\n   IMPORTANT: Notez ce mot de passe maintenant, il ne sera plus affiche.');
    console.log('   Changez-le immediatement apres votre premiere connexion.');

    await mongoose.disconnect();
    console.log('\nScript termine');

  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Executer le script
createAdmin();
