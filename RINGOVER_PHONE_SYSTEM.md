# 📞 Système de Phoning Ringover - PressPilot

## Vue d'ensemble

Le système de phoning Ringover intégré à PressPilot permet aux utilisateurs de passer des appels téléphoniques directement depuis l'interface de gestion des contacts, avec suivi complet des appels et prise de notes en temps réel.

## ✨ Fonctionnalités Principales

### Phase 1 - MVP (Implémenté)

- ✅ **Click-to-call** depuis la page Contacts
- ✅ **Interface d'appel** avec timer et prise de notes
- ✅ **Logs d'appels** avec stockage en base de données
- ✅ **Historique des appels** par contact
- ✅ **Statuts d'appel** (répondu/non-répondu/occupé/manqué)
- ✅ **Modal d'appel** minimaliste avec raccourcis clavier
- ✅ **Design cohérent** avec le système PressPilot

## 🏗️ Architecture

### Frontend (React)

```
src/
├── components/phone/
│   ├── PhoneSystem.jsx       # Interface principale d'appel
│   ├── CallModal.jsx         # Modal durant l'appel
│   ├── CallHistory.jsx       # Historique des appels
│   ├── ContactCard.jsx       # Carte contact enrichie
│   ├── PhoneSystem.css       # Styles système d'appel
│   ├── CallModal.css         # Styles modal d'appel
│   ├── CallHistory.css       # Styles historique
│   └── ContactCard.css       # Styles carte contact
├── services/
│   ├── ringoverService.js    # Service d'intégration Ringover
│   └── callsApi.js          # API des appels
└── pages/
    └── Contacts.jsx         # Page contacts enrichie
```

### Backend (Node.js/Express)

```
backend/
├── routes/
│   └── calls.js             # Routes API des appels
├── models/
│   └── Call.js              # Modèle de données des appels
├── middleware/
│   ├── authenticate.js      # Authentification JWT
│   └── authorize.js         # Autorisation par rôles
└── migrations/
    └── 001_create_calls_table.sql
```

## 🚀 Installation et Configuration

### 1. Dépendances Frontend

```bash
# Icônes et utilitaires
npm install lucide-react
```

### 2. Dépendances Backend

```bash
cd backend
npm install express cors helmet compression express-rate-limit express-validator morgan dotenv jsonwebtoken sequelize pg
```

### 3. Configuration Ringover

Créez un fichier `.env` dans le dossier backend :

```env
# Ringover API
RINGOVER_API_KEY=your_ringover_api_key_here
RINGOVER_BASE_URL=https://public-api.ringover.com/v2

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=presspilot
DB_USER=presspilot_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
```

### 4. Migration Base de Données

```bash
# Exécuter la migration
psql -U presspilot_user -d presspilot -f backend/migrations/001_create_calls_table.sql
```

## 📱 Utilisation

### Interface Contacts

1. **Navigation** : Accédez à la page `/contacts`
2. **Sélection** : Cliquez sur un contact pour voir ses détails
3. **Appel** : Cliquez sur le bouton 📞 pour initier un appel

### Pendant l'Appel

- **Timer** automatique de durée d'appel
- **Prise de notes** en temps réel
- **Contrôles** : mute, pause, raccrocher
- **Raccourcis clavier** :
  - `Ctrl+M` : Mute/Unmute
  - `Ctrl+Space` : Pause/Reprendre
  - `Ctrl+Enter` : Raccrocher
  - `Esc` : Réduire la modal

### Après l'Appel

- **Sauvegarde automatique** des logs
- **Notes persistantes** liées au contact
- **Historique complet** des interactions

## 🎨 Design System

### Variables CSS Utilisées

```css
--accent-color: #0ED894;      /* Vert principal PressPilot */
--primary-color: #1e293b;     /* Texte principal */
--success-color: #10b981;     /* Appels réussis */
--error-color: #ef4444;       /* Appels échoués */
--warning-color: #f59e0b;     /* Appels en attente */
```

### Composants Stylisés

- **Cards** avec `backdrop-filter: blur(10px)`
- **Boutons** avec gradients et animations
- **Modal** avec overlay glassmorphism
- **Timer** en police monospace
- **Animations** fluides (0.3s cubic-bezier)

## 🔧 API Endpoints

### Appels

