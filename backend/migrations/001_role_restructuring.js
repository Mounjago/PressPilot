/**
 * MIGRATION 001 - Restructuration des roles
 *
 * Transforme les anciens roles (user, moderator, admin) vers le nouveau systeme:
 *   user -> press_agent
 *   moderator -> bandstream_rp
 *   admin -> admin (inchange)
 *
 * Ajoute les champs: interfaces, organizationId, _migratedFrom
 * Backup automatique avant migration
 *
 * Usage:
 *   node migrations/001_role_restructuring.js [--dry-run] [--rollback]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const LEGACY_ROLE_MAP = {
  'user': 'press_agent',
  'moderator': 'bandstream_rp',
  'admin': 'admin'
};

const ROLE_INTERFACES = {
  'press_agent': ['press'],
  'bandstream_rp': ['rp'],
  'admin': ['press', 'rp'],
  'super_admin': ['press', 'rp']
};

async function migrate(dryRun = false) {
  console.log('=== Migration 001: Restructuration des roles ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (aucune modification)' : 'EXECUTION'}`);
  console.log('');

  await connectDB();

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // 1. Backup
  if (!dryRun) {
    console.log('1. Creation du backup...');
    const backupName = `users_backup_001_${Date.now()}`;
    const users = await usersCollection.find({}).toArray();
    if (users.length > 0) {
      await db.collection(backupName).insertMany(users);
      console.log(`   Backup cree: ${backupName} (${users.length} documents)`);
    } else {
      console.log('   Aucun utilisateur a migrer.');
      return;
    }
  }

  // 2. Compter les utilisateurs par ancien role
  console.log('');
  console.log('2. Etat actuel des roles:');
  const roleCounts = await usersCollection.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();

  roleCounts.forEach(r => {
    const arrow = LEGACY_ROLE_MAP[r._id] ? ` -> ${LEGACY_ROLE_MAP[r._id]}` : ' (deja migre ou nouveau)';
    console.log(`   ${r._id}: ${r.count} utilisateur(s)${arrow}`);
  });

  // 3. Migrer chaque role
  console.log('');
  console.log('3. Migration des roles...');

  let totalMigrated = 0;

  for (const [oldRole, newRole] of Object.entries(LEGACY_ROLE_MAP)) {
    const filter = { role: oldRole, _migratedFrom: { $exists: false } };
    const count = await usersCollection.countDocuments(filter);

    if (count === 0) {
      console.log(`   ${oldRole} -> ${newRole}: 0 utilisateurs (deja migres ou inexistants)`);
      continue;
    }

    console.log(`   ${oldRole} -> ${newRole}: ${count} utilisateur(s)`);

    if (!dryRun) {
      const result = await usersCollection.updateMany(filter, {
        $set: {
          role: newRole,
          interfaces: ROLE_INTERFACES[newRole],
          _migratedFrom: oldRole
        }
      });
      console.log(`   -> ${result.modifiedCount} document(s) modifie(s)`);
      totalMigrated += result.modifiedCount;
    }
  }

  // 4. Ajouter les champs manquants aux utilisateurs deja migres
  if (!dryRun) {
    console.log('');
    console.log('4. Ajout des interfaces manquantes...');

    for (const [role, interfaces] of Object.entries(ROLE_INTERFACES)) {
      const result = await usersCollection.updateMany(
        { role, interfaces: { $exists: false } },
        { $set: { interfaces } }
      );
      if (result.modifiedCount > 0) {
        console.log(`   ${role}: ${result.modifiedCount} utilisateur(s) mis a jour`);
      }
    }

    // Ajouter organizationId null si manquant
    const orgResult = await usersCollection.updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: null } }
    );
    if (orgResult.modifiedCount > 0) {
      console.log(`   organizationId: ${orgResult.modifiedCount} utilisateur(s) mis a jour`);
    }
  }

  // 5. Verification
  console.log('');
  console.log('5. Verification post-migration:');
  const newRoleCounts = await usersCollection.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();

  newRoleCounts.forEach(r => {
    console.log(`   ${r._id}: ${r.count} utilisateur(s)`);
  });

  // Verifier qu'il ne reste pas d'anciens roles
  const legacyRemaining = await usersCollection.countDocuments({
    role: { $in: ['user', 'moderator'] }
  });

  console.log('');
  if (legacyRemaining > 0) {
    console.log(`   ATTENTION: ${legacyRemaining} utilisateurs ont encore un ancien role!`);
  } else {
    console.log('   Tous les anciens roles ont ete migres.');
  }

  console.log('');
  console.log(`=== Migration 001 terminee. ${dryRun ? '(DRY RUN)' : `${totalMigrated} utilisateurs migres.`} ===`);
}

async function rollback() {
  console.log('=== Rollback Migration 001 ===');

  await connectDB();

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // Trouver le backup le plus recent
  const collections = await db.listCollections({ name: /^users_backup_001_/ }).toArray();

  if (collections.length === 0) {
    console.log('Aucun backup trouve. Rollback impossible.');
    process.exit(1);
  }

  // Trier par nom (contient le timestamp) pour prendre le plus recent
  collections.sort((a, b) => b.name.localeCompare(a.name));
  const latestBackup = collections[0].name;

  console.log(`Backup utilise: ${latestBackup}`);

  const backupData = await db.collection(latestBackup).find({}).toArray();
  console.log(`${backupData.length} utilisateurs a restaurer`);

  if (backupData.length === 0) {
    console.log('Backup vide. Rollback annule.');
    process.exit(1);
  }

  // Restaurer les utilisateurs un par un (pour gerer les conflits _id)
  let restored = 0;
  for (const user of backupData) {
    await usersCollection.replaceOne(
      { _id: user._id },
      user,
      { upsert: true }
    );
    restored++;
  }

  // Supprimer les champs ajoutes par la migration
  await usersCollection.updateMany(
    {},
    { $unset: { _migratedFrom: '', interfaces: '', organizationId: '' } }
  );

  console.log(`${restored} utilisateurs restaures.`);
  console.log('=== Rollback termine ===');
}

// Execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRollback = args.includes('--rollback');

(async () => {
  try {
    if (isRollback) {
      await rollback();
    } else {
      await migrate(isDryRun);
    }
  } catch (error) {
    console.error('Erreur durant la migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
