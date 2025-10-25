/**
 * Script de test de connexion MongoDB Atlas
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
  console.log('🔄 Test de connexion MongoDB Atlas...');

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI non défini dans les variables d\'environnement');
    process.exit(1);
  }

  console.log('🔗 URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

  try {
    // Connexion avec options recommandées
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 secondes timeout
      maxPoolSize: 10
    });

    console.log('✅ Connexion MongoDB réussie !');

    // Test des informations de connexion
    const db = mongoose.connection.db;
    const admin = db.admin();

    console.log('\n📊 Informations MongoDB :');

    // Nom de la base
    console.log('🏷️  Base de données :', db.databaseName);

    // Statut
    const status = await admin.ping();
    console.log('📡 Ping :', status);

    // Statistiques
    const stats = await db.stats();
    console.log('📈 Collections :', stats.collections);
    console.log('💾 Taille données :', Math.round(stats.dataSize / 1024), 'KB');
    console.log('🗂️  Taille index :', Math.round(stats.indexSize / 1024), 'KB');

    // Lister les collections existantes
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections existantes :');
    collections.forEach(col => {
      console.log('  •', col.name);
    });

    // Test de création d'un document de test
    console.log('\n🧪 Test d\'écriture...');
    const TestModel = mongoose.model('Test', {
      message: String,
      timestamp: { type: Date, default: Date.now }
    });

    const testDoc = new TestModel({
      message: 'Test de connexion MongoDB Atlas'
    });

    await testDoc.save();
    console.log('✅ Document de test créé :', testDoc._id);

    // Nettoyage
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Document de test supprimé');

    console.log('\n🎉 Connexion MongoDB Atlas entièrement fonctionnelle !');

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB :', error.message);

    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Solutions possibles :');
      console.log('  • Vérifier username/password');
      console.log('  • Vérifier la création de l\'utilisateur dans Atlas');
      console.log('  • Vérifier les permissions de l\'utilisateur');
    }

    if (error.message.includes('network')) {
      console.log('\n💡 Solutions possibles :');
      console.log('  • Vérifier la configuration Network Access dans Atlas');
      console.log('  • Ajouter 0.0.0.0/0 dans les IP autorisées');
      console.log('  • Vérifier la connection internet');
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le test
testMongoConnection();