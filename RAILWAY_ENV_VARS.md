# VARIABLES D'ENVIRONNEMENT RAILWAY - PRESSPILOT

**Derniere mise a jour :** 29 mars 2026

---

## Backend (Service Railway)

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | Connection string MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/presspilot?retryWrites=true&w=majority` |
| `JWT_SECRET` | Cle secrete JWT (min 32 caracteres) | `votre-secret-jwt-tres-long-et-securise` |
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port du serveur (Railway l'injecte automatiquement) | `3001` |
| `FRONTEND_URL` | URL du frontend pour CORS | `https://presspilot.up.railway.app` |

### Email (Mailgun)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MAILGUN_API_KEY` | Cle API Mailgun | `key-xxxxxxxxxxxxxxx` |
| `MAILGUN_DOMAIN` | Domaine Mailgun verifie | `mg.votredomaine.com` |
| `MAILGUN_FROM_EMAIL` | Adresse d'envoi | `noreply@votredomaine.com` |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Cle signature webhooks | `xxxxxxxxxxxxxxx` |
| `MAILGUN_BASE_URL` | URL API (EU) | `https://api.eu.mailgun.net` |

### Telephonie (Ringover)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `RINGOVER_API_KEY` | Cle API Ringover | `votre-cle-ringover` |

### IA Multi-Provider

| Variable | Description | Exemple |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Cle API OpenAI | `sk-xxxxxxxxxxxxxxx` |
| `ANTHROPIC_API_KEY` | Cle API Anthropic (Claude) | `sk-ant-xxxxxxxxxxxxxxx` |
| `GEMINI_API_KEY` | Cle API Google Gemini | `AIzaxxxxxxxxxxxxxxx` |
| `ENCRYPTION_KEY` | Cle de chiffrement pour les cles API utilisateur (32 chars hex) | `0123456789abcdef0123456789abcdef` |

### Logging

| Variable | Description | Exemple |
|----------|-------------|---------|
| `LOG_LEVEL` | Niveau de log Winston | `info` |
| `LOG_FILE` | Chemin fichier de log | `logs/combined.log` |

---

## Frontend (Service Railway)

### Build Args (Dockerfile)

Ces variables sont injectees au moment du build Vite via ARG dans le Dockerfile :

| Variable | Description | Valeur production |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL de base API | `""` (vide - meme origine, proxy nginx) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary | `presspilot` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Preset upload Cloudinary | `ml_default` |

### Runtime (Nginx)

| Variable | Description | Valeur production |
|----------|-------------|-------------------|
| `BACKEND_URL` | URL interne du backend (pour nginx proxy) | `http://backend:3001` ou URL Railway du backend |

**Important** : `VITE_API_URL` doit etre vide (`""`) en production. Le frontend envoie les requetes sur la meme origine, et nginx les proxy vers le backend. Cela evite les problemes de CORS et de double prefix `/api/`.

---

## Notes

1. **VITE_API_URL** : Ne pas definir cette variable dans Railway pour le frontend. Le Dockerfile utilise `ARG VITE_API_URL=""` par defaut, ce qui est correct pour la production.

2. **BACKEND_URL** : Cette variable est utilisee par le template nginx pour router les requetes `/api/*` et `/auth/*` vers le backend. Elle doit pointer vers l'URL interne Railway du service backend.

3. **ENCRYPTION_KEY** : Utilisee pour chiffrer les cles API IA des utilisateurs en base. Doit etre exactement 32 caracteres hexadecimaux. Ne jamais la changer une fois en production (les cles chiffrees deviendraient illisibles).

4. **JWT_SECRET** : Minimum 32 caracteres. Ne jamais la changer en production (les sessions existantes seraient invalidees).

---

*Mis a jour le 29 mars 2026*
