const Project = require('../models/Project');
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

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'projects');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
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
const uploadCoverImage = upload.single('coverImage');

/**
 * GET /api/projects
 * Liste tous les projets de l'utilisateur connecté
 */
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construction du filtre
    const filter = {
      createdBy: req.user.id,
      isActive: true
    };

    if (status) filter.status = status;
    if (type) filter.type = type;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Requête avec pagination
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('artistId', 'name genre profileImage')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Project.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        projects,
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
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/:id
 * Récupère un projet spécifique
 */
const getById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    }).populate('artistId');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Error in getById', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

/**
 * POST /api/projects
 * Crée un nouveau projet
 */
const create = async (req, res) => {
  uploadCoverImage(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message
      });
    }

    try {
      const projectData = {
        ...req.body,
        createdBy: req.user.id,
        isActive: true
      };

      // Ajout du chemin de l'image si uploadée
      if (req.file) {
        projectData.coverImage = `/uploads/projects/${req.file.filename}`;
      }

      // Parsing des arrays JSON si envoyés en string
      ['tracks', 'composer', 'lyricist'].forEach(field => {
        if (typeof projectData[field] === 'string') {
          try {
            projectData[field] = JSON.parse(projectData[field]);
          } catch (e) {
            // Si parsing échoue, on garde la valeur originale
          }
        }
      });

      const project = await Project.create(projectData);
      const populatedProject = await Project.findById(project._id)
        .populate('artistId', 'name genre profileImage');

      res.status(201).json({
        success: true,
        data: populatedProject
      });
    } catch (error) {
      // Suppression du fichier uploadé en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(path.join(__dirname, '..', 'uploads', 'projects', req.file.filename));
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file', { error: unlinkError.message });
        }
      }

      logger.error('Error in create', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error creating project',
        error: error.message
      });
    }
  });
};

/**
 * PUT /api/projects/:id
 * Met à jour un projet existant
 */
const update = async (req, res) => {
  uploadCoverImage(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message
      });
    }

    try {
      // Vérification de la propriété
      const existingProject = await Project.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
        isActive: true
      });

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      const updateData = { ...req.body };

      // Gestion de la nouvelle image
      if (req.file) {
        // Suppression de l'ancienne image si elle existe
        if (existingProject.coverImage) {
          const oldImagePath = path.join(__dirname, '..', existingProject.coverImage);
          try {
            await fs.unlink(oldImagePath);
          } catch (err) {
            logger.error('Error deleting old image', { error: err.message });
          }
        }
        updateData.coverImage = `/uploads/projects/${req.file.filename}`;
      }

      // Parsing des arrays JSON
      ['tracks', 'composer', 'lyricist'].forEach(field => {
        if (typeof updateData[field] === 'string') {
          try {
            updateData[field] = JSON.parse(updateData[field]);
          } catch (e) {
            // Garde la valeur originale si parsing échoue
          }
        }
      });

      const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('artistId');

      res.json({
        success: true,
        data: updatedProject
      });
    } catch (error) {
      // Suppression du nouveau fichier en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(path.join(__dirname, '..', 'uploads', 'projects', req.file.filename));
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file', { error: unlinkError.message });
        }
      }

      logger.error('Error in update', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error updating project',
        error: error.message
      });
    }
  });
};

/**
 * DELETE /api/projects/:id
 * Soft delete d'un projet
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error in delete', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/stats
 * Récupère les statistiques des projets
 */
