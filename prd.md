# PRD - PressPilot by BandStream

## Product Requirements Document
**Version:** 1.0.1
**Date:** 31 mars 2026
**Statut:** Production
**URL Production:** https://presspilot.up.railway.app
**Backend API:** https://backend-api-production-e103.up.railway.app

---

## 1. Vision Produit

### 1.1 Probleme
Les attaches de presse et les equipes RP de l'industrie musicale jonglent entre des outils fragmentes (emails, tableurs, CRM generiques) pour gerer leurs campagnes de promotion. Aucune solution n'est specifiquement concue pour leurs besoins : gestion d'artistes, suivi de journalistes, campagnes email ciblees, phoning, et analytics de performance.

### 1.2 Solution
**PressPilot** est une plateforme SaaS duale de gestion des relations presse, specialisee pour l'industrie musicale. Elle offre deux interfaces distinctes partageant une base de donnees unifiee :

- **Interface Attaches de Presse** : Gestion d'artistes, projets, campagnes email, phoning, analytics
- **Interface BandStream RP** : Communiques de presse corporate, evenements, media kits
- **Interface Administration** : Gestion des utilisateurs, organisations, analytics globales

### 1.3 Utilisateurs Cibles

| Persona | Description | Interface |
|---------|-------------|-----------|
| **Attache de presse freelance** | Gere 5-10 artistes, 200+ contacts journalistes | Press |
| **RP Manager de label** | Equipe gerant la presse pour un label musical | Press |
| **Equipe Communication Corporate** | Communication interne BandStream | RP |
| **Administrateur plateforme** | Gestion systeme et supervision | Admin |

### 1.4 Metriques de Succes

| Metrique | Baseline | Objectif 6 mois | Objectif 12 mois |
|----------|----------|-----------------|------------------|
| Utilisateurs actifs mensuels | 450 | 630 | 900 |
| Duree moyenne session | 12 min | 8 min | 6 min |
| Taux erreur navigation | 15% | 5% | 2% |
| NPS Score | 6.5 | 8.0 | 8.5 |
| Campagnes creees | - | +60% | +100% |

---

## 2. Architecture Technique

### 2.1 Stack Technologique

#### Frontend
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | React | 18.2.0 |
| Build | Vite | 4.5.0 |
| Routing | React Router DOM | 6.20.1 |
| Styling | Tailwind CSS | 3.4.1 |
| State | React Context + Zustand | - |
| HTTP | Axios | 1.6.7 |
| Charts | Recharts + Chart.js | 2.15.4 / 4.5.1 |
| Editeur | React Quill | 2.0.0 |
| Icones | Lucide React | 0.546.0 |
| Animations | Framer Motion | 10.16.16 |
| Sanitization | DOMPurify | 3.3.3 |
| Monitoring | Sentry | 7.94.0 |

#### Backend
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express | 4.18.2 |
| ORM | Mongoose | 8.1.1 |
| Auth | jsonwebtoken | 9.0.2 |
| Hash | bcryptjs | 2.4.3 |
| Securite | Helmet | 7.1.0 |
| Rate Limit | express-rate-limit | 7.1.5 |
| Validation | express-validator | 7.0.1 |
| Logging | Winston + Morgan | 3.11.0 |
| Queue | Bull | 4.12.0 |
| Cache | ioredis | 5.3.2 |
| Tests | Jest + Supertest | 29.7.0 |

#### Infrastructure
| Composant | Technologie |
|-----------|-------------|
| Base de donnees | MongoDB Atlas |
| Hebergement | Railway (Docker) |
| Reverse proxy | Nginx |
| Email transactionnel | Mailgun (EU API) |
| Telephonie | Ringover |
| Images | Cloudinary |
| Monitoring | Sentry |

### 2.2 Diagramme d'Architecture

```
+---------------------------------------------------+
|              FRONTEND (React 18 + Vite)            |
|     Nginx Reverse Proxy (port 80)                  |
|     /auth/* -> Backend | /api/* -> Backend         |
|     /*      -> SPA (index.html)                    |
+-------------------------+-------------------------+
                          |
                    HTTPS  |
                          |
+-------------------------v-------------------------+
|            BACKEND (Node.js + Express)             |
|                    Port 3001                       |
+----+--------+--------+--------+--------+----------+
     |        |        |        |        |
  MongoDB  Mailgun  Ringover  OpenAI  Cloudinary
  Atlas    (Email)  (Phone)   Claude   (Images)
                              Gemini
```

