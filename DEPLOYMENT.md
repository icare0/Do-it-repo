# Guide de Déploiement - TaskFlow

Ce guide détaille les étapes pour déployer TaskFlow en production.

## 📋 Table des Matières

1. [Pré-déploiement](#pré-déploiement)
2. [Déploiement Backend](#déploiement-backend)
3. [Déploiement Mobile](#déploiement-mobile)
4. [Configuration Production](#configuration-production)
5. [Monitoring & Maintenance](#monitoring--maintenance)

## Pré-déploiement

### Checklist de Sécurité

- [ ] Changer tous les secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] Configurer les variables d'environnement production
- [ ] Activer HTTPS/SSL
- [ ] Configurer les domaines et CORS
- [ ] Vérifier les rate limits
- [ ] Tester l'authentification OAuth
- [ ] Vérifier les permissions des services (Calendar, Location, Notifications)

### Services Requis

1. **Firebase** : Pour l'authentification et les notifications push
2. **Google Cloud** : Pour Google Maps, Calendar API, OAuth
3. **MongoDB Atlas** : Base de données cloud (ou MongoDB auto-hébergé)
4. **Serveur** : VPS, AWS, GCP, Azure, ou Heroku

## Déploiement Backend

### Option 1 : Docker sur VPS (Recommandé)

#### 1. Préparer le serveur

```bash
# Se connecter au serveur
ssh root@your-server-ip

# Installer Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose -y

# Vérifier l'installation
docker --version
docker-compose --version
```

#### 2. Cloner et configurer

```bash
# Cloner le repository
git clone https://github.com/votre-username/taskflow.git
cd taskflow

# Créer les variables d'environnement
cp backend/.env.example backend/.env
nano backend/.env
# Éditer avec vos vraies valeurs de production
```

#### 3. Configurer MongoDB

Option A : Utiliser MongoDB Atlas (Cloud)
```bash
# Dans backend/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
```

Option B : MongoDB local avec Docker (docker-compose.yml déjà configuré)
```bash
# Les données seront persistées dans le volume docker
```

#### 4. Lancer les services

```bash
# Build et démarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f backend

# Vérifier que tout fonctionne
curl http://localhost:3000/api/health
```

#### 5. Configurer Nginx (Reverse Proxy)

```bash
# Installer Nginx
apt-get update
apt-get install nginx -y

# Créer la configuration
nano /etc/nginx/sites-available/taskflow
```

Configuration Nginx :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 6. Configurer SSL avec Let's Encrypt

```bash
# Installer Certbot
apt-get install certbot python3-certbot-nginx -y

# Obtenir le certificat SSL
certbot --nginx -d api.votre-domaine.com

# Auto-renouvellement
certbot renew --dry-run
```

### Option 2 : Déploiement sur Heroku

```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer l'application
cd backend
heroku create taskflow-api

# Configurer MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret
# ... autres variables

# Déployer
git push heroku main

# Voir les logs
heroku logs --tail
```

### Option 3 : AWS / GCP / Azure

Utiliser les services cloud respectifs :
- **AWS** : EC2 + RDS/DocumentDB + Elastic Beanstalk
- **GCP** : Compute Engine + Cloud MongoDB + App Engine
- **Azure** : Virtual Machines + Cosmos DB + App Service

## Déploiement Mobile

### Prérequis

```bash
# Installer EAS CLI
npm install -g eas-cli

# Login
eas login

# Initialiser le projet
cd mobile
eas build:configure
```

### Configuration Production

#### 1. Configurer app.json

```json
{
  "expo": {
    "name": "TaskFlow",
    "slug": "taskflow",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "ios": {
      "bundleIdentifier": "com.votreentreprise.taskflow",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.votreentreprise.taskflow",
      "versionCode": 1
    }
  }
}
```

#### 2. Configurer les API Keys

```bash
# Créer eas.json
cat > eas.json << EOF
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.votre-domaine.com"
      }
    }
  }
}
EOF
```

#### 3. Ajouter les fichiers Firebase

- `google-services.json` pour Android
- `GoogleService-Info.plist` pour iOS

### Build Android

```bash
# Build APK (pour tests)
eas build --platform android --profile preview

# Build AAB (pour Play Store)
eas build --platform android --profile production
```

#### Publier sur Google Play Store

1. Créer un compte développeur Google Play (25$ une fois)
2. Créer une nouvelle application
3. Uploader l'AAB généré par EAS Build
4. Remplir les informations (description, captures d'écran, etc.)
5. Soumettre pour révision

### Build iOS

```bash
# Prérequis : Apple Developer Account (99$/an)

# Build IPA
eas build --platform ios --profile production
```

#### Publier sur App Store

1. Créer un compte développeur Apple (99$/an)
2. Créer l'app dans App Store Connect
3. Uploader l'IPA via Transporter ou EAS Submit
4. Remplir les métadonnées
5. Soumettre pour révision

### Submit automatique

```bash
# Android
eas submit --platform android

# iOS
eas submit --platform ios
```

## Configuration Production

### Variables d'Environnement Backend

```env
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow

# JWT
JWT_SECRET=generate-with-openssl-rand-hex-32
JWT_REFRESH_SECRET=generate-with-openssl-rand-hex-32
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://votre-app.com

# Logs
LOG_LEVEL=info
```

### Générer des secrets sécurisés

```bash
# JWT Secret
openssl rand -hex 32

# Refresh Token Secret
openssl rand -hex 32
```

## Monitoring & Maintenance

### Logs Backend

```bash
# Docker logs
docker-compose logs -f backend

# Logs persistés
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Monitoring avec PM2 (alternative à Docker)

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'app
cd backend
pm2 start dist/server.js --name taskflow-api

# Monitoring
pm2 status
pm2 logs taskflow-api
pm2 monit

# Auto-restart au boot
pm2 startup
pm2 save
```

### Health Checks

```bash
# Vérifier l'API
curl https://api.votre-domaine.com/api/health

# Monitoring automatique avec cron
0 */5 * * * curl https://api.votre-domaine.com/api/health || mail -s "API Down" admin@example.com
```

### Backups MongoDB

#### Avec MongoDB Atlas
Les backups automatiques sont inclus.

#### Avec MongoDB self-hosted

```bash
# Backup manuel
docker exec taskflow-mongodb mongodump --out /backup

# Script automatique (cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec taskflow-mongodb mongodump --out /backup/backup_$DATE
# Garder seulement les 7 derniers jours
find /backup -type d -mtime +7 -exec rm -rf {} +
```

### Mise à jour de l'application

```bash
# Backend
cd taskflow
git pull origin main
docker-compose down
docker-compose up -d --build

# Vérifier
docker-compose logs -f backend
```

```bash
# Mobile
cd mobile
# Incrémenter version dans app.json
# Build et submit nouvelle version
eas build --platform all --profile production
eas submit --platform all
```

### Rollback en cas de problème

```bash
# Backend
git checkout <commit-hash-stable>
docker-compose down
docker-compose up -d --build

# Mobile
# Soumettez la version précédente depuis l'historique des builds EAS
```

## Checklist Finale

Avant de lancer en production :

- [ ] Tests E2E passent
- [ ] Variables d'environnement configurées
- [ ] SSL/HTTPS actif
- [ ] Backups automatiques configurés
- [ ] Monitoring en place
- [ ] Rate limiting testé
- [ ] OAuth configuré et testé
- [ ] Notifications push fonctionnelles
- [ ] Géolocalisation testée
- [ ] Synchronisation offline testée
- [ ] App approuvée sur les stores
- [ ] Documentation utilisateur prête
- [ ] Support/helpdesk configuré

## Support Production

En cas de problème :

1. Vérifier les logs : `docker-compose logs -f`
2. Vérifier le status : `docker-compose ps`
3. Redémarrer si nécessaire : `docker-compose restart backend`
4. Vérifier la connectivité MongoDB
5. Vérifier les variables d'environnement
6. Contacter le support si problème persistant

---

**Production ready! 🚀**
