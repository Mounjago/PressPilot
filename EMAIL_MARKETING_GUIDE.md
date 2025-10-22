# GUIDE SYSTÈME EMAIL MARKETING PRESSPILOT

## 📧 Vue d'ensemble

Ce guide décrit le système d'email marketing 100% opérationnel intégré à PressPilot. Le système permet l'envoi réel d'emails avec tracking complet, analytics en temps réel et gestion RGPD.

## 🏗️ Architecture Technique

### Backend (Node.js/Express)

#### Services Email
- **Service principal**: `backend/services/emailService.js`
- **Provider**: Mailgun (API EU)
- **Fonctionnalités**: Envoi, tracking, webhooks, désinscriptions

#### Routes API
- **Campagnes**: `/api/campaigns/*`
- **Tracking**: `/api/email/*`
- **Analytics**: `/api/analytics/email/*`

#### Modèles de Données
- **Campaign**: Gestion des campagnes
- **EmailTracking**: Suivi individuel des emails
- **Contact**: Base de données journalistes

### Frontend (React)

#### Composants Principaux
- **CampaignEmailManager**: Interface d'envoi et suivi
- **CampaignListAdvanced**: Gestion des campagnes
- **EmailAnalyticsDashboard**: Analytics temps réel

## ⚙️ Configuration

### 1. Variables d'Environnement Backend

Copiez `.env.example` vers `.env` et configurez :

```bash
# Configuration Mailgun (OBLIGATOIRE)
MAILGUN_API_KEY=key-votre_cle_api_mailgun
MAILGUN_DOMAIN=votre-domaine.mailgun.org
MAILGUN_FROM_EMAIL=noreply@votredomaine.com
MAILGUN_WEBHOOK_SIGNING_KEY=votre_cle_signature_webhook
MAILGUN_BASE_URL=https://api.eu.mailgun.net

# Configuration Base de Données
MONGODB_URI=mongodb://localhost:27017/presspilot

# Configuration JWT
JWT_SECRET=votre_secret_jwt_securise

# Configuration Frontend
FRONTEND_URL=http://localhost:3000
```

### 2. Configuration Mailgun