### 2.3 Structure du Code

```
Frontend (src/)
  pages/           22 pages
  components/      58 composants React
  services/        11 services API
  contexts/        AuthContext, WorkspaceContext
  styles/          25+ fichiers CSS
  utils/           Helpers

Backend (backend/)
  routes/          14 fichiers de routes
  controllers/     14 controleurs
  models/          16 modeles MongoDB
  middleware/      Auth, validation, errors
  server.js        Configuration Express
```

---

## 3. Fonctionnalites

### 3.1 Authentification & Autorisations

#### Flux d'authentification
1. **Inscription** : Email + mot de passe, verification email optionnelle
2. **Connexion** : Email/password avec rate limiting (10 tentatives/15min), lockout apres 5 echecs (2h)
3. **Google OAuth** : Connexion via @react-oauth/google
4. **JWT** : Token 1h + refresh token, stockage localStorage
5. **Selection workspace** : Redirection automatique selon role ou choix si multi-role

#### Matrice des Roles

| Role | Interface Press | Interface RP | Administration |
|------|:-:|:-:|:-:|
| `press_agent` | Oui | Non | Non |
| `bandstream_rp` | Non | Oui | Non |
| `admin` | Oui | Oui | Partiel |
| `super_admin` | Oui | Oui | Complet |

#### Securite
- JWT Secret minimum 32 caracteres
- Hachage bcryptjs (10 salt rounds)
- CORS whitelist explicite (pas de wildcard)
- Helmet (CSP, HSTS, X-Frame-Options, nosniff)
- Protection NoSQL injection (mongoose-validator + sanitize-mongo-db)
- Protection XSS (DOMPurify)
- Protection HPP (express-hpp)
- HTTPS obligatoire en production

#### Rate Limiting

| Endpoint | Limite | Fenetre |
|----------|--------|---------|
| Global | 100 req | 15 min |
| Auth | 10 req | 15 min |
| Upload | 30 req | 15 min |
| Analytics | 20 req | 15 min |

---

### 3.2 Interface Attaches de Presse

#### 3.2.1 Dashboard (`/press/dashboard`)
- **KPI Cards** : Total contacts, campagnes, emails envoyes, taux d'ouverture moyen
- **Activite recente** : 10 dernieres interactions
- **Metriques de croissance** : Tendances mensuelles
- **Performance campagnes** : Stats en cours
- **Graphiques** : Visualisation Recharts

#### 3.2.2 Gestion des Artistes (`/press/artists`)

**CRUD complet :**
- Creation avec bio, genre, liens sociaux
- Upload photo de profil (Cloudinary)
- Edition des metadonnees
- Archivage

**Champs :**
- Nom, genre, biographie
- Liens sociaux (Instagram, Facebook, Twitter, YouTube, Spotify, Deezer, Apple Music)
- Email, telephone, site web
- Logo/image de profil

#### 3.2.3 Gestion des Projets (`/press/projects`)

**Fonctionnalites :**
- Creation albums, EPs, singles associes a un artiste
- Gestion des dates de sortie
- Classification par type (Album/EP/Single/Mixtape)
- Hierarchie projet-campagne
- CRUD complet avec pagination

#### 3.2.4 Gestion des Campagnes (`/press/campaigns`)

**Cycle de vie complet :**

**1. Creation**
- Nom, type, dates
- Association artiste/projet
- Selection des contacts (multi-select)
- Gestion de statut (draft/scheduled/sent/completed)

**2. Composition Email**
- **8 templates professionnels :**
  - Communique (annonce officielle)
  - Teaser/Annonce (court, percutant)
  - Demande d'interview (sollicitation journaliste)
  - Demande de chronique (critique album)
  - Exclusivite/Premiere (media en premier)
  - Pitch Playlist (curateurs/radios)
  - Invitation evenement (concert/showcase)
  - Relance (rappel poli)
