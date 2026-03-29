# PressPilot by BandStream

Plateforme SaaS de gestion des relations presse pour artistes et labels musicaux.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18.2 + Vite 4.5 + Tailwind CSS 3.4 |
| **Backend** | Node.js 20 + Express 4.18 + Mongoose 8.1 |
| **Base de donnees** | MongoDB Atlas |
| **Deploiement** | Railway (Docker multi-stage + Nginx) |
| **Email** | Mailgun (API EU) |
| **Telephonie** | Ringover API |
| **IA** | Multi-provider (OpenAI, Anthropic, Google Gemini) |
| **Monitoring** | Sentry + Winston |

## Architecture

```
Frontend (React + Vite)
    |
    |-- Nginx reverse proxy (Docker)
    |       /auth/*  --> Backend
    |       /api/*   --> Backend
    |       /*       --> SPA (index.html)
    |
Backend (Node.js + Express)
    |
    |-- MongoDB Atlas
    |-- Mailgun (emails)
    |-- Ringover (telephonie)
    |-- OpenAI / Anthropic / Gemini (IA)
```

## Fonctionnalites

- **Authentification** : JWT + Google OAuth, inscription/connexion
- **Gestion artistes** : Profils, logos, metadonnees
- **Projets** : Albums, EPs, singles avec timeline de promotion
- **Campagnes email** : 8 templates pro, editeur WYSIWYG, envoi Mailgun
- **Contacts journalistes** : CRUD complet, import CSV, tags, engagement
- **Analytics** : Dashboard temps reel, ROI, heatmaps, insights IA
- **Telephonie** : Integration Ringover, click-to-call, historique
- **IMAP** : Synchronisation email bidirectionnelle
- **IA** : Generation de communiques, suggestions de contenu (multi-provider)
- **Uploads** : Images, audio, documents via Cloudinary

## Chiffres cles

| Metrique | Valeur |
|----------|--------|
| Composants React | 58 |
| Fichiers de routes API | 10 |
| Endpoints API | 91+ |
| Modeles de donnees | 12 |
| Fichiers de tests | 8 |
| Controllers | 10 |
| Middleware securite | 3 (auth, sanitize, validate) |

## URLs de production

- **Frontend** : `https://presspilot.up.railway.app`
- **Backend** : `https://backend-api-production-e103.up.railway.app`

## Demarrage rapide (developpement)

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local ou Atlas)

### Backend

```bash
cd backend
cp .env.example .env
# Configurer MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev
# Serveur sur http://localhost:3001
```

### Frontend

```bash
npm install
npm run dev
# Interface sur http://localhost:5173
```

### Variables d'environnement requises

**Backend** (`.env`) :
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<minimum 32 caracteres>
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
RINGOVER_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
ENCRYPTION_KEY=<32 caracteres hex>
```

**Frontend** (`.env`) :
```
VITE_API_URL=http://localhost:3001
VITE_CLOUDINARY_CLOUD_NAME=presspilot
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## Deploiement Railway

Le deploiement utilise Docker multi-stage :

1. **Frontend** : Build Vite -> Nginx (port 80) avec reverse proxy vers le backend
2. **Backend** : Node.js avec dumb-init, utilisateur non-root, health checks

```bash
# Deployer le frontend
railway up --detach

# Deployer le backend
cd backend && railway up --detach
```

Configuration Railway : voir `railway.toml` et `Dockerfile`.

## Tests

```bash
cd backend
npm test          # Tests avec coverage
npm run test:ci   # Mode CI
```

8 fichiers de tests couvrant : auth, contacts, securite, IA, health.

## Securite

- **Helmet** : CSP, HSTS, X-Frame-Options
- **Rate limiting** : 100 req/15min (global), 10/15min (auth), 30/15min (upload)
- **Sanitization** : Protection NoSQL injection + XSS
- **HPP** : Protection HTTP Parameter Pollution
- **CORS** : Whitelist explicite
- **Logging** : Winston JSON structure (pas de console.log)
- **Compression** : Gzip niveau 6

## Documentation

| Document | Description |
|----------|-------------|
| `RAPPORT_TECHNIQUE_COMPLET.md` | Rapport technique detaille |
| `CURRENT_STATUS.md` | Etat actuel du projet |
| `ANALYTICS_IMPLEMENTATION.md` | Systeme analytics |
| `EMAIL_MARKETING_GUIDE.md` | Systeme email Mailgun |
| `RINGOVER_PHONE_SYSTEM.md` | Integration telephonique |
| `TEMPLATES_README.md` | Templates email (8 types) |
| `backend/MONGODB_ATLAS_SETUP.md` | Configuration MongoDB Atlas |

## Repositories

- **Frontend** : `https://github.com/DenisAIagent/Frontend-PressPilot`
- **Backend** : `https://github.com/DenisAIagent/Backend-PressPilot`

---

PressPilot v1.0.1 - by BandStream
