const Artist = require('../models/Artist');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

// Configuration multer pour l'upload d'images de profil
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'artists');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `artist-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter
});

// Middleware pour gérer l'upload
const uploadProfileImage = upload.single('profileImage');

/**
 * GET /api/artists
 * Liste tous les artistes de l'utilisateur connecté
 */
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construction du filtre de base
    const filter = {
      createdBy: req.user.id,
      isActive: true
    };

    // Filtre optionnel par genre
    if (genre) {
      filter.genre = new RegExp(genre, 'i');
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Requête avec pagination
    const [artists, total] = await Promise.all([
      Artist.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Artist.countDocuments(filter)
    ]);

    // Formatage de la réponse avec pagination
    res.json({
      success: true,
      data: {
        artists,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAll', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching artists',
      error: error.message
    });
  }
};

/**
 * GET /api/artists/:id
 * Récupère un artiste spécifique
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid artist ID format'
      });
    }

    // Recherche avec vérification de propriété
    const artist = await Artist.findOne({
      _id: id,
      createdBy: req.user.id,
      isActive: true
    }).lean();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found or access denied'
      });
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    logger.error('Error in getById', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching artist',
      error: error.message
    });
  }
};

/**
 * POST /api/artists
 * Crée un nouvel artiste
 */
const create = async (req, res) => {
  uploadProfileImage(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message
      });
    }

    try {
      // Validation des champs requis
      const { name, genre } = req.body;

      if (!name || !genre) {
        // Suppression du fichier uploadé si validation échoue
        if (req.file) {
          try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', 'artists', req.file.filename));
          } catch (err) {
            logger.error('Error deleting uploaded file', { error: err.message });
          }
        }

        return res.status(400).json({
          success: false,
          message: 'Name and genre are required'
        });
      }

      // Construction des données de l'artiste
      const artistData = {
        name: name.trim(),
        genre: genre.trim(),
        description: req.body.description?.trim() || '',
        createdBy: req.user.id,
        isActive: true,

        // Réseaux sociaux
        instagram: req.body.instagram?.trim() || '',
        facebook: req.body.facebook?.trim() || '',
        twitter: req.body.twitter?.trim() || '',
        youtube: req.body.youtube?.trim() || '',
        spotify: req.body.spotify?.trim() || '',
        deezer: req.body.deezer?.trim() || '',
        appleMusic: req.body.appleMusic?.trim() || '',

        // Contact
        email: req.body.email?.trim() || '',
        phone: req.body.phone?.trim() || '',
        website: req.body.website?.trim() || ''
      };

      // Ajout du chemin de l'image si uploadée
      if (req.file) {
        artistData.profileImage = `/uploads/artists/${req.file.filename}`;
      }

      // Création de l'artiste
      const artist = await Artist.create(artistData);

      res.status(201).json({
        success: true,
        data: artist,
        message: 'Artist created successfully'
      });
    } catch (error) {
      // Suppression du fichier uploadé en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(path.join(__dirname, '..', 'uploads', 'artists', req.file.filename));
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file', { error: unlinkError.message });
        }
      }

      // Gestion des erreurs de validation Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      // Gestion de la contrainte d'unicité si elle existe
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Artist with this name already exists'
        });
      }

      logger.error('Error in create', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error creating artist',
        error: error.message
      });
    }
  });
};

/**
 * PUT /api/artists/:id
 * Met à jour un artiste existant
 */
const update = async (req, res) => {
  uploadProfileImage(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message
      });
    }

    try {
      const { id } = req.params;

      // Validation de l'ID
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        if (req.file) {
          try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', 'artists', req.file.filename));
          } catch (err) {
            logger.error('Error deleting uploaded file', { error: err.message });
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid artist ID format'
        });
      }

      // Vérification de l'existence et de la propriété
      const existingArtist = await Artist.findOne({
        _id: id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!existingArtist) {
        if (req.file) {
          try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', 'artists', req.file.filename));
          } catch (err) {
            logger.error('Error deleting uploaded file', { error: err.message });
          }
        }
        return res.status(404).json({
          success: false,
          message: 'Artist not found or access denied'
        });
      }

      // Construction des données de mise à jour
      const updateData = {};

      // Mise à jour sélective des champs
      const fields = [
        'name', 'genre', 'description',
        'instagram', 'facebook', 'twitter', 'youtube',
        'spotify', 'deezer', 'appleMusic',
        'email', 'phone', 'website'
      ];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field].trim();
        }
      });

      // Gestion de la nouvelle image de profil
      if (req.file) {
        // Suppression de l'ancienne image si elle existe
        if (existingArtist.profileImage) {
          const oldImagePath = path.join(__dirname, '..', existingArtist.profileImage);
          try {
            await fs.unlink(oldImagePath);
          } catch (err) {
            logger.error('Error deleting old image', { error: err.message });
          }
        }
        updateData.profileImage = `/uploads/artists/${req.file.filename}`;
      }

      // Validation : au moins un champ à mettre à jour
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      // Mise à jour de l'artiste
      const updatedArtist = await Artist.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
          lean: true
        }
      );

      res.json({
        success: true,
        data: updatedArtist,
        message: 'Artist updated successfully'
      });
    } catch (error) {
      // Suppression du fichier uploadé en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(path.join(__dirname, '..', 'uploads', 'artists', req.file.filename));
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file', { error: unlinkError.message });
        }
      }

      // Gestion des erreurs de validation
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      // Gestion de la contrainte d'unicité
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Artist with this name already exists'
        });
      }

      logger.error('Error in update', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error updating artist',
        error: error.message
      });
    }
  });
};

/**
 * DELETE /api/artists/:id
 * Soft delete d'un artiste
 */
const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid artist ID format'
      });
    }

    // Recherche et soft delete
    const artist = await Artist.findOneAndUpdate(
      {
        _id: id,
        createdBy: req.user.id,
        isActive: true
      },
      {
        isActive: false,
        deletedAt: new Date()
      },
      {
        new: true,
        lean: true
      }
    );

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found or already deleted'
      });
    }

    // Note: On ne supprime pas l'image physiquement lors du soft delete
    // Elle pourrait être restaurée si l'artiste est réactivé

    res.json({
      success: true,
      message: 'Artist deleted successfully',
      data: {
        id: artist._id,
        name: artist.name
      }
    });
  } catch (error) {
    logger.error('Error in delete', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error deleting artist',
      error: error.message
    });
  }
};

// Export des fonctions du contrôleur
module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteArtist
};