- Editeur WYSIWYG (React Quill)
- Variables dynamiques ({{artistName}}, {{releaseDate}}, etc.)
- Previsualisation multi-device (desktop, tablette, mobile)

**3. Envoi**
- Validation email
- Integration Mailgun (EU API)
- Envoi par batch avec pixels de tracking
- Segmentation contacts
- Interpolation de variables par destinataire
- Gestion desinscription (conformite RGPD)

**4. Suivi**
- Tracking ouvertures en temps reel (pixel)
- Tracking clics (reecriture de liens)
- Detection reponses (IMAP)
- Gestion bounces/plaintes
- Webhooks Mailgun

#### 3.2.5 Gestion des Contacts (`/press/contacts`)

**Fonctionnalites :**
- CRUD complet avec 50+ champs
- Recherche avancee (full-text, multi-criteres)
- Pagination (50 items/page)
- Systeme de tags
- Historique d'engagement par contact
- **Import/Export CSV** : Mapping automatique, detection doublons
- **Import JSON par batch**
- Segmentation (personnel/partage/corporate)

**Champs principaux :**
Nom, prenom, email, telephone, media, specialite, role, localisation, pays, reseaux sociaux, metriques engagement, derniere date de contact, notes, tags

#### 3.2.6 Systeme de Phoning (Integration Ringover)

**Fonctionnalites :**
- **Click-to-Call** : Appel direct depuis la fiche contact
- **Sessions de phoning** : Creation de sessions structurees
- **Workflow d'appel** :
  1. Selection artiste -> projet -> liste de contacts
  2. Appel sequentiel des contacts
  3. Timer en cours d'appel
  4. Prise de notes en direct
  5. Statut d'appel (repondu/non-repondu/occupe/manque)
- **Historique d'appels** : Log complet avec timestamps

#### 3.2.7 Suite Analytics

**Dashboard principal** (`/press/analytics`)
- KPIs : Taux ouverture, clics, reponses, score engagement
- Metriques comparatives periode sur periode
- Funnel de conversion : Envoye -> Ouvert -> Clique -> Repondu
- Top performers : Meilleures campagnes et journalistes
- Insights IA : Detection d'anomalies et recommandations
- Charts : Heatmaps, barres, lignes

**Analytics par campagne** (`/press/analytics/campaigns/:id`)
- Metriques heure par heure
- Heatmap : Heures/jours avec le plus d'ouvertures
- Analyse de liens : Tracking par lien
- Segmentation device : Mobile vs Desktop vs Tablette
- Calculateur ROI

**Profil journaliste** (`/press/analytics/journalists/:id`)
- **Score d'affinite** : Algorithme proprietaire
  - Taux ouverture (30%)
  - Taux clic (40%)
  - Taux reponse (30%)
  - Bonus consistance + recence
- **Predictions comportementales** : ML (20-95% confiance)
- **Meilleurs moments de contact** : Fenetres d'envoi optimales individuelles
- **Journalistes similaires** : Recommandations par clustering

**Intelligence temporelle** (`/press/analytics/best-times`)
- Heatmap 24x7 : Performance par heure et jour
- Patterns temporels automatiques
- Recommandations ML avec niveaux de confiance
- Global vs individuel

#### 3.2.8 Integration IA (Multi-Provider)

**Providers supportes :**
- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic Claude (Sonnet, Haiku)
- Google Gemini (Pro, Flash)

**Fonctionnalites :**
- Gestion des cles API (chiffrement AES-256 par utilisateur)
- Selection modele
- Test de connexion integre
- Generation de contenu :
  - Communiques de presse (avec personnalisation ton/style)
  - Suggestions de sujets d'email
  - Optimisation descriptions de campagne
  - Resumes de recherche sur les contacts

#### 3.2.9 Parametres (`/press/settings`)
- Profil utilisateur (nom, email, telephone, avatar)
- Preferences (notifications, signature email, type campagne par defaut)
- Integrations (IMAP, cles API IA, Ringover, webhooks)

---

### 3.3 Interface BandStream RP