#### Création du compte Mailgun
1. Allez sur [mailgun.com](https://www.mailgun.com)
2. Créez un compte et ajoutez votre domaine
3. Vérifiez le domaine via DNS
4. Récupérez votre clé API

#### Configuration DNS
Ajoutez ces enregistrements DNS :

```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@votredomaine.com

Type: TXT
Name: k1._domainkey
Value: [Clé DKIM fournie par Mailgun]

Type: CNAME
Name: email
Value: mailgun.org
```

#### Configuration Webhooks
Dans le tableau de bord Mailgun, configurez ces webhooks :

```
URL: https://votre-api.com/api/email/webhooks/mailgun
Événements: delivered, opened, clicked, bounced, complained, unsubscribed
```

### 3. Installation et Démarrage

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd ../
npm install
npm run dev
```

## 🚀 Utilisation

### 1. Création d'une Campagne

1. **Navigation**: Allez dans Artistes → Projets → Campagnes
2. **Création**: Cliquez sur "Nouvelle campagne"
3. **Configuration**:
   - Nom de la campagne
   - Sujet de l'email
   - Sélection des contacts
   - Contenu (éditeur libre ou template)

### 2. Test d'Email

Avant l'envoi définitif :
1. Cliquez sur "Tester"
2. Saisissez votre email
3. Vérifiez la réception et l'affichage

### 3. Envoi de Campagne

1. **Vérifications**: Service en ligne, contacts sélectionnés
2. **Envoi**: Cliquez sur "Envoyer la campagne"
3. **Confirmation**: Confirmer dans la modal
4. **Suivi**: Monitoring en temps réel

### 4. Analytics et Suivi

#### Métriques Disponibles
- **Taux d'envoi**: Emails délivrés
- **Taux d'ouverture**: Lectures d'emails
- **Taux de clic**: Clics sur liens
- **Taux de réponse**: Réponses reçues
- **Score d'engagement**: Métrique composite

#### Dashboard Analytics
- Graphiques temporels
- Activité en temps réel
- Top des campagnes
- Insights et recommandations

## 🔧 Fonctionnalités Avancées

### Tracking Automatique

#### Pixels de Tracking
- Ajout automatique d'un pixel 1x1 transparent
- Tracking des ouvertures d'emails
- Détection du type d'appareil

#### Liens Trackés
- Redirection automatique via `/api/email/track/click/`
- Tracking de la position des liens
- Maintien de l'expérience utilisateur

### Gestion RGPD

#### Désinscription
- Lien automatique dans chaque email
- Page de désinscription conforme
- Traitement immédiat des demandes

#### Consentement
- Gestion des statuts de contact
- Respect des préférences
- Audit trail complet

### Webhooks Mailgun

Traitement en temps réel des événements :
- `delivered`: Email délivré
- `opened`: Email ouvert
- `clicked`: Lien cliqué
- `bounced`: Email rejeté
- `complained`: Marqué comme spam
- `unsubscribed`: Désinscription

## 🧪 Tests et Validation

### Tests Recommandés

#### 1. Test de Configuration
```bash
# Tester la connexion Mailgun
curl -X GET http://localhost:3001/api/campaigns/service/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Test d'Envoi Simple
1. Créez une campagne de test
2. Sélectionnez un seul contact (vous-même)
3. Envoyez et vérifiez la réception

#### 3. Test de Tracking
1. Ouvrez l'email reçu
2. Cliquez sur un lien
3. Vérifiez les stats dans le dashboard

#### 4. Test de Webhooks
1. Configurez les webhooks Mailgun
2. Envoyez un email de test
3. Vérifiez les événements dans les logs

### Validation de Production

#### Checklist Pré-Déploiement
- [ ] Configuration DNS complète
- [ ] Webhooks Mailgun configurés
- [ ] Variables d'environnement en production
- [ ] Base de données sécurisée
- [ ] SSL/TLS activé
- [ ] Rate limiting configuré
- [ ] Logs et monitoring activés

## 📊 Monitoring et Performance

### Métriques Clés à Surveiller

#### Performance Technique
- Temps de réponse API
- Taux d'erreur Mailgun
- Disponibilité des webhooks
- Performance base de données

#### Métriques Business
- Taux de délivrabilité global
- Évolution des taux d'engagement
- ROI des campagnes
- Satisfaction journalistes

### Alertes Recommandées

- Taux d'erreur > 5%
- Temps de réponse > 2s
- Webhooks en échec
- Quota Mailgun atteint

## 🔒 Sécurité et Conformité

### Sécurité

#### Protection des Données
- Chiffrement des données sensibles
- Authentification JWT
- Rate limiting strict
- Validation des entrées

#### Conformité RGPD
- Consentement explicite
- Droit à l'effacement
- Portabilité des données
- Audit trail complet

### Bonnes Pratiques

#### Envoi d'Emails
- Respecter les limites de fréquence
- Segmenter les audiences
- Personnaliser le contenu
- Surveiller la réputation

#### Gestion des Contacts
- Mise à jour régulière
- Nettoyage des bounces
- Respect des préférences
- Suivi des interactions

## 🆘 Dépannage

### Problèmes Courants

#### Emails non reçus
1. Vérifier la configuration DNS
2. Contrôler les logs Mailgun
3. Vérifier la réputation du domaine
4. Tester avec différents fournisseurs email

#### Tracking non fonctionnel
1. Vérifier la configuration des webhooks
2. Contrôler la connectivité réseau
3. Vérifier les URLs de tracking
4. Tester avec des emails simples

#### Performance dégradée
1. Analyser les logs de performance
2. Optimiser les requêtes base de données
3. Ajuster les paramètres de batch
4. Surveiller l'utilisation mémoire

### Support et Documentation

- **Documentation Mailgun**: [documentation.mailgun.com](https://documentation.mailgun.com)
- **Logs d'erreur**: Vérifier les logs serveur et Mailgun
- **Monitoring**: Utiliser les outils intégrés d'analytics

## 🚀 Roadmap et Améliorations

### Fonctionnalités Futures

#### Court Terme
- Tests A/B automatisés
- Templates visuels avancés
- Segmentation automatique
- Planification récurrente

#### Moyen Terme
- IA pour optimisation d'envoi
- Intégration réseaux sociaux
- Analytics prédictifs
- API publique

#### Long Terme
- Plateforme multi-tenant
- Marketplace de templates
- Intégrations CRM avancées
- Machine learning avancé

---

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs d'erreur
2. Vérifiez la configuration
3. Testez avec des données simples
4. Documentez le problème précisément

Le système est conçu pour être robuste et scalable, adapté aux besoins professionnels des attachés de presse musicaux.