/**
 * ROUTES CONTACTS - Gestion des journalistes et médias
 * Gestion complète des contacts avec import de base de données française
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { journalistDatabase } = require('../scripts/import-journalists-data');
const rateLimit = require('express-rate-limit');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

// Rate limiting pour l'import
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 imports par heure maximum
  message: {
    error: 'Trop d\'imports récents. Veuillez patienter 1 heure.'
  }
});

/**
 * GET /api/contacts
 * Récupérer la liste des contacts avec filtres et pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      mediaType,
      specializations,
      location,
      status = 'active',
      sortBy = 'engagementScore',
      sortOrder = 'desc'
    } = req.query;

    // Construction des filtres
    const filters = { status };
    if (mediaType) filters['media.type'] = mediaType;
    if (location) filters['location.city'] = new RegExp(location, 'i');
    if (specializations) {
      const specs = Array.isArray(specializations) ? specializations : [specializations];
      filters.specializations = { $in: specs };
    }

    // Construction de la requête
    let query = Contact.find(filters);

    // Recherche textuelle
    if (search) {
      query = query.or([
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'media.name': { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ]);
    }

    // Tri
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    query = query.sort(sortObj);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    // Exécution
    const contacts = await query.lean();
    const total = await Contact.countDocuments(filters);

    // Calcul des statistiques
    const stats = await Contact.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          avgEngagement: { $avg: '$engagementScore' },
          totalActive: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalVerified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          media: contact.media,
          specializations: contact.specializations,
          location: contact.location,
          engagementScore: contact.engagementScore,
          status: contact.status,
          isVerified: contact.isVerified,
          lastContactDate: contact.lastContactDate,
          tags: contact.tags
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats[0] || {
          avgEngagement: 0,
          totalActive: 0,
          totalVerified: 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contacts'
    });
  }
});

/**
 * GET /api/contacts/stats
 * Statistiques détaillées des contacts
 */
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    // Statistiques générales
    const generalStats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          avgEngagement: { $avg: '$engagementScore' },
          avgOpenRate: { $avg: '$emailMetrics.openRate' },
          avgResponseRate: { $avg: '$emailMetrics.responseRate' }
        }
      }
    ]);

    // Répartition par type de média
    const mediaStats = await Contact.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$media.type',
          count: { $sum: 1 },
          avgEngagement: { $avg: '$engagementScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Répartition par spécialisation
    const specializationStats = await Contact.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$specializations' },
      {
        $group: {
          _id: '$specializations',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Répartition géographique
    const locationStats = await Contact.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // Top contacts par engagement
    const topContacts = await Contact.find({ status: 'active' })
      .sort({ engagementScore: -1 })
      .limit(10)
      .select('firstName lastName email media.name engagementScore emailMetrics.responseRate')
      .lean();

    res.json({
      success: true,
      data: {
        general: generalStats[0] || {},
        byMediaType: mediaStats,
        bySpecialization: specializationStats,
        byLocation: locationStats,
        topContacts: topContacts.map(contact => ({
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          media: contact.media?.name,
          engagement: contact.engagementScore,
          responseRate: contact.emailMetrics?.responseRate || 0
        }))
      }
    });

  } catch (error) {
    console.error('Erreur statistiques contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques'
    });
  }
});

/**
 * POST /api/contacts
 * Créer un nouveau contact
 */
router.post('/', auth, async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      createdBy: req.user?.id, // Sera ajouté avec l'auth middleware
      source: 'manual'
    };

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      success: true,
      data: {
        id: contact._id,
        name: contact.getFullName(),
        email: contact.email,
        media: contact.media,
        status: contact.status
      }
    });

  } catch (error) {
    console.error('Erreur création contact:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Un contact avec cet email existe déjà'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du contact'
    });
  }
});