#### 3.3.1 Dashboard (`/rp/dashboard`)
- KPIs corporate : Mentions presse, reach, score sentiment
- Communications a venir : Timeline des releases programmes
- Calendrier evenements
- Activite recente
- Campagnes actives

#### 3.3.2 Communiques de Presse (`/rp/press-releases`)
- **Creation** : Editeur riche avec templates
- **Metadonnees** : Titre, date embargo, type (annonce, partenariat, levee de fonds, evenement)
- **Distribution** : Multi-destinataires, personnalisation, programmation
- **Tracking** : Ouvertures, clics, mentions medias

#### 3.3.3 Gestion d'Evenements (`/rp/events`)
- Creation evenement (titre, date, lieu, description)
- **Systeme d'invitation** : Envoi en masse, suivi RSVP, confirmation, liste d'attente
- Assets : Banniere, media kit, programme
- **Suivi post-evenement** : Remerciements, distribution photos/enregistrements

#### 3.3.4 Media Kits (`/rp/media-kits`)
- Organisation des assets (logos, bios, fiches, images)
- Generation automatique PDF
- Liens partageables publics avec tracking d'acces
- Controle de version
- Suivi des telechargements

#### 3.3.5 Contacts Corporate (`/rp/contacts`)
- Liste contacts specifique corporate (tech media, business musical, influenceurs)
- Memes fonctionnalites que l'interface Press (recherche, tags, import/export)

#### 3.3.6 Analytics Corporate
- Tracking mentions (mentions "BandStream" dans la presse)
- Metriques de reach (audience estimee par publication)
- Analyse de sentiment (positif/negatif/neutre)
- Estimation valeur media
- Comparaison aux benchmarks industrie

---

### 3.4 Interface Administration

#### 3.4.1 Dashboard Admin (`/admin/dashboard`)
- Metriques globales : Total utilisateurs, actifs, organisations
- Statistiques d'usage : Emails envoyes, appels, campagnes
- Sante systeme : Status DB, services externes
- Activite utilisateurs : Inscriptions recentes, sessions actives

#### 3.4.2 Gestion des Utilisateurs (`/admin/users`)
- Liste avec filtres (role, organisation, statut)
- Actions : Creation, edition, attribution/revocation roles, activation/desactivation, reset mot de passe
- Attribution workspaces (press/rp/les deux)
- Log d'activite par utilisateur

#### 3.4.3 Gestion des Organisations (`/admin/organizations`)
- CRUD organisations (labels, agences, departements corporate)
- Attribution utilisateurs
- Parametres (nom, industrie, taille)
- Statistiques d'usage par organisation

---

## 4. Modele de Donnees

### 4.1 Collections MongoDB (16)

| Collection | Description | Relations |
|------------|-------------|-----------|
| **User** | Authentification, profil, preferences | -> Organizations |
| **Artist** | Profils artistes avec logos | -> User, -> Projects |
| **Project** | Albums, EPs, singles | -> Artist, -> Campaigns |
| **Campaign** | Campagnes email avec templates | -> Artist, -> Project, -> Contacts |
| **Contact** | Base journalistes/medias | -> User, -> Tags |
| **EmailTracking** | Opens, clicks, replies | -> Campaign, -> Contact |
| **Call** | Logs d'appels Ringover | -> Contact, -> User |
| **JournalistProfile** | Scoring engagement et predictions | -> Contact |
| **AnalyticsMetric** | Metriques cachees | -> Campaign |
| **IMAPConfiguration** | Parametres sync email | -> User |
| **Message** | Emails syncs IMAP | -> Contact |
| **UnassociatedEmail** | Emails en attente de matching | - |
| **PressRelease** | Communiques corporate | -> Contacts |
| **Event** | Evenements corporate | -> Contacts |
| **MediaKit** | Kits media | -> Assets |
| **Organization** | Profils entreprises/labels | -> Users |

### 4.2 Relations

