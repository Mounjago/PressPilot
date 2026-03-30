# RAPPORT TECHNIQUE COMPLET - PRESSPILOT

**Date :** 30 mars 2026
**Version :** 2.0.0
**Statut :** Production - Deploye sur Railway
**Repository :** https://github.com/Mounjago/PressPilot

---

## 1. VISION PRODUIT

PressPilot est une plateforme SaaS de gestion des relations presse destinee a l'industrie musicale. Elle se distingue par une **architecture double interface** :

- **Attaches de presse** : Gestion de la promotion artistes, campagnes email vers journalistes, phoning, analytics
- **BandStream RP** : Relations publiques corporate avec communiques de presse, evenements, dossiers de presse

Le systeme sur invitation uniquement (pas d'inscription libre) cible les professionnels de la musique : attaches de presse, labels, managers, et equipes RP.

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack

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
| BDD | MongoDB | via Mongoose 8.1 |

### 2.2 Schema d'architecture

```
                     Internet
                        |
            +-----------+-----------+
            |                       |
   frontend-production-7280    backend-api-production-e103
   .up.railway.app             .up.railway.app
            |                       |
     Nginx (Docker)           Node.js (Docker)
     - /auth/* -> proxy            |
     - /api/*  -> proxy      +-----+------+------+
     - /*      -> SPA        |     |      |      |
                          MongoDB  SMTP   AI     Ringover
                                  (email) APIs   (phone)
```

### 2.3 Double interface - Architecture workspace

```
                    Login
                      |
              +-------+-------+
              |               |
         Mono-role       Multi-role
         (press_agent    (admin,
         ou rp)          super_admin)
              |               |
         Auto-redirect   WorkspaceSelector
              |               |
         /press/*        Choix interface
         ou /rp/*             |
                        +-----+-----+
                        |           |
                   /press/*    /rp/*
```

---

## 3. PERSONAS ET ROLES

### 3.1 Roles systeme

| Role | Code | Interfaces | Description |
|------|------|-----------|-------------|
| Attache de presse | `press_agent` | press | Promotion artistes, campagnes, phoning |
| Charge RP | `bandstream_rp` | rp | Communiques, evenements, dossiers de presse |
| Administrateur | `admin` | press + rp | Gestion complete + administration utilisateurs |
| Super Admin | `super_admin` | press + rp | Acces total + configuration systeme |

### 3.2 Personas

**Marie - Attachee de presse independante**
- Gere 5-10 artistes
- Envoie 2-3 campagnes par semaine a sa base de 500 journalistes
- Utilise le phoning pour les relances post-email
- Consulte les analytics pour optimiser ses envois

**Thomas - Responsable RP chez un label**
- Redige et diffuse les communiques de presse du label
- Organise les evenements presse (showcases, conferences)
- Maintient les dossiers de presse a jour
- Gere une equipe de 3 personnes

**Sophie - Super Admin BandStream**
- Cree et gere les comptes utilisateurs
- Administre les organisations (labels, agences)
- A une vue globale sur les deux interfaces
- Configure les parametres systeme

---

## 4. USER STORIES DETAILLEES

### 4.1 Epic : Authentification et acces

#### US-AUTH-01 : Connexion
**En tant que** utilisateur enregistre
**Je veux** me connecter avec mon email et mot de passe
**Afin de** acceder a mon espace de travail

**Criteres d'acceptation :**
- [x] Formulaire email + mot de passe avec validation
- [x] Message d'erreur clair si identifiants invalides
- [x] Token JWT stocke dans localStorage (`authToken`)
- [x] Redirection vers le dashboard de l'interface appropriee
- [x] Protection brute-force : compte verrouille apres 5 tentatives (2h)
- [x] Spinner de chargement pendant l'authentification

**Implementation :** `src/pages/Login.jsx` + `backend/controllers/authController.js`

#### US-AUTH-02 : Selection d'interface (multi-role)
**En tant que** admin ou super_admin
**Je veux** choisir entre l'interface "Attaches de presse" et "BandStream RP"
**Afin de** acceder aux outils specifiques a chaque metier

**Criteres d'acceptation :**
- [x] Page WorkspaceSelector avec les deux options
- [x] Choix sauvegarde en localStorage (`pp_workspace`)
- [x] Navigation laterale adaptee a l'interface choisie
- [x] Possibilite de changer d'interface sans se deconnecter

**Implementation :** `src/pages/WorkspaceSelector.jsx` + `src/contexts/WorkspaceContext.jsx`

#### US-AUTH-03 : Deconnexion
**En tant que** utilisateur connecte
**Je veux** me deconnecter de l'application
**Afin de** securiser mon acces

**Criteres d'acceptation :**
- [x] Bouton de deconnexion dans la sidebar
- [x] Suppression du token JWT
- [x] Redirection vers la page de login
- [x] Nettoyage du localStorage (workspace, preferences)

**Implementation :** `src/contexts/AuthContext.jsx` (fonction `logout`)

#### US-AUTH-04 : Modification du profil
**En tant que** utilisateur connecte
**Je veux** modifier mes informations personnelles
**Afin de** maintenir mes donnees a jour

**Criteres d'acceptation :**
- [x] Formulaire nom, email, telephone, organisation
- [x] Changement de mot de passe (ancien + nouveau)
- [x] Configuration parametres email (expediteur, signature)
- [x] Sauvegarde avec confirmation visuelle

**Implementation :** `src/pages/Settings.jsx` + `backend/routes/auth.js` (PUT /profile, /change-password)

---

### 4.2 Epic : Gestion des artistes (Interface Press)

#### US-ART-01 : Creer un artiste
**En tant que** attache de presse
**Je veux** ajouter un nouvel artiste a ma base
**Afin de** organiser mes campagnes par artiste

**Criteres d'acceptation :**
- [x] Formulaire : nom (requis), genre, biographie, photo de profil
- [x] Liens reseaux sociaux : Instagram, Facebook, Twitter, YouTube, Spotify, Deezer, Apple Music
- [x] Informations de contact : email, telephone, site web
- [x] Upload d'image de profil
- [x] Validation des champs requis

**Implementation :** `src/pages/Artists.jsx` + `backend/controllers/artistsController.js`

#### US-ART-02 : Lister et rechercher mes artistes
**En tant que** attache de presse
**Je veux** voir la liste de mes artistes avec recherche
**Afin de** retrouver rapidement un artiste

**Criteres d'acceptation :**
- [x] Liste paginee de tous mes artistes
- [x] Recherche par nom ou genre
- [x] Affichage : nom, genre, photo, liens rapides
- [x] Acces aux projets de chaque artiste

#### US-ART-03 : Modifier / supprimer un artiste
**En tant que** attache de presse
**Je veux** editer ou supprimer un artiste
**Afin de** maintenir ma base a jour

**Criteres d'acceptation :**
- [x] Edition de tous les champs
- [x] Confirmation avant suppression
- [x] Suppression en cascade des donnees liees (projets, campagnes)

---

### 4.3 Epic : Gestion des projets (Interface Press)

#### US-PROJ-01 : Creer un projet pour un artiste
**En tant que** attache de presse
**Je veux** creer un projet (album, single, EP, tournee...)
**Afin de** organiser les campagnes par sortie

**Criteres d'acceptation :**
- [x] Types : single, EP, album, tour, video, other
- [x] Champs : nom, description, date de sortie, statut, cover art
- [x] Tracklist avec titre, duree, ISRC
- [x] Credits : producteur, mixeur, masterer, compositeurs, paroliers
- [x] Liens de distribution : Spotify, Apple Music, Deezer, YouTube, Bandcamp, SoundCloud
- [x] Statuts : draft, recording, mixing, mastering, ready, released

**Implementation :** `src/pages/Projects.jsx` + `backend/controllers/projectsController.js`

#### US-PROJ-02 : Suivre les sorties a venir
**En tant que** attache de presse
**Je veux** voir les prochaines sorties planifiees
**Afin de** preparer mes campagnes en avance

**Criteres d'acceptation :**
- [x] Endpoint `/api/projects/upcoming` avec tri par date
- [x] Filtrage par statut et type
- [x] Vue calendrier des releases

---

### 4.4 Epic : Gestion des contacts / journalistes

#### US-CONTACT-01 : Importer des contacts par CSV
**En tant que** attache de presse ou charge RP
**Je veux** importer ma base de contacts depuis un fichier CSV
**Afin de** demarrer rapidement avec mes contacts existants

**Criteres d'acceptation :**
- [x] Upload d'un fichier CSV
- [x] Detection automatique des colonnes (FR/EN)
- [x] Mapping manuel des colonnes non reconnues
- [x] Preview des 100 premieres lignes avant import
- [x] Validation : email requis, format correct
- [x] Gestion des doublons (skip ou merge)
- [x] Rapport d'import : succes, echecs, details erreurs
- [x] Support des champs : nom, prenom, email, telephone, media, specialisations, tags

**Implementation :** `src/components/CSVImporter.jsx` + `backend/routes/contacts.js` (POST /import/json)

#### US-CONTACT-02 : Creer un contact manuellement
**En tant que** utilisateur
**Je veux** ajouter un contact journaliste individuellement
**Afin de** completer ma base avec de nouveaux contacts

**Criteres d'acceptation :**
- [x] Formulaire modal avec tous les champs
- [x] Informations personnelles : prenom, nom, email (unique), telephone
- [x] Informations professionnelles : poste, media (nom, type, audience, site)
- [x] Types de media : journal, magazine, radio, TV, web, blog, podcast, influenceur
- [x] Audience : locale, regionale, nationale, internationale
- [x] Specialisations musicales : pop, rock, rap, hip-hop, electro, jazz, classique...
- [x] Tags personnalises et notes internes
- [x] Visibilite : prive, organisation, pool partage

**Implementation :** `src/components/contacts/modal/ContactModal.jsx`

#### US-CONTACT-03 : Rechercher et filtrer les contacts
**En tant que** utilisateur
**Je veux** rechercher et filtrer ma base de contacts
**Afin de** cibler les bons journalistes pour mes campagnes

**Criteres d'acceptation :**
- [x] Recherche full-text : nom, email, media
- [x] Filtres : type de media, audience, specialisation musicale
- [x] Tri par nom, date de creation, taux de reponse
- [x] Pagination (20 par page)
- [x] Vue carte avec informations cles

**Implementation :** `src/components/contacts/filters/ContactFilters.jsx` + `backend/routes/contacts.js`

#### US-CONTACT-04 : Exporter les contacts en CSV
**En tant que** utilisateur
**Je veux** exporter ma base de contacts au format CSV
**Afin de** sauvegarder ou partager mes contacts

**Criteres d'acceptation :**
- [x] Export de tous les contacts ou selection filtree
- [x] Format CSV avec colonnes normalisees
- [x] Telechargement automatique du fichier

#### US-CONTACT-05 : Consulter le profil d'un contact
**En tant que** utilisateur
**Je veux** voir le detail d'un contact avec son historique d'engagement
**Afin d'** evaluer la pertinence de ce contact pour mes campagnes

**Criteres d'acceptation :**
- [x] Fiche complete avec toutes les informations
- [x] Historique des campagnes recues
- [x] Taux de reponse et taux d'ouverture
- [x] Derniere date de contact
- [x] Heure preferee de contact
- [x] Actions rapides : appeler, envoyer un email

---

### 4.5 Epic : Campagnes email (Interface Press)

#### US-CAMP-01 : Creer une campagne email
**En tant que** attache de presse
**Je veux** creer une campagne email pour promouvoir un artiste/projet
**Afin d'** envoyer un communique a mes contacts journalistes

**Criteres d'acceptation :**
- [x] Champs : nom, sujet, contenu HTML, artiste/projet associe
- [x] Editeur WYSIWYG (React Quill) pour le contenu
- [x] Variables dynamiques : {{firstName}}, {{artistName}}, {{projectName}}
- [x] Selection des destinataires parmi les contacts
- [x] Sauvegarde en brouillon
- [x] Preview avant envoi
- [x] Pieces jointes

**Implementation :** `src/components/CampaignModal.jsx` + `backend/controllers/campaignsController.js`

#### US-CAMP-02 : Utiliser un template email
**En tant que** attache de presse
**Je veux** selectionner et personnaliser un template email
**Afin de** gagner du temps sur la mise en forme

**Criteres d'acceptation :**
- [x] 8+ templates professionnels pre-concus
- [x] Personnalisation du branding (couleurs, logo, signature)
- [x] Insertion de variables dynamiques
- [x] Preview multi-device (desktop, mobile)

**Implementation :** `src/components/templates/EmailTemplates.jsx` + `TemplateBrandingManager.jsx`

#### US-CAMP-03 : Envoyer / programmer une campagne
**En tant que** attache de presse
**Je veux** envoyer immediatement ou programmer l'envoi d'une campagne
**Afin de** toucher les journalistes au meilleur moment

**Criteres d'acceptation :**
- [x] Envoi immediat a tous les destinataires
- [x] Programmation a une date/heure future
- [x] Statuts : brouillon -> programmee -> en cours d'envoi -> envoyee
- [x] Pause / annulation d'un envoi en cours

#### US-CAMP-04 : Suivre les performances d'une campagne
**En tant que** attache de presse
**Je veux** voir les metriques d'une campagne envoyee
**Afin d'** evaluer son efficacite et relancer si necessaire

**Criteres d'acceptation :**
- [x] Metriques : envoyes, ouverts, cliques, repondu
- [x] Taux : ouverture, clics, reponse
- [x] Detail par destinataire (qui a ouvert, quand)
- [x] Historique des interactions
- [x] Integration IMAP pour tracking automatique des reponses

**Implementation :** `src/pages/CampaignAnalytics.jsx` + `backend/models/EmailTracking.js`

---

### 4.6 Epic : Telephonie / Phoning (Interface Press)

#### US-PHONE-01 : Creer une session de phoning
**En tant que** attache de presse
**Je veux** creer une session de phoning ciblee
**Afin de** relancer les journalistes par telephone apres une campagne email

**Criteres d'acceptation :**
- [x] Workflow en 4 etapes :
  1. Selection de l'artiste
  2. Selection du projet
  3. Configuration de la session (contacts a appeler)
  4. Interface d'appel active
- [x] Selection des contacts a appeler
- [x] Indicateur du nombre d'appels restants

**Implementation :** `src/components/phoning/` (ArtistSelectionPage, ProjectSelectionPage, SessionCreationPage, SessionManagementPage)

#### US-PHONE-02 : Effectuer un appel et prendre des notes
**En tant que** attache de presse
**Je veux** appeler un journaliste et noter le resultat
**Afin de** documenter mes relances et suivre les retours

**Criteres d'acceptation :**
- [x] Click-to-call depuis la fiche contact
- [x] Timer d'appel en cours
- [x] Statuts : connexion, connecte, termine, manque, pas de reponse, occupe
- [x] Zone de notes associee a chaque appel
- [x] Historique des appels par contact
- [x] Statistiques de session : appels passes, duree totale, taux de reponse

**Implementation :** `src/components/phoning/phone/` (PhoneSystem, CallModal, CallHistory)

---

### 4.7 Epic : Analytics (Interface Press)

#### US-ANA-01 : Dashboard analytics
**En tant que** attache de presse
**Je veux** voir un tableau de bord avec mes KPIs
**Afin de** mesurer l'efficacite globale de mes actions

**Criteres d'acceptation :**
- [x] Metriques globales : total contacts, campagnes, emails envoyes
- [x] Taux d'ouverture et de reponse globaux
- [x] Evolution dans le temps (graphiques)
- [x] Top campagnes performantes
- [x] Filtrage par periode

**Implementation :** `src/pages/Analytics.jsx` + `backend/controllers/analyticsController.js`

#### US-ANA-02 : Analytics par journaliste
**En tant que** attache de presse
**Je veux** voir le profil d'engagement d'un journaliste
**Afin de** savoir s'il est pertinent de le contacter pour un artiste donne

**Criteres d'acceptation :**
- [x] Taux de reponse individuel
- [x] Historique des campagnes recues
- [x] Derniere interaction
- [x] Tendance d'engagement (en hausse/baisse)

**Implementation :** `src/pages/JournalistAnalytics.jsx`

#### US-ANA-03 : Creneaux optimaux d'envoi (Best Times)
**En tant que** attache de presse
**Je veux** connaitre les meilleurs moments pour envoyer mes campagnes
**Afin d'** optimiser le taux d'ouverture

**Criteres d'acceptation :**
- [x] Heatmap jour x heure des ouvertures d'emails
- [x] Recommandation du meilleur creneau par media
- [x] Donnees basees sur l'historique reel des interactions

**Implementation :** `src/pages/BestTimesAnalytics.jsx` + `src/components/analytics/HeatmapView.jsx`

#### US-ANA-04 : Calculateur ROI
**En tant que** attache de presse
**Je veux** calculer le retour sur investissement de mes campagnes
**Afin de** justifier mes actions aupres de mes clients

**Criteres d'acceptation :**
- [x] Input : budget campagne, nombre de contacts, resultat obtenu
- [x] Output : cout par contact, cout par reponse, ROI
- [x] Comparaison entre campagnes

**Implementation :** `src/components/analytics/ROICalculator.jsx`

---

### 4.8 Epic : IMAP et tracking email

#### US-IMAP-01 : Configurer un compte IMAP
**En tant que** utilisateur
**Je veux** connecter mon compte email via IMAP
**Afin de** suivre automatiquement les reponses a mes campagnes

**Criteres d'acceptation :**
- [x] Support providers : Gmail, Outlook, Yahoo, custom
- [x] Presets de configuration par provider
- [x] Champs : host, port, username, mot de passe (chiffre AES-256-CBC)
- [x] Support OAuth2 pour Gmail
- [x] Test de connexion avant sauvegarde
- [x] Plusieurs configurations par utilisateur

**Implementation :** `src/components/IMAPSettings.jsx` + `backend/controllers/imapController.js`

#### US-IMAP-02 : Polling automatique des emails
**En tant que** utilisateur
**Je veux** que le systeme releve automatiquement mes emails
**Afin de** tracker les reponses sans intervention manuelle

**Criteres d'acceptation :**
- [x] Intervalle configurable : 1 a 60 minutes
- [x] Filtres : date, sujet, expediteur, exclusion auto-reponses
- [x] Mode unread-only pour ne pas retraiter les emails lus
- [x] Limit max messages par releve (1-500)
- [x] Association automatique email -> campagne
- [x] Statistiques : total traite, campagnes associees, emails non associes
- [x] Health tracking : taux de succes, derniere erreur

**Implementation :** `backend/models/IMAPConfiguration.js` (pollingConfig, filters, statistics)

---

### 4.9 Epic : IA multi-provider

#### US-AI-01 : Configurer un provider IA
**En tant que** utilisateur
**Je veux** connecter mon propre compte IA (OpenAI, Anthropic ou Gemini)
**Afin de** utiliser l'IA pour generer du contenu

**Criteres d'acceptation :**
- [x] Choix du provider : OpenAI, Anthropic (Claude), Google Gemini
- [x] Saisie de la cle API (chiffree cote serveur)
- [x] Selection du modele par provider
- [x] Test de connexion pour verifier les identifiants
- [x] Configuration persistee dans le profil utilisateur

**Implementation :** `src/pages/Settings.jsx` (section IA) + `backend/controllers/aiController.js`

#### US-AI-02 : Generer un communique de presse
**En tant que** utilisateur
**Je veux** generer un communique de presse via l'IA
**Afin de** gagner du temps sur la redaction

**Criteres d'acceptation :**
- [x] Modal de generation avec prompt libre
- [x] Contexte artiste/projet injecte automatiquement
- [x] Resultat editable dans l'editeur WYSIWYG
- [x] Possibilite de regenerer avec un prompt ajuste

**Implementation :** `src/components/AiModal.jsx` + `backend/routes/ai.js` (POST /generate-press-release)

---

### 4.10 Epic : Communiques de presse (Interface RP)

#### US-PR-01 : Creer un communique de presse
**En tant que** charge RP
**Je veux** rediger un communique de presse structure
**Afin de** diffuser les informations officielles de mon organisation

**Criteres d'acceptation :**
- [x] Champs : titre, sous-titre, resume, contenu HTML
- [x] Blocs de contenu riches : paragraphe, heading, citation, image, video, embed
- [x] Tags pour la categorisation
- [x] Sauvegarde en brouillon automatique

**Implementation :** `src/pages/rp/PressReleases.jsx` + `backend/controllers/pressReleasesController.js`

#### US-PR-02 : Workflow de validation
**En tant que** charge RP
**Je veux** soumettre mon communique pour validation
**Afin de** garantir la qualite avant publication

**Criteres d'acceptation :**
- [x] Statuts : brouillon -> en revue -> approuve -> publie -> archive
- [x] Historique des changements de statut (qui, quand)
- [x] Tracking : auteur, approbateur, date de publication
- [x] Compteurs de vues et telechargements

**Implementation :** `backend/models/PressRelease.js` (statusHistory, approvedBy, publishedAt)

#### US-PR-03 : Publier et distribuer
**En tant que** charge RP
**Je veux** publier un communique approuve et le distribuer
**Afin de** informer les medias

**Criteres d'acceptation :**
- [x] Endpoint de publication (POST /:id/publish)
- [x] Endpoint d'archivage (POST /:id/archive)
- [x] Tracking des canaux de distribution
- [x] Statistiques : vues, telechargements

---

### 4.11 Epic : Evenements (Interface RP)

#### US-EVT-01 : Creer un evenement presse
**En tant que** charge RP
**Je veux** creer un evenement (conference, showcase, lancement...)
**Afin d'** inviter les journalistes et suivre les participations

**Criteres d'acceptation :**
- [x] Types : conference de presse, lancement produit, networking, workshop, webinaire, session interview, exposition, gala
- [x] Champs : nom, description, date debut/fin, lieu (adresse complete + coordonnees)
- [x] Statuts : planification, confirme, invitations envoyees, en cours, termine, annule, reporte
- [x] Details : capacite, intervenants, agenda
- [x] Date limite RSVP

**Implementation :** `src/pages/rp/Events.jsx` + `backend/controllers/eventsController.js`

#### US-EVT-02 : Gerer les invitations et RSVPs
**En tant que** charge RP
**Je veux** envoyer des invitations et suivre les reponses
**Afin de** connaitre le nombre de participants attendus

**Criteres d'acceptation :**
- [x] Selection des contacts a inviter
- [x] Envoi des invitations (POST /:id/invite)
- [x] Suivi RSVP par contact (GET /:id/rsvp)
- [x] Statuts RSVP par invite : en attente, confirme, decline, absent

---

### 4.12 Epic : Dossiers de presse / Media Kits (Interface RP)

#### US-MK-01 : Creer un dossier de presse
**En tant que** charge RP
**Je veux** creer un dossier de presse numerique
**Afin de** fournir aux journalistes toutes les ressources necessaires

**Criteres d'acceptation :**
- [x] Contextes : entreprise, produit, evenement, campagne, dirigeant, crise, saisonnier
- [x] Assets : documents, images, videos, liens
- [x] Metadata par asset : description, tags
- [x] Statuts : brouillon, actif, archive

**Implementation :** `src/pages/rp/MediaKits.jsx` + `backend/controllers/mediaKitsController.js`

#### US-MK-02 : Partager publiquement un dossier
**En tant que** charge RP
**Je veux** generer un lien public pour un dossier de presse
**Afin que** les journalistes y accedent sans authentification

**Criteres d'acceptation :**
- [x] Slug unique genere automatiquement
- [x] Endpoint public sans auth (GET /media-kits/public/:slug)
- [x] Tracking : nombre de vues, telechargements
- [x] Possibilite de desactiver le lien public

---

### 4.13 Epic : Administration

#### US-ADMIN-01 : Gerer les utilisateurs
**En tant que** admin ou super_admin
**Je veux** creer, modifier et desactiver des comptes utilisateurs
**Afin de** controler l'acces a la plateforme

**Criteres d'acceptation :**
- [x] Liste de tous les utilisateurs avec filtres
- [x] Creation d'utilisateur : nom, email, role, organisation
- [x] Modification du role et de l'organisation
- [x] Desactivation / reactivation de compte
- [x] Attribution d'un role parmi : press_agent, bandstream_rp, admin, super_admin

**Implementation :** `src/pages/admin/UserManagement.jsx` + `backend/controllers/adminController.js`

#### US-ADMIN-02 : Gerer les organisations
**En tant que** admin ou super_admin
**Je veux** creer et gerer des organisations (labels, agences)
**Afin de** regrouper les utilisateurs RP par entite

**Criteres d'acceptation :**
- [x] Creation : nom, slug, type (label, agence, corporate, independant), logo
- [x] Branding : couleurs principales et secondaires
- [x] Membres : ajout/retrait d'utilisateurs
- [x] Informations : description, site web, email, adresse, reseaux sociaux

**Implementation :** `src/pages/admin/OrganizationManagement.jsx` + `backend/models/Organization.js`

#### US-ADMIN-03 : Dashboard admin
**En tant que** admin
**Je veux** voir les statistiques globales du systeme
**Afin de** suivre l'utilisation de la plateforme

**Criteres d'acceptation :**
- [x] Nombre d'utilisateurs actifs
- [x] Nombre de campagnes envoyees
- [x] Nombre de contacts totaux
- [x] Sante du systeme

**Implementation :** `src/pages/admin/AdminDashboard.jsx`

---

## 5. MODELES DE DONNEES

### 5.1 User
| Champ | Type | Description |
|-------|------|-------------|
| name | String (requis) | Nom complet |
| email | String (unique, requis) | Adresse email |
| password | String (bcrypt 12 rounds) | Min 12 chars, maj+min+chiffre+special |
| role | Enum | press_agent, bandstream_rp, admin, super_admin |
| interfaces | Array | Interfaces accessibles (derive du role) |
| organizationId | ObjectId | Organisation pour les utilisateurs RP |
| emailSettings | Object | Config SMTP expediteur |
| aiSettings | Object | Provider, API key (chiffree), modele |
| subscription | Object | Plan (free/pro/enterprise), statut, dates |
| preferences | Object | Langue, notifications, timezone |
| loginAttempts | Number | Compteur tentatives |
| lockUntil | Date | Date fin de verrouillage |

### 5.2 Contact
| Champ | Type | Description |
|-------|------|-------------|
| firstName, lastName | String | Nom du contact |
| email | String (unique) | Email du contact |
| phone | String | Telephone |
| jobTitle | String | Poste (ex: redacteur en chef) |
| media | Object | nom, type, audience, site web |
| specializations | Array | Genres musicaux couverts |
| tags | Array | Tags personnalises |
| visibility | Enum | private, organization, shared_pool |
| responseRate | Number | Taux de reponse (%) |
| preferredContactTime | Time | Heure preferee |
| engagementHistory | Array | Historique interactions campagnes |

### 5.3 Campaign
| Champ | Type | Description |
|-------|------|-------------|
| name | String | Nom de la campagne |
| campaignType | Enum | artist_promo, corporate_pr, event_promo, product_launch |
| interface | Enum | press, rp |
| subject | String | Sujet de l'email |
| content, htmlContent | String | Corps de l'email |
| status | Enum | draft, scheduled, sending, sent, paused, cancelled |
| recipients | Array | Liste des destinataires avec statut individuel |
| statistics | Object | totalSent, totalOpened, totalClicked, totalReplied, taux |
| artistId, projectId | ObjectId | References artiste/projet (press) |
| pressReleaseId, eventId | ObjectId | References RP |

### 5.4 Artist
| Champ | Type | Description |
|-------|------|-------------|
| name | String (requis) | Nom de l'artiste |
| genre | String | Genre musical |
| description | String | Biographie |
| profileImage | String | URL photo |
| socialLinks | Object | Instagram, Facebook, Twitter, YouTube, Spotify, Deezer, Apple Music |
| contact | Object | email, telephone, site web |

### 5.5 Project
| Champ | Type | Description |
|-------|------|-------------|
| name | String (requis) | Nom du projet |
| type | Enum | single, ep, album, tour, video, other |
| status | Enum | draft, recording, mixing, mastering, ready, released |
| releaseDate | Date | Date de sortie |
| tracks | Array | titre, duree, ISRC |
| credits | Object | producteur, mixeur, compositeurs... |
| distributionLinks | Object | Liens streaming |
| artistId | ObjectId | Artiste associe |

### 5.6 PressRelease (RP)
| Champ | Type | Description |
|-------|------|-------------|
| title, subtitle, summary | String | Titres |
| content, htmlContent | String | Corps |
| contentBlocks | Array | Blocs riches (paragraphe, heading, citation, image, video) |
| status | Enum | draft, review, approved, published, archived |
| statusHistory | Array | Historique des changements de statut |
| organizationId | ObjectId | Organisation proprietaire |
| viewsCount, downloadsCount | Number | Statistiques |

### 5.7 Event (RP)
| Champ | Type | Description |
|-------|------|-------------|
| name | String | Nom de l'evenement |
| type | Enum | 9 types (conference, lancement, networking...) |
| status | Enum | 7 statuts (planification -> termine) |
| startDate, endDate | Date | Dates de l'evenement |
| location | Object | lieu, adresse, ville, pays, coordonnees GPS |
| contacts | Array | Invites avec statut RSVP |
| eventDetails | Object | capacite, intervenants, agenda |

### 5.8 MediaKit (RP)
| Champ | Type | Description |
|-------|------|-------------|
| name | String | Nom du dossier |
| context | Enum | 8 contextes (entreprise, produit, evenement...) |
| assets | Array | Documents, images, videos avec metadata |
| slug | String (unique) | URL publique |
| public | Boolean | Acces public active |
| pageViews, downloads | Number | Statistiques de consultation |

### 5.9 Organization
| Champ | Type | Description |
|-------|------|-------------|
| name | String (requis) | Nom de l'organisation |
| slug | String (unique) | URL-friendly |
| type | Enum | label, agency, corporate, independent |
| members | Array | IDs des utilisateurs membres |
| primaryColor, secondaryColor | String | Branding |

### 5.10 IMAPConfiguration
| Champ | Type | Description |
|-------|------|-------------|
| provider | Enum | gmail, outlook, yahoo, custom |
| imapConfig | Object | host, port, secure, credentials (chiffres AES-256) |
| pollingConfig | Object | interval (1-60 min), boite, filtres |
| statistics | Object | emails traites, campagnes associees |

### 5.11 EmailTracking
| Champ | Type | Description |
|-------|------|-------------|
| campaignId, contactId | ObjectId | References |
| sentAt, openedAt, clickedAt, repliedAt | Date | Timestamps |
| totalOpens, totalClicks | Number | Compteurs |
| clickedLinks | Array | URLs cliquees avec position |

---

## 6. API ENDPOINTS

### 6.1 Authentification (`/auth`)
| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /register | Non | Inscription |
| POST | /login | Non | Connexion |
| GET | /me | Oui | Profil courant |
| PUT | /profile | Oui | Modifier profil |
| PUT | /change-password | Oui | Changer mot de passe |
| POST | /refresh-token | Oui | Rafraichir JWT |
| POST | /logout | Oui | Deconnexion |

### 6.2 Contacts (`/api/contacts`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste paginee avec filtres |
| POST | / | Creer un contact |
| GET | /count | Nombre total |
| GET | /stats | Statistiques |
| GET | /search | Recherche |
| GET | /export | Export CSV |
| POST | /import | Import CSV |
| POST | /import/json | Import JSON (batch) |
| GET | /:id | Detail contact |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.3 Campagnes (`/api/campaigns`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste paginee |
| POST | / | Creer campagne |
| GET | /stats | Statistiques globales |
| GET | /top-performing | Top campagnes |
| GET | /:id | Detail campagne |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.4 Artistes (`/api/artists`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste paginee |
| POST | / | Creer artiste |
| GET | /:id | Detail |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.5 Projets (`/api/projects`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste paginee |
| POST | / | Creer projet |
| GET | /stats | Statistiques |
| GET | /upcoming | Prochaines sorties |
| GET | /search | Recherche |
| GET | /:id | Detail |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.6 Analytics (`/api/analytics`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /dashboard | Dashboard global |
| GET | /contacts | Analytics contacts |
| GET | /campaigns | Analytics campagnes |
| GET | /projects | Analytics projets |
| GET | /best-times | Creneaux optimaux |
| GET | /export | Export donnees |

### 6.7 IA (`/api/ai`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /generate-press-release | Generer contenu IA |
| GET | /settings | Config IA utilisateur |
| PUT | /settings | Modifier config IA |
| POST | /test-connection | Test provider |

### 6.8 IMAP (`/api/imap`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste configs |
| POST | / | Creer config |
| GET | /presets | Presets par provider |
| GET | /service/status | Statut service |
| GET | /:id | Detail config |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.9 Communiques de presse (`/api/press-releases`) - RP
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste paginee |
| POST | / | Creer communique |
| GET | /stats | Statistiques |
| GET | /:id | Detail |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |
| POST | /:id/publish | Publier |
| POST | /:id/archive | Archiver |

### 6.10 Evenements (`/api/events`) - RP
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste |
| POST | / | Creer evenement |
| GET | /stats | Statistiques |
| GET | /:id | Detail |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |
| POST | /:id/invite | Envoyer invitations |
| GET | /:id/rsvp | Liste RSVPs |

### 6.11 Dossiers de presse (`/api/media-kits`) - RP
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Liste |
| POST | / | Creer dossier |
| GET | /stats | Statistiques |
| GET | /public/:slug | Acces public (sans auth) |
| GET | /:id | Detail |
| PUT | /:id | Modifier |
| DELETE | /:id | Supprimer |

### 6.12 Admin (`/api/admin`)
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /users | Liste utilisateurs |
| POST | /users | Creer utilisateur |
| GET | /users/:id | Detail utilisateur |
| PUT | /users/:id | Modifier utilisateur |
| DELETE | /users/:id | Supprimer utilisateur |
| POST | /users/:id/roles | Attribuer roles |
| GET | /organizations | Liste organisations |
| POST | /organizations | Creer organisation |
| GET | /statistics | Stats systeme |

---

## 7. SECURITE

### 7.1 Authentification
- JWT HS256, expiration 7 jours
- Mot de passe : bcrypt 12 rounds, min 12 caracteres
- Brute-force : verrouillage apres 5 tentatives (2h)
- Token refresh disponible

### 7.2 Chiffrement
- Mots de passe IMAP : AES-256-CBC avec IV unique
- Cles API IA : AES-256-CBC avec IV unique
- Cle de chiffrement : variable `ENCRYPTION_KEY` (min 32 chars)

### 7.3 Headers HTTP (Helmet)
- Content-Security-Policy strict
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS: max-age 1 an avec preload
- Referrer-Policy: strict-origin-when-cross-origin

### 7.4 Rate Limiting
| Contexte | Production | Dev |
|----------|-----------|-----|
| Global | 100 req/15min | 1000 req/15min |
| Auth | 10 req/15min | 100 req/15min |
| Upload | 30 req/15min | 200 req/15min |

### 7.5 Sanitization
- NoSQL injection : blocage operateurs MongoDB ($)
- XSS : strip HTML dans les inputs
- Body limit : 1 MB JSON, 1 MB URL-encoded
- CORS : whitelist stricte avec credentials

---

## 8. DEPLOIEMENT

### 8.1 Infrastructure Railway

| Service | URL | Docker | Port |
|---------|-----|--------|------|
| Frontend | frontend-production-7280.up.railway.app | nginx:1.25-alpine | 80 |
| Backend | backend-api-production-e103.up.railway.app | node:20-alpine | 3001 |
| MongoDB | mongodb.railway.internal | Railway managed | 27017 |

### 8.2 Nginx (Frontend)
- Proxy `/api/*` et `/auth/*` vers le backend
- SPA fallback pour React Router
- Cache 1 an pour `/assets/` (fichiers hashes Vite)
- No-cache pour `index.html`
- Health check : `/health` (JSON 200)
- Headers securite (X-Frame-Options, X-Content-Type-Options)

### 8.3 Docker Backend
- Multi-stage build avec `dumb-init` pour PID 1
- User non-root : presspilot (UID 1001)
- Health check : wget /health (30s interval)
- npm ci --only=production

---

## 9. STRUCTURE DU CODE

### 9.1 Frontend
```
src/
├── assets/              # Logo, images
├── components/          # ~60 composants React
│   ├── analytics/       # MetricsCard, HeatmapView, ROICalculator, PerformanceChart...
│   ├── contacts/        # ContactCard, ContactList, ContactModal, ContactFilters...
│   ├── phoning/         # ArtistSelection, ProjectSelection, SessionCreation, SessionManagement
│   │   └── phone/       # PhoneSystem, CallModal, CallHistory
│   ├── templates/       # EmailTemplates, TemplateSelector, TemplateBrandingManager
│   ├── Layout.jsx       # Layout principal avec sidebar
│   ├── Sidebar.jsx      # Navigation workspace-aware
│   ├── CSVImporter.jsx  # Import CSV avec mapping colonnes
│   ├── AiModal.jsx      # Modal generation IA
│   └── ProtectedRoute.jsx # Protection routes avec verification role/interface
├── contexts/
│   ├── AuthContext.jsx        # Auth state, JWT, axios interceptors
│   └── WorkspaceContext.jsx   # Gestion interface active (press/rp)
├── pages/
│   ├── HomePage.jsx, Login.jsx, Register.jsx  # Pages publiques
│   ├── Dashboard.jsx, Artists.jsx, Contacts.jsx, Campaigns.jsx  # Press
│   ├── Phoning.jsx, Analytics.jsx, Settings.jsx  # Press
│   ├── rp/DashboardRP.jsx, PressReleases.jsx, Events.jsx, MediaKits.jsx  # RP
│   ├── admin/AdminDashboard.jsx, UserManagement.jsx, OrganizationManagement.jsx  # Admin
│   └── WorkspaceSelector.jsx  # Choix interface
├── services/            # Couche API (axios calls)
│   ├── analyticsApi.js, artistsApi.js, campaignsApi.js, projectsApi.js
│   ├── pressReleasesApi.js, eventsApi.js, mediaKitsApi.js, adminApi.js
│   └── cloudinary.js, ringoverService.js
├── styles/              # CSS (Dashboard, Contacts, HomePage, Phoning, GDPR...)
├── utils/               # Helpers, authService
├── api.js               # Instance Axios configuree
├── config.js            # Configuration (apiUrl, appName...)
├── App.jsx              # Routes + ErrorBoundary
└── main.jsx             # Point d'entree React
```

### 9.2 Backend
```
backend/
├── config/database.js        # Connexion MongoDB (pool 10, timeout 5s)
├── constants/roles.js        # Definitions roles et interfaces
├── controllers/              # 13 controllers
│   ├── authController.js, contactsController.js, campaignsController.js
│   ├── artistsController.js, projectsController.js, analyticsController.js
│   ├── aiController.js, imapController.js, messagesController.js
│   ├── uploadsController.js, adminController.js
│   ├── pressReleasesController.js, eventsController.js, mediaKitsController.js
├── middleware/
│   ├── auth.js              # JWT verify + authorize + requireOwnership
│   ├── sanitize.js          # NoSQL injection + XSS protection
│   ├── validate.js          # express-validator wrapper
│   ├── roleGuard.js         # requireInterface middleware
│   └── dataScope.js         # Scope donnees par utilisateur/org
├── models/                   # 14 modeles Mongoose
│   ├── User.js, Contact.js, Campaign.js, Artist.js, Project.js
│   ├── EmailTracking.js, Message.js, IMAPConfiguration.js
│   ├── PressRelease.js, Event.js, MediaKit.js, Organization.js
│   ├── AnalyticsMetric.js, Call.js
├── routes/                   # 14 fichiers de routes (100+ endpoints)
├── migrations/               # Scripts migration (role restructuring, org creation)
├── tests/                    # 8 fichiers de tests (Jest + Supertest)
├── server.js                 # Point d'entree Express (520 lignes)
├── Dockerfile                # Multi-stage build
└── create-admin.js           # Script creation super admin
```

---

## 10. BRANDING

- **Couleur principale** : #0ED894 (vert PressPilot)
- **Noir** : #000000
- **Fond** : #FFFFFF
- **Accent** : #EBF5DF
- **Police titre** : GOODLY
- **Police corps** : Poppins
- **Logo** : src/assets/logo-presspilot.png

---

## 11. ENVIRONNEMENTS

### Production
- **Frontend** : https://frontend-production-7280.up.railway.app
- **Backend** : https://backend-api-production-e103.up.railway.app
- **BDD** : MongoDB (Railway internal)
- **Repository** : https://github.com/Mounjago/PressPilot

### Developpement
- **Frontend** : http://localhost:5173 (Vite)
- **Backend** : http://localhost:3001 (Express)
- **BDD** : MongoDB local

---

*Rapport mis a jour le 30 mars 2026 - PressPilot v2.0.0*
