/**
 * Script pour passer du serveur minimal au serveur complet
 */

const fs = require('fs');
const path = require('path');

function switchToFullServer() {
  console.log('🔄 Passage du serveur minimal au serveur complet...');

  const packageJsonPath = path.join(__dirname, 'package.json');

  try {
    // Lire package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    console.log('📦 Package.json actuel :');
    console.log('  Start script :', packageJson.scripts.start);

    // Modifier le script de démarrage
    packageJson.scripts.start = 'node server.js';

    // Sauvegarder
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log('✅ Script de démarrage modifié vers serveur complet');
    console.log('📦 Nouveau start script :', packageJson.scripts.start);

    console.log('\n📋 Prochaines étapes :');
    console.log('1. Vérifier que MONGODB_URI est configuré dans Railway');
    console.log('2. Commit et push les changements :');
    console.log('   git add package.json');
    console.log('   git commit -m "Switch to full server with MongoDB"');
    console.log('   git push origin main');
    console.log('3. Railway va automatiquement redéployer');
    console.log('4. Tester avec : node test-mongodb-connection.js');

  } catch (error) {
    console.error('❌ Erreur lors de la modification :', error.message);
  }
}

function revertToMinimalServer() {
  console.log('🔄 Retour au serveur minimal...');

  const packageJsonPath = path.join(__dirname, 'package.json');

  try {
    // Lire package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    console.log('📦 Package.json actuel :');
    console.log('  Start script :', packageJson.scripts.start);

    // Modifier le script de démarrage
    packageJson.scripts.start = 'node server-minimal.js';

    // Sauvegarder
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log('✅ Script de démarrage modifié vers serveur minimal');
    console.log('📦 Nouveau start script :', packageJson.scripts.start);

  } catch (error) {
    console.error('❌ Erreur lors de la modification :', error.message);
  }
}

// Gestion des arguments
const command = process.argv[2];

if (command === 'full') {
  switchToFullServer();
} else if (command === 'minimal') {
  revertToMinimalServer();
} else {
  console.log('🎯 Script de gestion des serveurs PressPilot');
  console.log('');
  console.log('Usage :');
  console.log('  node switch-to-full-server.js full     # Passer au serveur complet');
  console.log('  node switch-to-full-server.js minimal  # Revenir au serveur minimal');
  console.log('');
  console.log('État actuel :');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const currentScript = packageJson.scripts.start;
    console.log('  Start script :', currentScript);
    if (currentScript.includes('server-minimal.js')) {
      console.log('  🟡 Mode : Serveur minimal (sans MongoDB)');
    } else {
      console.log('  🟢 Mode : Serveur complet (avec MongoDB)');
    }
  } catch (error) {
    console.log('  ❌ Impossible de lire package.json');
  }
}