```
User
  |-- Artists (1:N via user_id, workspace_id)
  |-- Contacts (1:N via user_id, workspace_id)
  |-- Campaigns (1:N via user_id, workspace_id)
  |-- Calls (1:N via user_id)
  +-- Settings (1:1 via user_id)

Artist
  |-- Projects (1:N via artist_id)
  +-- Campaigns (1:N via artist_id)

Project
  +-- Campaigns (1:N via project_id)

Campaign
  |-- EmailTrackings (1:N via campaign_id)
  +-- Contacts (M:N)

Contact
  |-- EmailTrackings (1:N via contact_id)
  |-- JournalistProfile (1:1 via contact_id)
  |-- Calls (1:N via contact_id)
  +-- Tags (M:N array)
```

---

## 5. API Endpoints (91+)

### 5.1 Authentification
```
POST   /auth/register
POST   /auth/login
POST   /auth/google-callback
POST   /auth/refresh-token
POST   /auth/logout
GET    /auth/profile
PUT    /auth/profile
POST   /auth/change-password
```

### 5.2 Contacts
```
GET    /api/contacts                    Liste avec pagination
POST   /api/contacts                    Creation
PUT    /api/contacts/:id                Mise a jour
DELETE /api/contacts/:id                Archivage
GET    /api/contacts/:id                Detail
GET    /api/contacts/search?q=term      Recherche full-text
POST   /api/contacts/import/csv         Import CSV
POST   /api/contacts/import/json        Import JSON batch
GET    /api/contacts/export             Export CSV
POST   /api/contacts/:id/tags           Ajout tag
DELETE /api/contacts/:id/tags/:tag      Suppression tag
GET    /api/contacts/stats              Statistiques
```

### 5.3 Campagnes
```
GET    /api/campaigns                   Liste
POST   /api/campaigns                   Creation
PUT    /api/campaigns/:id               Mise a jour
DELETE /api/campaigns/:id               Suppression
GET    /api/campaigns/:id               Detail
GET    /api/campaigns/:id/stats         Stats campagne
POST   /api/campaigns/:id/send          Envoi campagne
POST   /api/campaigns/:id/test          Email test
GET    /api/campaigns/service/status    Sante Mailgun
```

### 5.4 Artistes
```
GET    /api/artists                     Liste
POST   /api/artists                     Creation
PUT    /api/artists/:id                 Mise a jour
DELETE /api/artists/:id                 Suppression
GET    /api/artists/:id                 Detail
GET    /api/artists/:id/projects        Projets associes
```

### 5.5 Projets
```
GET    /api/projects                    Liste
POST   /api/projects                    Creation
PUT    /api/projects/:id                Mise a jour
DELETE /api/projects/:id                Suppression
GET    /api/projects/:id                Detail
GET    /api/projects/:id/campaigns      Campagnes associees
```

### 5.6 Analytics
```
GET    /api/analytics/dashboard         Dashboard principal
GET    /api/analytics/campaigns/:id     Detail campagne
GET    /api/analytics/journalists/:id   Profil journaliste
GET    /api/analytics/best-times        Meilleurs moments d'envoi
GET    /api/analytics/track/open/:id    Webhook ouverture
GET    /api/analytics/track/click/:id   Webhook clic
```

### 5.7 Appels (Ringover)
```
GET    /api/calls                       Liste
POST   /api/calls                       Creation
PUT    /api/calls/:id                   Mise a jour
DELETE /api/calls/:id                   Suppression
PATCH  /api/calls/:id/notes             Mise a jour notes
GET    /api/calls/recent                Appels recents
GET    /api/calls/stats                 Statistiques
```

### 5.8 IA
```
POST   /api/ai/generate-press-release   Generation texte
POST   /api/ai/test-connection          Test cle API
GET    /api/ai/models                   Modeles disponibles
```

### 5.9 Communiques de Presse (RP)
```
GET    /api/press-releases              Liste
POST   /api/press-releases              Creation
PUT    /api/press-releases/:id          Mise a jour
DELETE /api/press-releases/:id          Suppression
POST   /api/press-releases/:id/send     Envoi
```

### 5.10 Evenements (RP)
```
GET    /api/events                      Liste
POST   /api/events                      Creation
PUT    /api/events/:id                  Mise a jour
DELETE /api/events/:id                  Suppression
POST   /api/events/:id/invite           Envoi invitations
GET    /api/events/:id/rsvps            RSVPs
```

