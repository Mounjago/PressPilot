# RAPPORT TECHNIQUE COMPLET - PRESSPILOT

**Date :** 29 mars 2026
**Version :** 1.0.1
**Statut :** Production - Deploye sur Railway

---

## OBJECTIF DU PROJET

PressPilot est une plateforme SaaS de gestion des relations presse pour artistes et labels musicaux. Elle centralise :

- La gestion des contacts journalistes et medias
- La creation et l'envoi de campagnes email avec tracking
- Le suivi analytique des interactions et du ROI
- L'integration telephonique (Ringover)
- La gestion des projets artistiques
- La generation de contenu IA (multi-provider)

---

## ARCHITECTURE TECHNIQUE

### Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React | 18.2.0 |
| Bundler | Vite | 4.5.0 |
| CSS | Tailwind CSS | 3.4.1 |
| Router | React Router DOM | 6.20.1 |
| HTTP Client | Axios | 1.6.7 |
| Charts | Recharts + Chart.js | 2.15.4 / 4.5.1 |
| Animations | Framer Motion | 10.16.16 |
| Icons | Lucide React + Heroicons | 0.546.0 / 2.2.0 |
| Rich Text | React Quill | 2.0.0 |
| Monitoring | Sentry | 7.94.0 |
| Backend | Express | 4.18.2 |
| ORM | Mongoose | 8.1.1 |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 / 2.4.3 |
| Securite | Helmet + HPP + express-rate-limit | 7.1.0 / 0.2.3 / 7.1.5 |
| Logging | Winston + Morgan | 3.11.0 / 1.10.0 |
| Tests | Jest + Supertest | 29.7.0 / 6.3.3 |
| BDD | MongoDB Atlas | via Mongoose 8.1 |

### Schema d'architecture

```
                     Internet
                        |
            +-----------+-----------+
            |                       |
   presspilot.up.railway.app    backend-api-production-e103.up.railway.app
            |                       |
     Nginx (Docker)           Node.js (Docker)
     - /auth/* -> proxy            |
     - /api/*  -> proxy      +-----+------+
     - /*      -> SPA        |     |      |
                          MongoDB  Mailgun  Ringover
                          Atlas    (email)  (phone)
```

### Frontend - Structure

```
src/
├── assets/          # Logo PressPilot, images
├── components/      # 58 composants React
│   ├── analytics/   # 8 composants (MetricsCard, HeatmapView, ROICalculator...)
│   ├── contacts/    # 10 composants (ContactCard, ContactList, ContactModal...)
│   ├── phone/       # 4 composants (PhoneSystem, CallModal, CallHistory...)
│   ├── phoning/     # 5 composants (SessionCreation, Management...)
│   ├── templates/   # 2 composants (EmailTemplates, EmailTemplatesPart2)
│   ├── Layout.jsx   # Layout principal avec sidebar
│   ├── Sidebar.jsx  # Navigation laterale
│   ├── AiModal.jsx  # Modal IA multi-provider
│   └── ...
├── contexts/        # React Context (auth, state)
├── hooks/           # Custom hooks (useApi...)
├── pages/           # 13+ pages
│   ├── Dashboard.jsx
│   ├── Artists.jsx
│   ├── Campaigns.jsx
│   ├── Contacts.jsx
│   ├── Analytics.jsx
│   ├── Settings.jsx
│   ├── Phoning.jsx
│   └── ...
├── services/        # 7 services API
│   ├── analyticsApi.js
│   ├── artistsApi.js
│   ├── callsApi.js
│   ├── campaignsApi.js
│   ├── cloudinary.js
│   ├── projectsApi.js
│   └── ringoverService.js
├── styles/          # CSS (Dashboard, Templates...)
├── utils/           # 7 utilitaires
├── api.js           # Client Axios configure
├── App.jsx          # Routes + ErrorBoundary
├── config.js        # Configuration frontend
└── main.jsx         # Point d'entree React
```

### Backend - Structure