/**
 * GET /api/contacts/:id
 * Récupérer un contact spécifique
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('campaigns.campaignId', 'name status sentAt')
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Erreur récupération contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contact'
    });
  }
});

/**
 * PUT /api/contacts/:id
 * Mettre à jour un contact
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        id: contact._id,
        name: contact.getFullName(),
        email: contact.email,
        media: contact.media,
        status: contact.status,
        engagementScore: contact.engagementScore
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du contact'
    });
  }
});

/**
 * DELETE /api/contacts/:id
 * Supprimer un contact (archiver)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isArchived: true,
          status: 'inactive'
        }
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Contact archivé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du contact'
    });
  }
});

/**
 * POST /api/contacts/import/french-journalists
 * Importer la base de données de journalistes français
 */
router.post('/import/french-journalists', auth, importLimiter, async (req, res) => {
  try {
    console.log('🚀 Début import journalistes français...');

    // Obtenir l'utilisateur connecté (sera implémenté avec l'auth)
    const defaultUserId = req.user?.id || '67890abcdef123456789'; // Temporaire

    let totalImported = 0;
    let totalSkipped = 0;
    const importDetails = [];

    // Import des différentes catégories
    const categories = [
      { name: 'Ferarock', data: journalistDatabase.ferarock },
      { name: 'Radio Campus', data: journalistDatabase.radioCampus },
      { name: 'Radios Locales', data: journalistDatabase.radiosLocales }
    ];

    for (const category of categories) {
      const categoryResult = {
        category: category.name,
        imported: 0,
        skipped: 0,
        contacts: []
      };

      for (const journalistData of category.data) {
        try {
          // Vérifier si le contact existe déjà
          const existingContact = await Contact.findOne({ email: journalistData.email });

          if (existingContact) {
            categoryResult.skipped++;
            totalSkipped++;
            continue;
          }

          // Créer le nouveau contact
          const contact = new Contact({
            ...journalistData,
            createdBy: defaultUserId,
            engagementScore: Math.floor(Math.random() * 30) + 20, // Score initial 20-50
            emailMetrics: {
              totalReceived: 0,
              totalOpened: 0,
              totalClicked: 0,
              totalReplied: 0,
              openRate: 0,
              clickRate: 0,
              responseRate: 0
            },
            status: 'active',
            isVerified: true
          });

          await contact.save();

          categoryResult.imported++;
          totalImported++;
          categoryResult.contacts.push({
            name: contact.getFullName(),
            email: contact.email,
            media: contact.media.name,
            city: contact.location.city
          });

        } catch (error) {
          console.error(`Erreur import contact ${journalistData.email}:`, error.message);
          categoryResult.skipped++;
          totalSkipped++;
        }
      }

      importDetails.push(categoryResult);
    }

    // Calculer les nouvelles statistiques
    const newStats = await Contact.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$media.type',
          count: { $sum: 1 },
          avgEngagement: { $avg: '$engagementScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      message: `Import terminé: ${totalImported} contacts ajoutés, ${totalSkipped} ignorés`,
      data: {
        summary: {
          totalImported,
          totalSkipped,
          totalInDatabase: await Contact.countDocuments({ status: 'active' })
        },
        details: importDetails,
        newStats
      }
    });

  } catch (error) {
    console.error('Erreur import journalistes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import des journalistes français'
    });
  }
});

/**
 * GET /api/contacts/import/preview
 * Prévisualiser les données à importer
 */
router.get('/import/preview', optionalAuth, async (req, res) => {
  try {
    const preview = [];
    let totalContacts = 0;

    // Analyser chaque catégorie
    const categories = [
      { name: 'Ferarock', data: journalistDatabase.ferarock },
      { name: 'Radio Campus', data: journalistDatabase.radioCampus },
      { name: 'Radios Locales', data: journalistDatabase.radiosLocales }
    ];

    for (const category of categories) {
      const categoryPreview = {
        category: category.name,
        count: category.data.length,
        description: getCategoryDescription(category.name),
        sampleContacts: category.data.slice(0, 3).map(contact => ({
          name: `${contact.firstName} ${contact.lastName}`,
          media: contact.media.name,
          specializations: contact.specializations,
          city: contact.location.city
        }))
      };

      // Vérifier combien existent déjà
      const existingEmails = await Contact.find({
        email: { $in: category.data.map(c => c.email) }
      }).select('email');

      categoryPreview.alreadyExists = existingEmails.length;
      categoryPreview.newContacts = category.data.length - existingEmails.length;

      preview.push(categoryPreview);
      totalContacts += category.data.length;
    }

    res.json({
      success: true,
      data: {
        totalContacts,
        categories: preview,
        mediaTypes: getMediaTypeBreakdown(),
        specializations: getSpecializationBreakdown(),
        locations: getLocationBreakdown()
      }
    });

  } catch (error) {
    console.error('Erreur prévisualisation import:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prévisualisation'
    });
  }
});