### 5.11 Media Kits (RP)
```
GET    /api/media-kits                  Liste
POST   /api/media-kits                  Creation
PUT    /api/media-kits/:id              Mise a jour
DELETE /api/media-kits/:id              Suppression
POST   /api/media-kits/:id/generate-pdf Generation PDF
GET    /api/media-kits/:id/download     Lien telechargement
```

### 5.12 Administration
```
GET    /api/admin/users                 Liste utilisateurs
POST   /api/admin/users                 Creation utilisateur
PUT    /api/admin/users/:id             Mise a jour
DELETE /api/admin/users/:id             Suppression
GET    /api/admin/organizations         Liste organisations
POST   /api/admin/organizations         Creation
PUT    /api/admin/organizations/:id     Mise a jour
DELETE /api/admin/organizations/:id     Suppression
GET    /api/admin/analytics             Analytics globales
```

### 5.13 Email & IMAP
```
POST   /api/email/webhooks/mailgun      Webhook Mailgun
POST   /api/imap/configure              Configuration IMAP
GET    /api/imap/status                 Status sync
POST   /api/imap/sync                   Sync manuelle
GET    /api/email/unassociated          Emails non-associes
POST   /api/email/unassociated/:id/associate  Association
```

### 5.14 Uploads & Sante
```
POST   /api/uploads                     Upload fichier
POST   /api/uploads/batch               Upload multiple
GET    /health                          Health check
```

---

## 6. Integrations Externes

### 6.1 Mailgun (Email)
- **API EU** : https://api.eu.mailgun.net
- Envoi en masse avec tracking (pixels + reecriture liens)
- Webhooks : delivered, opened, clicked, bounced, complained, unsubscribed
- Configuration DKIM/SPF
- Gestion desinscription RGPD

### 6.2 Ringover (Telephonie)
- Click-to-call via API SIP
- Historique d'appels
- Metriques qualite d'appel
- Enregistrement d'appel (optionnel)

### 6.3 IA Multi-Provider
- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic Claude (Sonnet, Haiku)
- Google Gemini (Pro, Flash)
- Cles API chiffrees AES-256 par utilisateur

### 6.4 Cloudinary (Images)
- Avatars artistes
- Photos de profil
- Images templates email
- Assets media kits

### 6.5 IMAP (Sync Email)
- Configuration par utilisateur (Gmail, Office365, custom)
- Sync bidirectionnelle
- Association automatique aux contacts
- File d'attente emails non-associes

### 6.6 Firebase (Auth optionnel)
- Google OAuth via Firebase Auth
- Configuration optionnelle

---

## 7. Securite & Conformite

### 7.1 Resultats Audit Claude-Flow

| Severite | Nombre | Description |
|----------|--------|-------------|
| **HIGH** | 11 | Mots de passe hardcodes (backend/config, tests, apiTest.js) |
| **MEDIUM** | 11 | 4 CVEs (esbuild, quill, react-quill, vite) + 5 XSS (innerHTML) + 1 React XSS |
| **LOW** | 0 | - |

### 7.2 Complexite du Code

| Fichier | Cyclomatic | Cognitive | LOC | Rating |
|---------|-----------|-----------|-----|--------|
| CSVImporter.jsx | 76 | 282 | 875 | Very Complex |
| Artists.jsx | 69 | 206 | 1524 | Very Complex |
| Projects.jsx | 60 | 193 | 687 | Very Complex |
| AuthContext.jsx | 41 | 57 | 423 | Very Complex |
| CampaignEmailManager.jsx | 39 | 59 | 411 | Very Complex |
| CallHistory.jsx | 39 | 44 | 367 | Very Complex |

**46 fichiers signales** (complexite moyenne : 13)
**17 dependances circulaires** (severite basse)

### 7.3 Mesures de Protection Implementees
- JWT avec refresh tokens
- Hachage bcryptjs (10 rounds)
- Helmet (CSP, HSTS, X-Frame-Options)
- Rate limiting global et par endpoint
- Protection NoSQL injection
- Protection XSS (DOMPurify)
- Protection HPP
- CORS whitelist stricte
- Chiffrement AES-256 pour cles API utilisateur
- Isolation des donnees par workspace_id

