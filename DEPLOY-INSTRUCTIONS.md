# 🚀 Instructions de déploiement - PressPilot Landing Page

## ⚠️ Problème identifié
Le nouveau code de la landing page n'est PAS déployé sur Railway. Le serveur sert toujours l'ancienne version.

## ✅ Solution - Étapes à suivre

### 1. Vérifier le statut Git
```bash
git status
git log --oneline -5
```

### 2. Si les changements ne sont pas commités
```bash
# Ajouter tous les fichiers modifiés
git add .

# Commiter avec un message clair
git commit -m "feat: New landing page design with 10 sections + cache fix"
```

### 3. Pousser vers Railway
```bash
# Vérifier la branche actuelle
git branch

# Si vous êtes sur main
git push origin main

# Si Railway utilise une autre branche (ex: production)
git push origin main:production
```

### 4. Vérifier le déploiement sur Railway

1. **Connectez-vous au dashboard Railway** : https://railway.app/
2. **Allez dans votre projet** : Frontend-PressPilot
3. **Vérifiez les deployments** :
   - Le dernier déploiement doit montrer votre commit
   - Status : "Success"
   - Regardez les logs de build

### 5. Forcer un redéploiement si nécessaire

Si le push ne déclenche pas de déploiement :

1. Dans Railway Dashboard :
   - Cliquez sur le service "frontend"
   - Cliquez sur "Settings"
   - Cliquez sur "Redeploy" (avec le dernier commit)

2. Ou via Railway CLI :
```bash
railway up
```

### 6. Vérifier après déploiement
```bash
# Exécuter le script de vérification
./check-deployment.sh

# Ou manuellement
curl -s https://frontend-production-7280.up.railway.app | grep -o "landing-page"
```

## 🔧 Configuration Railway (à vérifier)

Assurez-vous que dans Railway :

1. **Build Command** : `npm run build`
2. **Start Command** : Non nécessaire (Dockerfile gère tout)
3. **Root Directory** : `.` (ou le chemin vers votre frontend)
4. **Branch** : `main` (ou celle que vous utilisez)
5. **Auto Deploy** : Activé

## 📝 Changements appliqués

### Fichiers modifiés :
- ✅ `src/pages/HomePage.jsx` - Nouveau design avec 10 sections
- ✅ `src/styles/HomePage.css` - 1265 lignes de styles `lp-*`
- ✅ `nginx.conf` - Headers no-cache pour index.html
- ✅ `src/buildVersion.js` - Version tracking
- ✅ `src/main.jsx` - Import du buildVersion

### Nouvelles features :
- Navigation sticky avec scroll effect
- Hero section avec animations
- Stats bar (500+ campagnes, 15k+ contacts, etc.)
- Pain points avec solutions
- 6 features cards
- How it works (4 steps)
- 3 testimonials
- Pricing (3 plans avec toggle annuel)
- FAQ accordéon (7 questions)
- Footer complet

## 🚨 Si ça ne fonctionne toujours pas

1. **Vérifiez le repository Git distant** :
```bash
git remote -v
git ls-remote origin HEAD
```

2. **Vérifiez que Railway pointe vers le bon repo** :
- Settings > GitHub > Repository

3. **Inspectez les logs Railway** :
- Deployments > Cliquez sur le dernier > View logs

4. **Cache CDN externe ?**
- Cloudflare ou autre CDN devant Railway ?
- Si oui : Purge cache dans le dashboard CDN

## 📞 Support

Si le problème persiste après ces étapes :
1. Vérifiez les logs de build dans Railway
2. Contactez le support Railway avec le deployment ID
3. Partagez le contenu de `check-deployment.sh`