// Fonctions utilitaires
function getCategoryDescription(categoryName) {
  const descriptions = {
    'Ferarock': 'Radios spécialisées rock/metal nationales et régionales',
    'Radio Campus': 'Réseau des radios universitaires Campus France',
    'Radios Locales': 'Radios locales et régionales complémentaires'
  };
  return descriptions[categoryName] || '';
}

function getMediaTypeBreakdown() {
  const allData = [
    ...journalistDatabase.ferarock,
    ...journalistDatabase.radioCampus,
    ...journalistDatabase.radiosLocales
  ];

  const breakdown = {};
  allData.forEach(contact => {
    const type = contact.media.type;
    breakdown[type] = (breakdown[type] || 0) + 1;
  });

  return breakdown;
}

function getSpecializationBreakdown() {
  const allData = [
    ...journalistDatabase.ferarock,
    ...journalistDatabase.radioCampus,
    ...journalistDatabase.radiosLocales
  ];

  const breakdown = {};
  allData.forEach(contact => {
    contact.specializations.forEach(spec => {
      breakdown[spec] = (breakdown[spec] || 0) + 1;
    });
  });

  return Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
}

function getLocationBreakdown() {
  const allData = [
    ...journalistDatabase.ferarock,
    ...journalistDatabase.radioCampus,
    ...journalistDatabase.radiosLocales
  ];

  const breakdown = {};
  allData.forEach(contact => {
    const city = contact.location.city;
    breakdown[city] = (breakdown[city] || 0) + 1;
  });

  return Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
}

/**
 * POST /api/contacts/import/csv
 * Importer des contacts depuis un fichier CSV/Excel
 */
router.post('/import/csv', auth, async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'Format de données invalide'
      });
    }

    console.log(`🚀 Import CSV: ${contacts.length} contacts à traiter...`);

    const defaultUserId = req.user?.id || '67890abcdef123456789'; // Temporaire
    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const contactData of contacts) {
      try {
        // Vérifier si le contact existe déjà
        const existingContact = await Contact.findOne({ email: contactData.email });

        if (existingContact) {
          skipped++;
          continue;
        }

        // Créer le nouveau contact
        const contact = new Contact({
          ...contactData,
          createdBy: defaultUserId,
          engagementScore: Math.floor(Math.random() * 20) + 15, // Score initial 15-35
          emailMetrics: {
            totalReceived: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalReplied: 0,
            openRate: 0,
            clickRate: 0,
            responseRate: 0
          },
          status: 'active',
          isVerified: false // CSV imports need verification
        });

        await contact.save();
        imported++;

      } catch (error) {
        console.error(`Erreur import contact ${contactData.email}:`, error.message);
        errors.push({
          email: contactData.email,
          error: error.message
        });
        skipped++;
      }
    }

    // Calculer les nouvelles statistiques
    const totalInDatabase = await Contact.countDocuments({ status: 'active' });

    console.log(`✅ Import CSV terminé: ${imported} importés, ${skipped} ignorés`);

    res.json({
      success: true,
      message: `Import terminé: ${imported} contacts importés, ${skipped} ignorés`,
      data: {
        imported,
        skipped,
        totalInDatabase,
        errors: errors.slice(0, 10) // Limiter à 10 erreurs pour l'affichage
      }
    });

  } catch (error) {
    console.error('Erreur import CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import CSV'
    });
  }
});

module.exports = router;