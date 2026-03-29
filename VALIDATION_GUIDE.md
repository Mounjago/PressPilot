# GUIDE DE VALIDATION - PRESSPILOT v1.0.1

**Derniere mise a jour :** 29 mars 2026
**Statut :** Production

---

## Prerequis

### Serveurs de production
| Service | URL |
|---------|-----|
| Frontend | https://presspilot.up.railway.app |
| Backend | https://backend-api-production-e103.up.railway.app |
| BDD | MongoDB Atlas (AWS eu-central-1) |

### Serveurs de developpement
| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

---

## Tests de validation par fonctionnalite

### 1. Authentification

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Inscription | POST /auth/register avec email, password, name | 201, token JWT retourne |
| Connexion | POST /auth/login avec email, password | 200, token + refresh token |
| Google OAuth | Clic sur bouton Google | Redirection OAuth, callback, token |
| Refresh token | POST /auth/refresh-token | 200, nouveau token |
| Profil | GET /auth/profile avec Bearer token | 200, donnees utilisateur |
| Deconnexion | Clic bouton Deconnexion | Suppression token, redirect login |

### 2. Contacts

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Liste | GET /api/contacts | 200, contacts pagines |
| Creation | POST /api/contacts avec firstName, lastName, email | 201, contact cree |
| Modification | PUT /api/contacts/:id | 200, contact mis a jour |
| Suppression | DELETE /api/contacts/:id | 200, contact archive |
| Recherche | GET /api/contacts/search?q=terme | 200, resultats filtres |
| Import CSV | Upload CSV via modal import | Parsing + mapping + import JSON |
| Import JSON | POST /api/contacts/import/json | 200, contacts importes avec details |
| Export CSV | GET /api/contacts/export | Telechargement fichier CSV |
| Tags | POST /api/contacts/:id/tags | 200, tag ajoute |
| Statistiques | GET /api/contacts/stats | 200, stats segmentees |

#### Import CSV - Test specifique
1. Ouvrir la page Contacts
2. Cliquer "Importer"
3. Charger un fichier CSV avec colonnes : nom, email, media
4. Verifier le mapping automatique : "nom" -> "Nom complet *"
5. Verifier l'apercu des 3 premiers contacts
6. Cliquer "Importer X contacts"
7. Verifier le resultat : nombre importes, doublons, erreurs

### 3. Campagnes email

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Creation | Formulaire nouvelle campagne | Campagne creee en BDD |
| Templates | Selection parmi 8 templates | Template applique, preview visible |
| Variables | Insertion variables dynamiques | Remplacement correct a l'envoi |
| Preview | Preview multi-device | Affichage desktop, tablet, mobile |
| Envoi | Envoi campagne via Mailgun | Emails envoyes, tracking actif |
| Tracking | Ouverture email par destinataire | Event webhook enregistre |

### 4. Artistes et projets

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| CRUD artistes | Creation, modification, suppression | Operations BDD correctes |
| Upload logo | Upload image artiste | Image stockee sur Cloudinary |
| CRUD projets | Creation projet lie a un artiste | Projet avec artist_id valide |
| Association | Naviguer artiste -> projets -> campagnes | Navigation hierarchique fonctionnelle |

### 5. Analytics

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Dashboard | Acces /analytics | KPIs, graphiques, top performers |
| Campagne | /analytics/campaigns/:id | Metriques detaillees, heatmap |
| Journaliste | /analytics/journalists/:id | Profil, score engagement, historique |
| Best Times | /analytics/best-times | Creneaux optimaux d'envoi |

### 6. Telephonie (Ringover)

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Click-to-call | Clic icone telephone sur contact | Appel initie via Ringover API |
| Notes | Saisie notes pendant appel | Notes sauvegardees en BDD |
| Historique | Consultation historique appels | Liste chronologique avec statuts |
| Session phoning | Creation session avec liste contacts | Interface phoning sequentiel |

### 7. IA Multi-Provider

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Configuration | Settings > IA > Ajouter cle API | Cle chiffree et stockee |
| Test connexion | Bouton "Tester la connexion" | Statut OK / erreur |
| Generation | Generer communique de presse | Texte genere par le provider choisi |
| Selection modele | Changer de modele (GPT-4, Claude, Gemini) | Reponse du bon modele |

### 8. Securite

| Test | Action | Resultat attendu |
|------|--------|-------------------|
| Rate limiting | 101+ requetes en 15min | 429 Too Many Requests |
| CORS | Requete depuis domaine non autorise | Requete bloquee |
| NoSQL injection | Envoi `{"$gt":""}` dans body | Operateur nettoye par sanitize |
| XSS | Envoi `<script>alert(1)</script>` | Balise HTML echappee |
| JWT invalide | Requete avec token expire/invalide | 401 Unauthorized |
| Helmet headers | Inspection response headers | CSP, HSTS, X-Frame-Options presents |

---

## Tests automatises

### Lancer les tests
```bash
cd backend
npm test
```

### Fichiers de tests
| Fichier | Couverture |
|---------|-----------|
| auth.test.js | Auth flow, tokens, validation |
| integration-auth.test.js | Lifecycle complet auth |
| integration-contacts.test.js | CRUD contacts, import/export |
| integration-ai.test.js | IA multi-provider, settings |
| security.test.js | CORS, rate limit, sanitization |
| health.test.js | Health endpoint, 404, JSON errors |

### Environnement de test
- Jest 29.7 + Supertest 6.3
- MongoDB Memory Server (pas de BDD externe requise)
- Timeout : 10 000 ms

---

## Checklist pre-deploiement

- [ ] Backend : `npm test` passe sans erreur
- [ ] Frontend : `npm run build` compile sans erreur
- [ ] Variables d'environnement definies (voir RAILWAY_ENV_VARS.md)
- [ ] MongoDB Atlas accessible
- [ ] Mailgun domaine verifie et webhooks configures
- [ ] CORS : FRONTEND_URL correctement defini
- [ ] Health check : GET /health retourne 200

---

## Debugging

### Logs backend (Winston)
```bash
# Production : fichiers dans logs/
tail -f logs/combined.log
tail -f logs/error.log

# Developpement : console colorisee
```

### Verifier la BDD
```bash
# Via mongosh ou MongoDB Compass
mongosh "mongodb+srv://..."
use presspilot
db.contacts.countDocuments()
db.campaigns.find().limit(5).pretty()
```

### Verifier les services externes
```bash
# Mailgun
curl -s --user 'api:YOUR_KEY' https://api.eu.mailgun.net/v3/YOUR_DOMAIN/stats/total

# Health check
curl https://backend-api-production-e103.up.railway.app/health
```

---

*Mis a jour le 29 mars 2026 - PressPilot v1.0.1*
