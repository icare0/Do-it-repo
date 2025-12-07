# 🚀 Guide de Configuration Production - Do'It Mobile

Ce guide vous accompagne pour configurer l'application Do'It en production.

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Configuration du Backend](#configuration-du-backend)
3. [Configuration Firebase](#configuration-firebase)
4. [Configuration Google APIs](#configuration-google-apis)
5. [Configuration Mobile](#configuration-mobile)
6. [Build et Déploiement](#build-et-déploiement)
7. [Vérification et Tests](#vérification-et-tests)

---

## ✅ Prérequis

### Outils nécessaires
- Node.js 18+ installé
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI pour les builds (`npm install -g eas-cli`)
- Un compte Expo (créer sur https://expo.dev)
- Un compte Google Cloud Platform
- Un projet Firebase

### Comptes à créer
- [ ] Compte Expo
- [ ] Projet Firebase
- [ ] Projet Google Cloud Platform
- [ ] Compte développeur Apple (pour iOS)
- [ ] Compte développeur Google Play (pour Android)

---

## 🔧 Configuration du Backend

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

### 3. Configurer le fichier .env du backend

Modifiez `backend/.env` avec vos vraies valeurs :

```env
# Node Environment
NODE_ENV=production
PORT=3000

# MongoDB (remplacer par votre URI de production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doit?retryWrites=true&w=majority

# Redis (si vous utilisez Redis)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (GÉNÉRER DE NOUVEAUX SECRETS !)
JWT_SECRET=GÉNÉRER_UN_SECRET_DE_64_CARACTÈRES_ICI
JWT_REFRESH_SECRET=GÉNÉRER_UN_AUTRE_SECRET_DE_64_CARACTÈRES_ICI

# Pour générer des secrets sécurisés, exécutez :
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=https://votre-api-production.com/api/calendar/callback

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# CORS
CORS_ORIGIN=https://votre-app-web.com,https://votre-autre-domaine.com
```

### 4. Ajouter le fichier de service Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Paramètres du projet → Comptes de service
4. Générer une nouvelle clé privée
5. Enregistrez le fichier JSON dans `backend/config/firebase-service-account.json`

### 5. Déployer le backend

Déployez votre backend sur votre plateforme (Heroku, Railway, DigitalOcean, AWS, etc.)

```bash
# Exemple pour Heroku
heroku create doit-backend
git push heroku main

# Ou construire pour production
npm run build
npm start
```

**⚠️ IMPORTANT** : Notez l'URL de votre backend déployé (ex: `https://doit-api.herokuapp.com`)

---

## 🔥 Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur https://console.firebase.google.com
2. Cliquez sur "Ajouter un projet"
3. Nommez-le "Do'It" (ou autre)
4. Activez Google Analytics (optionnel)

### 2. Activer Authentication

1. Dans Firebase Console → Authentication
2. Cliquez sur "Commencer"
3. Activez les méthodes de connexion :
   - Email/Password
   - Google
   - Apple (pour iOS)

### 3. Activer Cloud Messaging (Notifications Push)

1. Dans Firebase Console → Cloud Messaging
2. Notez votre **Server Key** et **Sender ID**

### 4. Télécharger les fichiers de configuration

#### Pour iOS :
1. Ajouter une app iOS
2. Bundle ID : `com.icare.doit` (ou votre bundle ID)
3. Télécharger `GoogleService-Info.plist`
4. Placer dans `mobile/ios/` (si vous utilisez un projet bare)

#### Pour Android :
1. Ajouter une app Android
2. Package name : `com.icare.doit`
3. Télécharger `google-services.json`
4. Placer dans `mobile/` (à la racine du projet mobile)

**Note** : Pour Expo, le fichier `google-services.json` doit être à la racine du dossier `mobile/`

---

## 🔑 Configuration Google APIs

### 1. Activer les APIs nécessaires

Dans [Google Cloud Console](https://console.cloud.google.com) :

1. Créez un nouveau projet ou sélectionnez-en un
2. Activez les APIs suivantes :
   - Google Calendar API
   - Google Tasks API
   - Google Maps SDK for iOS
   - Google Maps SDK for Android
   - Google Sign-In

### 2. Créer les identifiants OAuth 2.0

#### Pour l'application Web (Backend)
1. APIs & Services → Identifiants → Créer des identifiants → ID client OAuth 2.0
2. Type : Application Web
3. URI de redirection autorisés : `https://votre-backend.com/api/calendar/callback`
4. Notez le **Client ID** et **Client Secret**

#### Pour iOS
1. Créer un ID client OAuth 2.0
2. Type : iOS
3. Bundle ID : `com.icare.doit`
4. Notez le **iOS Client ID**

#### Pour Android
1. Créer un ID client OAuth 2.0
2. Type : Android
3. Package name : `com.icare.doit`
4. Certificat SHA-1 : obtenir avec `keytool` ou EAS
5. Notez l'**Android Client ID**

### 3. Créer les clés API Google Maps

1. APIs & Services → Identifiants → Créer des identifiants → Clé API
2. Créez **2 clés séparées** :
   - Une pour iOS (restreindre à l'API iOS)
   - Une pour Android (restreindre à l'API Android)

**⚠️ SÉCURITÉ** : Restreignez chaque clé à son API spécifique et à votre package/bundle ID

---

## 📱 Configuration Mobile

### 1. Installer les dépendances

```bash
cd mobile
npm install
```

### 2. Configurer les variables d'environnement

Modifiez le fichier `mobile/.env` :

```env
# API Configuration - REMPLACER par votre vraie URL
API_URL=https://votre-backend-production.com/api
DEV_API_URL=http://localhost:3000/api

# Google OAuth - REMPLACER par vos vrais identifiants
GOOGLE_WEB_CLIENT_ID=votre-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=votre-ios-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=votre-android-client-id.apps.googleusercontent.com

# Google Maps API Keys - REMPLACER par vos vraies clés
GOOGLE_MAPS_API_KEY_IOS=votre-cle-api-ios
GOOGLE_MAPS_API_KEY_ANDROID=votre-cle-api-android
```

### 3. Configurer app.config.js

Le fichier `app.config.js` est déjà configuré pour utiliser les variables d'environnement.

Vérifiez que les clés sont bien chargées :

```javascript
// mobile/app.config.js
require('dotenv').config();

export default ({ config }) => ({
  ...config,
  // Les variables d'environnement sont automatiquement chargées
});
```

### 4. Installer dotenv

```bash
npm install dotenv
```

### 5. Mettre à jour authService pour utiliser les variables d'environnement

Modifiez `mobile/src/services/authService.ts` :

```typescript
import Constants from 'expo-constants';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;
const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId;
const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId;
```

---

## 🏗️ Build et Déploiement

### 1. Connecter EAS

```bash
eas login
eas build:configure
```

### 2. Configurer eas.json

Le fichier `eas.json` devrait ressembler à :

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://votre-backend-staging.com/api"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://votre-backend-production.com/api"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Build iOS

```bash
# Build de développement
eas build --platform ios --profile development

# Build de production
eas build --platform ios --profile production
```

### 4. Build Android

```bash
# Build de développement
eas build --platform android --profile development

# Build de production
eas build --platform android --profile production
```

### 5. Soumettre aux stores

#### App Store (iOS)
```bash
eas submit --platform ios
```

Vous aurez besoin :
- Compte Apple Developer ($99/an)
- App Store Connect configuré
- Certificats et profils de provisioning

#### Google Play Store (Android)
```bash
eas submit --platform android
```

Vous aurez besoin :
- Compte Google Play Developer ($25 unique)
- Play Console configuré
- Clé de signature

---

## ✅ Vérification et Tests

### Checklist avant la production

#### Backend
- [ ] MongoDB est en production (pas localhost)
- [ ] Redis est configuré (si utilisé)
- [ ] Secrets JWT sont générés de manière sécurisée
- [ ] Firebase service account est configuré
- [ ] Google OAuth est configuré avec les bonnes URIs
- [ ] CORS est configuré avec les bons domaines
- [ ] Variables d'environnement sont toutes définies
- [ ] Backend est déployé et accessible

#### Mobile
- [ ] `.env` est configuré avec les vraies valeurs
- [ ] `google-services.json` est à la racine de mobile/
- [ ] Firebase est configuré (iOS + Android)
- [ ] Google Sign-In est configuré
- [ ] Google Maps API keys sont configurées
- [ ] Google Calendar API est activée
- [ ] Permissions sont correctes dans app.json
- [ ] Les clés API exposées dans le code ont été remplacées

#### Sécurité
- [ ] Toutes les clés API hardcodées ont été retirées
- [ ] Les secrets sont stockés de manière sécurisée
- [ ] Les clés Google Maps sont restreintes par platform
- [ ] Firebase rules sont configurées
- [ ] Rate limiting est activé sur le backend
- [ ] HTTPS est activé partout

#### Fonctionnalités
- [ ] Authentification fonctionne (Email + Google)
- [ ] Synchronisation des tâches fonctionne
- [ ] Récupération du calendrier Google fonctionne
- [ ] Notifications push fonctionnent
- [ ] Géolocalisation fonctionne
- [ ] L'IA optimise les tâches correctement
- [ ] La flamme (streak) est cliquable et affiche les stats
- [ ] La navbar est moderne et fonctionne bien

### Tests à effectuer

```bash
# En développement
cd mobile
npm start

# Tester sur un appareil physique
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Tests manuels importants
1. **Connexion** : Tester email et Google Sign-In
2. **Synchronisation** : Créer/modifier/supprimer une tâche et vérifier la sync
3. **Calendrier** : Vérifier que les événements Google Calendar s'affichent
4. **Notifications** : Programmer une tâche et vérifier la notification
5. **Stats** : Cliquer sur la flamme et vérifier l'affichage
6. **Offline** : Couper le réseau et vérifier le mode offline

---

## 🆘 Dépannage

### Le backend ne se connecte pas

1. Vérifiez que `API_URL` dans `.env` est correct
2. Vérifiez que le backend est bien déployé et accessible
3. Testez l'URL avec `curl https://votre-backend.com/api/health`

### Les notifications ne fonctionnent pas

1. Vérifiez que `google-services.json` est présent
2. Vérifiez que Firebase Messaging est activé
3. Vérifiez les permissions de notification sur l'appareil
4. Consultez les logs : `expo start` ou `adb logcat` (Android)

### Google Sign-In échoue

1. Vérifiez que tous les Client IDs sont corrects
2. Vérifiez que le SHA-1 est correct (Android)
3. Vérifiez que le Bundle ID est correct (iOS)
4. Attendez 5-10 minutes après avoir créé les identifiants

### Le calendrier ne récupère rien

1. Vérifiez que Google Calendar API est activée
2. Vérifiez les permissions de calendrier sur l'appareil
3. Vérifiez que le backend a accès à l'API Google Calendar
4. Testez avec `curl` l'endpoint `/api/calendar/events`

### Erreurs de build

```bash
# Nettoyer le cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Expo cache
expo r -c
```

---

## 📞 Support

Pour toute question :
- Consultez la [documentation Expo](https://docs.expo.dev)
- Consultez la [documentation Firebase](https://firebase.google.com/docs)
- Consultez la [documentation Google Cloud](https://cloud.google.com/docs)

---

## 🎉 Félicitations !

Votre application Do'It est maintenant prête pour la production ! 🚀
