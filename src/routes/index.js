import bcrypt from "bcrypt";
import db from "../db.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Contrôleur pour l'inscription
export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Utilisateur déjà existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (email, password, created_at) VALUES ($1, $2, NOW()) RETURNING id, email",
      [email, hashedPassword]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// Contrôleur pour la connexion via Google OAuth
export const googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    let user;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
    } else {
      const result = await db.query(
        "INSERT INTO users (email, name, picture, google_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, name, picture",
        [email, name, picture, googleId]
      );
      user = result.rows[0];
    }

    // Crée un token JWT
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Erreur Google Auth :", err);
    return res.status(401).json({ message: "Échec de la connexion Google" });
  }
};
