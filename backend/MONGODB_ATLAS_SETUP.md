# 🗄️ Configuration MongoDB Atlas pour PressPilot

## Étapes de configuration

### 1. Créer un compte MongoDB Atlas
1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un compte gratuit
3. Créer un nouveau cluster (M0 gratuit)

### 2. Configuration du cluster
1. **Nom du cluster :** `presspilot-production`
2. **Provider :** AWS (recommandé)
3. **Region :** Europe (Frankfurt eu-central-1)
4. **Tier :** M0 Sandbox (gratuit)

### 3. Configuration de sécurité
1. **Database User :**
   - Username : `presspilot-admin`
   - Password : Générer un mot de passe fort
   - Role : `Atlas admin`

2. **Network Access :**
   - Ajouter `0.0.0.0/0` (accès depuis partout)
   - Ou spécifier les IPs Railway si disponibles

### 4. Connection String
Format :
```
mongodb+srv://presspilot-admin:<password>@presspilot-production.xxxxx.mongodb.net/presspilot?retryWrites=true&w=majority
```

### 5. Variables d'environnement Railway
Dans Railway, ajouter ces variables :
```
MONGODB_URI=mongodb+srv://presspilot-admin:<password>@presspilot-production.xxxxx.mongodb.net/presspilot?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
RINGOVER_API_KEY=your-ringover-api-key
```

### 6. Migration vers le serveur principal
Une fois MongoDB Atlas configuré :
1. Modifier `package.json` : `"start": "node server.js"`
2. Redéployer sur Railway
3. Tester la connexion complète

### 7. Script de migration des données
Exécuter après connexion :
```bash
node create-admin.js
node import-journalists-data.js import
```

## Collections à créer
- `users` - Utilisateurs de la plateforme
- `artists` - Profils d'artistes
- `projects` - Projets artistiques
- `campaigns` - Campagnes email
- `contacts` - Contacts journalistes/médias
- `emailtrackings` - Tracking des emails
- `calls` - Historique des appels Ringover

## Monitoring
MongoDB Atlas fournit :
- Métriques de performance
- Alertes automatiques
- Backups automatiques
- Monitoring en temps réel

## Coûts
- **M0 (512 MB)** : Gratuit - Parfait pour commencer
- **M2 (2 GB)** : ~$9/mois - Évolution recommandée
- **M5 (5 GB)** : ~$25/mois - Production avec plus d'utilisateurs

## Support
- Documentation : https://docs.atlas.mongodb.com/
- Community : https://community.mongodb.com/
- Support technique inclus même pour le tier gratuit