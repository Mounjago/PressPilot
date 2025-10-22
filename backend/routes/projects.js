const express = require('express');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - Liste des projets
router.get('/', auth, async (req, res) => {
  try {
    const { artistId } = req.query;
    const filter = artistId ? { artistId } : {};

    const projects = await Project.find(filter)
      .populate('artistId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Erreur récupération projets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// GET /api/projects/:id - Récupérer un projet spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('artistId', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erreur récupération projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/projects - Créer un nouveau projet
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();

    await project.populate('artistId', 'name');

    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: project
    });
  } catch (error) {
    console.error('Erreur création projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet'
    });
  }
});

module.exports = router;