### 7.4 Actions Correctives Prioritaires
1. **P0** : Supprimer tous les secrets hardcodes du code source
2. **P0** : Mettre a jour esbuild, quill, react-quill, vite (CVEs)
3. **P1** : Remplacer innerHTML par DOMPurify ou alternatives React securisees
4. **P1** : Refactorer les 6 fichiers "Very Complex" (cyclomatic > 39)
5. **P2** : Resoudre les 17 dependances circulaires

---

## 8. Deploiement

### 8.1 Architecture Railway

**2 Services :**

| Service | Build | Port | Runtime |
|---------|-------|------|---------|
| Frontend | Multi-stage Docker (Node build -> Nginx) | 80 | Nginx |
| Backend | Multi-stage Docker (Node deps -> runtime) | 3001 | Node.js + dumb-init |

### 8.2 Variables d'Environnement Cles
```
MONGODB_URI              URI MongoDB Atlas
JWT_SECRET               Secret JWT (min 32 chars)
MAILGUN_API_KEY          Cle API Mailgun
MAILGUN_DOMAIN           Domaine Mailgun
RINGOVER_API_KEY         Cle API Ringover
CLOUDINARY_CLOUD_NAME    Nom cloud Cloudinary
ENCRYPTION_KEY           Cle chiffrement AES-256
SENTRY_DSN               DSN Sentry
VITE_API_URL             URL API backend
```

### 8.3 Configuration Nginx
- Proxy `/auth/*` et `/api/*` vers le backend (port 3001)
- Serve SPA pour toutes les autres routes (`try_files $uri /index.html`)
- Compression gzip
- Headers de securite

---

## 9. Design & UX

### 9.1 Identite Visuelle
- **Logo** : P avec aile verte + texte "PressPilot"
- **Couleur primaire** : #0ED894 (vert frais, accessible)
- **Couleurs secondaires** : Dark #1e293b, Neutral #64748b, Success #10b981, Error #ef4444, Warning #f59e0b
- **Polices** : Poppins (titres), system font (corps)
- **Theme** : Light mode (dark mode prevu)

### 9.2 Design System
- Tailwind CSS + composants custom
- Espacement baseline 4px
- Border radius 8px (standard)
- Animations 300ms (Framer Motion)
- WCAG 2.1 AA conforme

---

## 10. Roadmap

### Phase actuelle - v1.0.1 (Production)
- Toutes les fonctionnalites core implementees
- 10 sprints de developpement completes
- Deploiement production Railway

### Court terme (Q2 2026)
- Application mobile (React Native)
- Amelioration IA : Prompts sophistiques, personnalisation style
- Correction des 22 issues de securite identifiees
- Refactoring des fichiers Very Complex

### Moyen terme (Q3-Q4 2026)
- Integrations CRM avancees (Salesforce, HubSpot)
- Analyse de sentiment ML
- Reports automatiques (hebdo/mensuel)
- Dashboard RGPD

### Long terme (2027)
- Recommandations contacts ML
- Marketplace d'integrations tierces
- Programme white-label/revendeur
- API publique pour developpeurs
- SSO entreprise

---

## 11. Modele Economique (Prevu)

| Plan | Prix | Fonctionnalites |
|------|------|-----------------|
| **Freemium** | Gratuit | 50 contacts, fonctionnalites limitees |
| **Pro** | 99 EUR/mois | Contacts illimites, campagnes email, analytics |
| **Enterprise** | Sur devis | API, support dedie, SSO |
| **Module RP** | +299 EUR/mois | Communiques, evenements, media kits |

---

## 12. Metriques Techniques

| Metrique | Valeur |
|----------|--------|
| Fichiers source frontend | 122 |
| Fonctions | 558 |
| Composants React | 58 |
| Pages | 22 |
| Endpoints API | 91+ |
| Modeles MongoDB | 16 |
| Templates email | 8 |
| Communautes de modules | 53 |
| Dependances npm | 18 (directes frontend) |
| Tests backend | 6 suites (Jest) |

---

*Document genere le 31 mars 2026 a partir de l'analyse automatisee du code source via Claude-Flow v3.5.48*
