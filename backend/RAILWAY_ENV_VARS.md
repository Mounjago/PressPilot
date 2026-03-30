# Variables d'environnement pour Railway

## Variables a configurer dans Railway Settings :

> **IMPORTANT** : Ne JAMAIS ecrire de vrais credentials dans ce fichier.
> Configurez-les directement dans le dashboard Railway.

```
MONGODB_URI=<your_mongodb_connection_string>
NODE_ENV=production
JWT_SECRET=<generate_with: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
MAILGUN_API_KEY=<your_mailgun_api_key>
MAILGUN_DOMAIN=<your_mailgun_domain>
ENCRYPTION_KEY=<generate_with: openssl rand -hex 32>
```

## Comment configurer :
1. Aller dans Railway Dashboard
2. Selectionner le projet Backend PressPilot
3. Aller dans Settings > Variables
4. Ajouter chaque variable une par une

## Variables optionnelles (pour plus tard) :
```
RINGOVER_API_KEY=<your_ringover_api_key>
PORT=3001
SENTRY_DSN=<your_sentry_dsn>
REDIS_URL=<your_redis_url>
```

## Generer des secrets securises :
```bash
# JWT Secret (64 bytes hex)
openssl rand -hex 64

# Encryption Key (32 bytes hex)
openssl rand -hex 32
```