const getStats = async (req, res) => {
  try {
    const baseFilter = {
      createdBy: req.user.id,
      isActive: true
    };

    const [byStatus, byType, upcomingCount] = await Promise.all([
      // Compte par statut
      Project.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Compte par type
      Project.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Compte des sorties à venir
      Project.countDocuments({
        ...baseFilter,
        releaseDate: { $gt: new Date() },
        status: { $ne: 'released' }
      })
    ]);

    // Total général
    const total = await Project.countDocuments(baseFilter);

    res.json({
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id || 'undefined'] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id || 'undefined'] = item.count;
          return acc;
        }, {}),
        upcomingReleases: upcomingCount
      }
    });
  } catch (error) {
    logger.error('Error in getStats', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/upcoming
 * Récupère les projets à venir
 */
const getUpcoming = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const projects = await Project.find({
      createdBy: req.user.id,
      isActive: true,
      releaseDate: { $gt: new Date() }
    })
    .populate('artistId', 'name genre')
    .sort({ releaseDate: 1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('Error in getUpcoming', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming projects',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/search
 * Recherche de projets par texte
 */
const search = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = new RegExp(q, 'i');

    const projects = await Project.find({
      createdBy: req.user.id,
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('artistId', 'name genre')
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('Error in search', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error searching projects',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/:id/milestones
 * Ajoute un milestone au projet
 */
const addMilestone = async (req, res) => {
  try {
    const { title, date, description, status = 'pending' } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title and date are required'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Initialisation du tableau milestones s'il n'existe pas
    if (!project.milestones) {
      project.milestones = [];
    }

    const milestone = {
      _id: new Date().getTime().toString(), // ID simple basé sur timestamp
      title,
      date: new Date(date),
      description,
      status,
      createdAt: new Date()
    };

    project.milestones.push(milestone);
    await project.save();

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    logger.error('Error in addMilestone', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error adding milestone',
      error: error.message
    });
  }
};

/**
 * PUT /api/projects/:id/milestones/:milestoneId
 * Met à jour un milestone spécifique
 */
const updateMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const updateData = req.body;

    const project = await Project.findOne({
      _id: id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    if (!project.milestones) {
      return res.status(404).json({
        success: false,
        message: 'No milestones found in this project'
      });
    }

    const milestoneIndex = project.milestones.findIndex(
      m => m._id === milestoneId
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Mise à jour du milestone
    project.milestones[milestoneIndex] = {
      ...project.milestones[milestoneIndex],
      ...updateData,
      _id: milestoneId, // Préserve l'ID
      updatedAt: new Date()
    };

    await project.save();

    res.json({
      success: true,
      data: project.milestones[milestoneIndex]
    });
  } catch (error) {
    logger.error('Error in updateMilestone', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating milestone',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/:id/expenses
 * Ajoute une dépense au projet
 */
const addExpense = async (req, res) => {
  try {
    const { category, amount, description, date, receipt } = req.body;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category and amount are required'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Initialisation du tableau expenses s'il n'existe pas
    if (!project.expenses) {
      project.expenses = [];
    }

    const expense = {
      _id: new Date().getTime().toString(),
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      receipt,
      createdAt: new Date()
    };

    project.expenses.push(expense);
    await project.save();

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Error in addExpense', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error adding expense',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/:id/collaborators
 * Ajoute un collaborateur au projet
 */
const addCollaborator = async (req, res) => {
  try {
    const { name, role, email, phone, contribution } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name and role are required'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Initialisation du tableau collaborators s'il n'existe pas
    if (!project.collaborators) {
      project.collaborators = [];
    }

    const collaborator = {
      _id: new Date().getTime().toString(),
      name,
      role,
      email,
      phone,
      contribution,
      addedAt: new Date()
    };

    project.collaborators.push(collaborator);
    await project.save();

    res.status(201).json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    logger.error('Error in addCollaborator', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error adding collaborator',
      error: error.message
    });
  }
};

/**
 * PUT /api/projects/:id/deliverables/:deliverable
 * Met à jour le statut d'un livrable
 */
const updateDeliverable = async (req, res) => {
  try {
    const { id, deliverable } = req.params;
    const { status, url, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const project = await Project.findOne({
      _id: id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Initialisation de l'objet deliverables s'il n'existe pas
    if (!project.deliverables) {
      project.deliverables = {};
    }

    // Mise à jour ou création du livrable
    project.deliverables[deliverable] = {
      status,
      url,
      notes,
      updatedAt: new Date()
    };

    // Marquer le champ comme modifié pour Mongoose
    project.markModified('deliverables');
    await project.save();

    res.json({
      success: true,
      data: {
        deliverable,
        ...project.deliverables[deliverable]
      }
    });
  } catch (error) {
    logger.error('Error in updateDeliverable', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating deliverable',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/:id/analytics
 * Récupère les métriques d'un projet
 */
const getAnalytics = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Calcul des métriques
    const analytics = {
      projectId: project._id,
      projectName: project.name,
      status: project.status,
      daysUntilRelease: project.releaseDate
        ? Math.ceil((new Date(project.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null,

      // Métriques des tracks
      tracksCount: project.tracks?.length || 0,
      totalDuration: project.tracks?.reduce((sum, track) => {
        if (track.duration) {
          const [min, sec] = track.duration.split(':').map(Number);
          return sum + (min * 60 + (sec || 0));
        }
        return sum;
      }, 0) || 0,

      // Métriques financières
      totalExpenses: project.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
      expensesByCategory: project.expenses?.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {}) || {},

      // Métriques de collaboration
      collaboratorsCount: project.collaborators?.length || 0,
      collaboratorsByRole: project.collaborators?.reduce((acc, collab) => {
        acc[collab.role] = (acc[collab.role] || 0) + 1;
        return acc;
      }, {}) || {},

      // Métriques de progression
      completedMilestones: project.milestones?.filter(m => m.status === 'completed').length || 0,
      totalMilestones: project.milestones?.length || 0,
      milestoneProgress: project.milestones?.length
        ? Math.round((project.milestones.filter(m => m.status === 'completed').length / project.milestones.length) * 100)
        : 0,

      // Métriques de distribution
      platformsCount: [
        project.spotify,
        project.appleMusic,
        project.deezer,
        project.youtube,
        project.bandcamp,
        project.soundcloud
      ].filter(Boolean).length,

      // Métriques de livrables
      deliverablesCount: Object.keys(project.deliverables || {}).length,
      completedDeliverables: Object.values(project.deliverables || {})
        .filter(d => d.status === 'completed').length,

      // Timestamps
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastActivity: project.updatedAt
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error in getAnalytics', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching project analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteProject,
  getStats,
  getUpcoming,
  search,
  addMilestone,
  updateMilestone,
  addExpense,
  addCollaborator,
  updateDeliverable,
  getAnalytics
};