```
GET    /api/calls              # Liste des appels (avec filtres)
POST   /api/calls              # Créer un nouvel appel
GET    /api/calls/:id          # Détails d'un appel
PUT    /api/calls/:id          # Mettre à jour un appel
DELETE /api/calls/:id          # Supprimer un appel
PATCH  /api/calls/:id/notes    # Mettre à jour les notes
GET    /api/calls/recent       # Appels récents
GET    /api/calls/stats        # Statistiques d'appels
GET    /api/calls/search       # Recherche dans les appels
```

### Filtres Disponibles

- `contactId` : Appels pour un contact spécifique
- `status` : Par statut (connecting, connected, ended, missed, etc.)
- `startDate` / `endDate` : Par période
- `limit` / `offset` : Pagination

## 🗄️ Schéma Base de Données

### Table `calls`

```sql
CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    phone_number VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'connecting',
    notes TEXT,
    recording_url VARCHAR(500),
    ringover_call_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Index de Performance

- `idx_calls_user_id` : Requêtes par utilisateur
- `idx_calls_contact_id` : Historique par contact
- `idx_calls_started_at` : Tri chronologique
- `idx_calls_status` : Filtrage par statut

## 🔒 Sécurité

### Authentification

- **JWT tokens** pour l'authentification
- **Middleware** de vérification sur toutes les routes
- **Rate limiting** sur les appels (100/15min)

### Validation

- **express-validator** pour validation des données
- **Sanitisation** des entrées utilisateur
- **CORS** configuré pour les domaines autorisés

### Permissions

- Utilisateurs ne voient que leurs propres appels
- **Soft delete** pour les contacts liés
- **Logs d'audit** des actions sensibles

## 📊 Statistiques et Analytics

### Métriques Calculées

- Nombre total d'appels
- Taux de réponse
- Durée moyenne des appels
- Répartition par statut
- Évolution temporelle

### Vues Base de Données

- `call_stats` : Statistiques par utilisateur
- `recent_calls_with_contacts` : Appels avec infos contact

## 🚧 Développement Futur

### Phase 2 - Améliorations

- [ ] **Enregistrements audio** avec lecture intégrée
- [ ] **Notifications** d'appels entrants
- [ ] **Synchronisation** bidirectionnelle Ringover
- [ ] **Analytics avancées** avec graphiques
- [ ] **Intégration calendrier** pour rappels
- [ ] **Templates de notes** pré-remplis
- [ ] **Export** des rapports d'appels
- [ ] **Webhook** pour événements Ringover

### Phase 3 - Enterprise

- [ ] **Call center** multi-utilisateurs
- [ ] **Supervision** en temps réel
- [ ] **IVR** et routage intelligent
- [ ] **CRM** intégration avancée
- [ ] **IA** pour transcription automatique
- [ ] **Scoring** de qualité d'appel

## 🐛 Debugging

### Logs Frontend

```javascript
// Service Ringover avec logs détaillés
console.log('🔊 État du service:', ringoverService.isInitialized);
console.log('📞 Appel en cours:', ringoverService.getCurrentCall());
```

### Logs Backend

```bash
# Vérifier les logs d'appels
tail -f logs/app.log | grep "CALL"

# Test de connexion Ringover
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/test-ringover
```

### Problèmes Courants

1. **Ringover API non configurée** : Vérifier `RINGOVER_API_KEY`
2. **CORS errors** : Ajouter l'origine frontend dans `corsOptions`
3. **JWT expirés** : Vérifier `JWT_SECRET` et durée de validité
4. **WebRTC issues** : Permissions microphone du navigateur

## 🏃‍♂️ Quick Start

1. **Clone et install** :
```bash
git clone [repository]
cd presspilot
npm install
cd backend && npm install
```

2. **Configuration** :
```bash
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos valeurs
```

3. **Database** :
```bash
createdb presspilot
psql -d presspilot -f backend/migrations/001_create_calls_table.sql
```

4. **Launch** :
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

5. **Test** :
- Naviguez vers `http://localhost:3000/contacts`
- Sélectionnez un contact avec un numéro de téléphone
- Cliquez sur le bouton d'appel 📞

## 📞 Support

Pour toute question ou problème :

1. **Documentation Ringover** : https://developers.ringover.com
2. **Issues GitHub** : [Repository issues]
3. **Support BandStream** : support@bandstream.com

---

**Développé avec ❤️ pour PressPilot by BandStream**