```
backend/
├── config/
│   └── database.js       # Connexion MongoDB (pool 10, timeout 5s)
├── controllers/          # 10 controllers
│   ├── authController.js
│   ├── contactsController.js
│   ├── campaignsController.js
│   ├── projectsController.js
│   ├── artistsController.js
│   ├── analyticsController.js
│   ├── messagesController.js
│   ├── imapController.js
│   ├── uploadsController.js
│   └── aiController.js
├── middleware/           # 3 middleware
│   ├── auth.js          # JWT verification
│   ├── sanitize.js      # NoSQL injection + XSS protection
│   └── validate.js      # express-validator wrapper
├── models/              # 12 modeles Mongoose
│   ├── User.js
│   ├── Artist.js
│   ├── Project.js
│   ├── Campaign.js
│   ├── Contact.js
│   ├── Message.js
│   ├── AnalyticsMetric.js
│   ├── EmailTracking.js
│   ├── IMAPConfiguration.js
│   ├── JournalistProfile.js
│   ├── UnassociatedEmail.js
│   └── Call.js
├── routes/              # 10 fichiers de routes (91+ endpoints)
│   ├── auth.js          # 9 endpoints
│   ├── contacts.js      # 13 endpoints
│   ├── campaigns.js     # 14 endpoints
│   ├── projects.js      # 14 endpoints
│   ├── artists.js       # 5 endpoints
│   ├── analytics.js     # 6 endpoints
│   ├── messages.js      # 11 endpoints
│   ├── imap.js          # 10 endpoints
│   ├── uploads.js       # 9 endpoints
│   └── ai.js            # 4 endpoints (multi-provider)
├── tests/               # 8 fichiers de tests
│   ├── auth.test.js
│   ├── integration-auth.test.js
│   ├── integration-contacts.test.js
│   ├── integration-ai.test.js
│   ├── security.test.js
│   ├── health.test.js
│   ├── setup.js
│   └── helpers.js
├── server.js            # Point d'entree Express (508 lignes)
├── Dockerfile           # Multi-stage (dev + production)
├── jest.config.js       # Configuration tests
└── package.json         # v1.0.0
```

---

## SECURITE

### Headers HTTP (Helmet)

- Content-Security-Policy avec directives strictes
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- HSTS: max-age 1 an avec preload
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera, microphone, geolocation, payment restreints

### Rate Limiting

| Contexte | Production | Developpement |
|----------|-----------|---------------|
| Global | 100 req/15min | 1000 req/15min |
| Auth | 10 req/15min | 100 req/15min |
| Upload | 30 req/15min | 200 req/15min |

### Middleware de securite

1. **auth.js** : Verification JWT (Bearer token), validation signature, user inject
2. **sanitize.js** : Nettoyage recursif body/query/params, blocage operateurs MongoDB ($), strip XSS
3. **validate.js** : Validation express-validator avec retour 400

### CORS

- Whitelist : FRONTEND_URL + localhost:5173 + localhost:4173
- Methodes : GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials : true
- Preflight cache : 24h

### Limites requetes

- JSON body : 1 MB max
- URL-encoded : 1 MB max
- Uploads : configurable par endpoint

---

## DEPLOIEMENT

### Docker Frontend (Multi-stage)

**Stage 1 - Build** : `node:20-alpine`
- npm ci pour installation deterministe
- Build Vite avec ARG (VITE_API_URL, VITE_CLOUDINARY_*)
- VITE_API_URL="" en production (meme origine, proxy nginx)

**Stage 2 - Production** : `nginx:1.25-alpine`
- Template nginx avec envsubst pour BACKEND_URL
- Assets caches 1 an (fichiers hashes Vite)
- Health check : GET /health (JSON 200)
- Permissions non-root (nginx user)

### Docker Backend (Multi-stage)

