/**
 * MIGRATION 002 - Creation de l'organisation BandStream
 *
 * Cree l'organisation "BandStream" et rattache les utilisateurs bandstream_rp
 * Met a jour les contacts et campagnes existants avec les champs interface/visibility
 *
 * Usage:
 *   node migrations/002_create_bandstream_org.js [--dry-run] [--rollback]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const BANDSTREAM_ORG = {
  name: 'BandStream',
  slug: 'bandstream',
  type: 'corporate',
  description: 'Organisation principale BandStream - Relations publiques',
  settings: {
    maxUsers: 100,
    features: {
      pressReleases: true,
      events: true,
      mediaKits: true,
      aiOptimization: true,
      sharedContactPool: true
    },
    branding: {
      primaryColor: '#10b981',
      secondaryColor: '#059669'
    }
  },
  subscription: {
    plan: 'enterprise',
    status: 'active',
    startDate: new Date()
  },
  isActive: true
};

async function migrate(dryRun = false) {
  console.log('=== Migration 002: Creation organisation BandStream ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTION'}`);
  console.log('');

  await connectDB();

  const db = mongoose.connection.db;
  const orgsCollection = db.collection('organizations');
  const usersCollection = db.collection('users');
  const contactsCollection = db.collection('contacts');
  const campaignsCollection = db.collection('campaigns');

  // 1. Verifier si l'organisation existe deja
  const existingOrg = await orgsCollection.findOne({ slug: 'bandstream' });

  if (existingOrg) {
    console.log('1. Organisation BandStream existe deja (ID: ' + existingOrg._id + ')');
  } else {
    console.log('1. Creation de l\'organisation BandStream...');
    if (!dryRun) {
      const result = await orgsCollection.insertOne({
        ...BANDSTREAM_ORG,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`   Cree avec ID: ${result.insertedId}`);
    }
  }

  // Recuperer l'ID de l'organisation
  const org = dryRun && !existingOrg
    ? { _id: 'DRY_RUN_ID' }
    : await orgsCollection.findOne({ slug: 'bandstream' });

  // 2. Rattacher les utilisateurs bandstream_rp a l'organisation
  console.log('');
  console.log('2. Rattachement des utilisateurs bandstream_rp...');

  const rpUsers = await usersCollection.countDocuments({
    role: 'bandstream_rp',
    $or: [
      { organizationId: null },
      { organizationId: { $exists: false } }
    ]
  });

  console.log(`   ${rpUsers} utilisateur(s) bandstream_rp sans organisation`);

  if (!dryRun && rpUsers > 0) {
    const result = await usersCollection.updateMany(
      {
        role: 'bandstream_rp',
        $or: [
          { organizationId: null },
          { organizationId: { $exists: false } }
        ]
      },
      { $set: { organizationId: org._id } }
    );
    console.log(`   -> ${result.modifiedCount} utilisateur(s) rattache(s)`);
  }

  // 3. Mettre a jour les contacts existants avec le champ interface
  console.log('');
  console.log('3. Mise a jour des contacts existants...');

  const contactsWithoutInterface = await contactsCollection.countDocuments({
    interface: { $exists: false }
  });

  console.log(`   ${contactsWithoutInterface} contact(s) sans champ interface`);

  if (!dryRun && contactsWithoutInterface > 0) {
    // Par defaut, les contacts existants sont dans l'interface press
    const result = await contactsCollection.updateMany(
      { interface: { $exists: false } },
      {
        $set: {
          interface: 'press',
          visibility: 'private',
          organizationId: null
        }
      }
    );
    console.log(`   -> ${result.modifiedCount} contact(s) mis a jour (interface: press, visibility: private)`);
  }

  // 4. Mettre a jour les campagnes existantes
  console.log('');
  console.log('4. Mise a jour des campagnes existantes...');

  const campaignsWithoutType = await campaignsCollection.countDocuments({
    campaignType: { $exists: false }
  });

  console.log(`   ${campaignsWithoutType} campagne(s) sans champ campaignType`);

  if (!dryRun && campaignsWithoutType > 0) {
    // Les campagnes existantes sont toutes de type artist_promo (interface press)
    const result = await campaignsCollection.updateMany(
      { campaignType: { $exists: false } },
      {
        $set: {
          campaignType: 'artist_promo',
          interface: 'press',
          organizationId: null,
          pressReleaseId: null,
          eventId: null,
          mediaKitId: null
        }
      }
    );
    console.log(`   -> ${result.modifiedCount} campagne(s) mises a jour (type: artist_promo, interface: press)`);
  }

  // 5. Mettre a jour les stats de l'organisation
  if (!dryRun && org._id !== 'DRY_RUN_ID') {
    console.log('');
    console.log('5. Mise a jour des statistiques...');

    const memberCount = await usersCollection.countDocuments({
      organizationId: org._id,
      isActive: true
    });

    await orgsCollection.updateOne(
      { _id: org._id },
      {
        $set: {
          'stats.totalMembers': memberCount,
          'stats.totalContacts': 0,
          'stats.totalCampaigns': 0,
          'stats.lastUpdated': new Date()
        }
      }
    );

    console.log(`   Organisation BandStream: ${memberCount} membre(s)`);
  }

  // 6. Resume
  console.log('');
  console.log('=== Resume ===');

  const finalRoleCounts = await usersCollection.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();

  finalRoleCounts.forEach(r => {
    console.log(`   ${r._id}: ${r.count} utilisateur(s)`);
  });

  const orgCount = await orgsCollection.countDocuments({});
  console.log(`   Organisations: ${orgCount}`);

  console.log('');
  console.log(`=== Migration 002 terminee ${dryRun ? '(DRY RUN)' : ''} ===`);
}

async function rollback() {
  console.log('=== Rollback Migration 002 ===');

  await connectDB();

  const db = mongoose.connection.db;
  const orgsCollection = db.collection('organizations');
  const usersCollection = db.collection('users');
  const contactsCollection = db.collection('contacts');
  const campaignsCollection = db.collection('campaigns');

  // 1. Detacher les utilisateurs de l'organisation BandStream
  const org = await orgsCollection.findOne({ slug: 'bandstream' });

  if (org) {
    const result = await usersCollection.updateMany(
      { organizationId: org._id },
      { $set: { organizationId: null } }
    );
    console.log(`1. ${result.modifiedCount} utilisateur(s) detache(s) de BandStream`);

    // 2. Supprimer l'organisation
    await orgsCollection.deleteOne({ _id: org._id });
    console.log('2. Organisation BandStream supprimee');
  } else {
    console.log('1. Organisation BandStream non trouvee');
  }

  // 3. Retirer les champs ajoutes aux contacts
  const contactResult = await contactsCollection.updateMany(
    {},
    { $unset: { interface: '', visibility: '', organizationId: '' } }
  );
  console.log(`3. ${contactResult.modifiedCount} contact(s) nettoye(s)`);

  // 4. Retirer les champs ajoutes aux campagnes
  const campaignResult = await campaignsCollection.updateMany(
    {},
    {
      $unset: {
        campaignType: '',
        interface: '',
        organizationId: '',
        pressReleaseId: '',
        eventId: '',
        mediaKitId: ''
      }
    }
  );
  console.log(`4. ${campaignResult.modifiedCount} campagne(s) nettoyee(s)`);

  console.log('');
  console.log('=== Rollback 002 termine ===');
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
