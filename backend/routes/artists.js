const express = require('express');
const Artist = require('../models/Artist');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/artists - Liste des artistes
router.get('/', auth, async (req, res) => {
  try {
    const artists = await Artist.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Erreur récupération artistes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// GET /api/artists/:id - Récupérer un artiste spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artiste non trouvé'
      });
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Erreur récupération artiste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/artists - Créer un nouvel artiste
router.post('/', auth, async (req, res) => {
  try {
    const artist = new Artist(req.body);
    await artist.save();

    res.status(201).json({
      success: true,
      message: 'Artiste créé avec succès',
      data: artist
    });
  } catch (error) {
    console.error('Erreur création artiste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'artiste'
    });
  }
});

module.exports = router;