**Base** : `node:20-alpine` + dumb-init
**Production** :
- npm ci --only=production
- Utilisateur non-root : presspilot (UID 1001)
- Repertoires : uploads/*, logs/
- Health check : wget /health (30s interval)
- PID 1 : dumb-init pour signal handling

### Nginx Configuration

| Location | Action |
|----------|--------|
| `/assets/` | Static files, cache 1 an |
| `/health` | Health check endpoint (200 OK JSON) |
| `/api/` | Proxy vers ${BACKEND_URL}/api/ |
| `/auth/` | Proxy vers ${BACKEND_URL}/auth/ |
| `/` | SPA fallback (try_files -> index.html) |
| `/\.` | Deny (fichiers caches) |

Proxy : HTTP/1.1 upgrade, headers (Host, X-Real-IP, X-Forwarded-*), timeout 60s.

### Railway

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
buildTarget = "production"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

---

## FONCTIONNALITES PAR SPRINT

### Sprint 1 - Architecture de base
- Configuration React + Vite + Tailwind CSS
- Systeme d'authentification JWT
- Pages Login/Register
- Client HTTP Axios avec intercepteurs
- Structure composants modulaire

### Sprint 2 - Backend robuste
- Express.js avec middleware securise
- MongoDB + Mongoose (12 modeles)
- Routes CRUD completes (contacts, campagnes, projets, artistes)
- Gestion erreurs avancee
- Logging Winston

### Sprint 3 - Gestion des contacts
- CRUD contacts complet avec pagination
- Import/export CSV
- Systeme de tags et filtres
- Recherche full-text
- Engagement tracking

### Sprint 4 - Campagnes email
- Creation et envoi via Mailgun
- 8 templates professionnels
- Editeur WYSIWYG (React Quill)
- Variables dynamiques par campagne
- Preview multi-device

### Sprint 5 - Analytics
- Dashboard avec KPIs temps reel
- Heatmaps temporelles
- ROI calculator
- Profils journalistes avec scoring
- Best Times Intelligence

### Sprint 6 - Telephonie
- Integration Ringover API
- Click-to-call depuis contacts
- Historique et notes d'appels
- Sessions de phoning
- Statistiques d'appels

### Sprint 7 - IMAP et messages
- Configuration IMAP par utilisateur
- Synchronisation emails bidirectionnelle
- Tracking emails (opens, clicks, replies)
- File d'attente emails non associes

### Sprint 8 - Uploads et medias
- Upload multi-type (images, audio, documents)
- Integration Cloudinary
- Gestion avatars et covers artistes
- Stockage organise par categorie

### Sprint 9 - Securite et tests
- Helmet CSP complet
- Rate limiting triple (global, auth, upload)
- Sanitization NoSQL + XSS
- 8 fichiers de tests (auth, contacts, securite, AI, health)
- Winston logging JSON structure (0 console.log)

### Sprint 10 - IA Multi-Provider
- Settings IA par utilisateur
- Support OpenAI, Anthropic (Claude), Google Gemini
- Cles API chiffrees (ENCRYPTION_KEY)
- Selection de modele par provider
- Test de connexion integre
- Generation de communiques de presse

---

## ROUTES ET API FRONTEND

### Routes publiques
| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Page d'accueil |
| `/login` | Login | Connexion |
| `/register` | Register | Inscription |
| `/test` | TestPage | Diagnostic |
| `/test-connectivity` | TestConnectivity | Test reseau |

### Routes protegees (JWT requis)
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Tableau de bord principal |
| `/artists` | Artists | Gestion artistes |
| `/projects` | Projects | Gestion projets |
| `/artists/:id/projects` | Projects | Projets par artiste |
| `/artists/:aid/projects/:pid/campaigns` | Campaigns | Campagnes par projet |
| `/contacts` | Contacts | Base journalistes |
| `/campaigns` | Campaigns | Campagnes email |
| `/phoning` | Phoning | Systeme telephonique |
| `/analytics` | Analytics | Dashboard analytics |
| `/analytics/campaigns/:id` | CampaignAnalytics | Analytics campagne |
| `/analytics/journalists/:id` | JournalistAnalytics | Analytics journaliste |
| `/analytics/best-times` | BestTimesAnalytics | Creneaux optimaux |
| `/settings` | Settings | Parametres + IA |

---

## LOGGING

### Configuration Winston

- **Format** : JSON structure avec timestamp
- **Production** : Fichiers rotates (error.log 5MB, combined.log 10MB)
- **Developpement** : Console avec colorisation
- **Niveaux** : error, warn, info, http, debug
- **Convention** : Tous les 10 controllers utilisent Winston, 0 console.log

### Morgan HTTP

- Requetes HTTP loguees via Morgan -> Winston stream
- Format : combined (production), dev (developpement)

---

## BASE DE DONNEES

### MongoDB Atlas

- **Cluster** : presspilot-production (AWS eu-central-1)
- **Tier** : M0 (512 MB gratuit)
- **Connection** : Pool 10, serverSelectionTimeout 5s, socketTimeout 45s
- **Collections** : users, artists, projects, campaigns, contacts, emailtrackings, calls, messages, analyticsmetrics, imapconfigurations, journalistprofiles, unassociatedemails

### Modeles principaux

| Modele | Champs cles | Relations |
|--------|-------------|-----------|
| User | email, password (bcrypt), name, organization, role | - |
| Artist | name, genre, bio, social links, logo | -> Projects, Campaigns |
| Project | title, artist_id, type, release_date | -> Artist, Campaigns |
| Campaign | title, project_id, status, dates, email stats | -> Project, Contacts |
| Contact | name, email, phone, outlet, specialties, tags | -> Campaigns |
| EmailTracking | message_id, recipient, event_type, timestamp | -> Campaign |
| Call | contact_id, duration, status, notes, ringover_call_id | -> Contact, User |

---

## TESTS

### Configuration
- **Framework** : Jest 29.7 + Supertest 6.3
- **Environnement** : node + MongoDB Memory Server
- **Timeout** : 10 000 ms
- **Coverage** : controllers, middleware, routes

### Fichiers de tests

| Fichier | Lignes | Couverture |
|---------|--------|------------|
| auth.test.js | 433 | Auth flow, tokens, validation |
| integration-auth.test.js | 433 | Lifecycle complet auth |
| integration-contacts.test.js | 387 | CRUD contacts, import/export |
| integration-ai.test.js | ~200 | IA multi-provider, settings |
| security.test.js | 246 | CORS, rate limit, sanitization |
| health.test.js | ~100 | Health endpoint, 404, JSON errors |

---

## BRANDING

- **Couleur principale** : #0ED894 (vert)
- **Noir** : #000000
- **Fond** : #FFFFFF
- **Accent secondaire** : #EBF5DF
- **Police titre** : GOODLY
- **Police corps** : Poppins
- **Logo** : src/assets/logo-presspilot.png (P aile verte + texte)

---

## ENVIRONNEMENTS

### Production
- **Frontend** : https://presspilot.up.railway.app
- **Backend** : https://backend-api-production-e103.up.railway.app
- **BDD** : MongoDB Atlas (eu-central-1)

### Developpement
- **Frontend** : http://localhost:5173 (Vite)
- **Backend** : http://localhost:3001 (Express)
- **BDD** : MongoDB local ou Atlas

### Repositories GitHub
- **Frontend** : https://github.com/DenisAIagent/Frontend-PressPilot
- **Backend** : https://github.com/DenisAIagent/Backend-PressPilot

---

## CONCLUSION

PressPilot est une plateforme complete et fonctionnelle, deployee en production sur Railway avec :

- **91+ endpoints API** repartis sur 10 fichiers de routes
- **58 composants React** pour une interface riche et responsive
- **12 modeles de donnees** MongoDB
- **8 fichiers de tests** couvrant auth, contacts, securite et IA
- **Securite renforcee** : Helmet, rate limiting, sanitization, JWT
- **IA multi-provider** : OpenAI, Anthropic, Google Gemini
- **Deploiement Docker** : multi-stage, nginx proxy, health checks, non-root

---

*Rapport mis a jour le 29 mars 2026 - PressPilot v1.0.1*
