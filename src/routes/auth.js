import express from "express";
import { loginUser, googleAuth } from "../controllers/authController.js";  // Assurez-vous d'importer les bonnes fonctions

const router = express.Router();

// Route de connexion par email et mot de passe
router.post("/login", loginUser);

// Route de connexion via Google OAuth
router.post("/google", googleAuth);  // Ajouter une route pour la connexion via Google

export default router;
