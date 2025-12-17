# Configuration pour la Production

## Variables d'environnement requises

Pour que l'application fonctionne correctement en production, vous devez créer un fichier `.env` à la racine du dossier `mobile/` avec les variables suivantes :

### 1. Configuration de l'API

```env
API_URL=https://votre-api-production.com/api
DEV_API_URL=http://localhost:3000/api
```

**Important :** Remplacez `https://votre-api-production.com/api` par l'URL réelle de votre API en production.

### 2. Google OAuth (Authentification)

Pour configurer Google Sign-In, vous avez besoin de 3 Client IDs différents :

```env
GOOGLE_WEB_CLIENT_ID=VOTRE-WEB-CLIENT-ID.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=VOTRE-IOS-CLIENT-ID.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=VOTRE-ANDROID-CLIENT-ID.apps.googleusercontent.com
```

#### Comment obtenir les Google Client IDs :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez ou sélectionnez votre projet
3. Activez l'API "Google Sign-In"
4. Allez dans "Identifiants" (Credentials)
5. Créez 3 OAuth 2.0 Client IDs :
   - **Web Client ID** : Type "Application Web"
   - **iOS Client ID** : Type "iOS", Bundle ID = `com.icare.doit`
   - **Android Client ID** : Type "Android", Package name = `com.icare.doit`
6. Pour Android, vous devrez aussi fournir le SHA-1 de votre certificat de signature

### 3. Google Maps API

```env
GOOGLE_MAPS_API_KEY_IOS=VOTRE-CLE-GOOGLE-MAPS
GOOGLE_MAPS_API_KEY_ANDROID=VOTRE-CLE-GOOGLE-MAPS
```

#### Comment obtenir une clé Google Maps :

1. Dans [Google Cloud Console](https://console.cloud.google.com/)
2. Activez "Maps SDK for iOS" et "Maps SDK for Android"
3. Créez une clé API dans "Identifiants"
4. Restreignez la clé pour iOS et Android

### 4. Firebase (pour Google Authentication)

Vous devez configurer Firebase pour Android et iOS :

#### Android :
1. Téléchargez `google-services.json` depuis Firebase Console
2. Placez-le dans `/mobile/google-services.json`

#### iOS :
1. Téléchargez `GoogleService-Info.plist` depuis Firebase Console
2. Placez-le dans le dossier iOS de votre projet

## Exemple de fichier .env complet

```env
# API Configuration
API_URL=https://api.doit-app.com/api
DEV_API_URL=http://localhost:3000/api

# Google OAuth
GOOGLE_WEB_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=123456789-lmnopqrstuv.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=123456789-wxyz123456.apps.googleusercontent.com

# Google Maps
GOOGLE_MAPS_API_KEY_IOS=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
GOOGLE_MAPS_API_KEY_ANDROID=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

## Nouvelle Page de Reconnexion

La nouvelle page de reconnexion a été mise à jour avec :

✅ **Design moderne** : Fond en dégradé avec mockup de l'interface principale
✅ **Effet de flou élégant** : Utilisation de BlurView pour un rendu professionnel
✅ **Interface simplifiée** :
  - Bouton principal "Continuer avec Google"
  - Option secondaire "Se connecter avec Email" (ouvre un modal)
  - Lien "Créer un compte"
✅ **Support du mode sombre** : S'adapte automatiquement au thème de l'appareil
✅ **Expérience utilisateur fluide** : Modal pour la connexion email/password

## Checklist avant le déploiement

- [ ] Créer le fichier `.env` avec toutes les variables requises
- [ ] Télécharger et placer `google-services.json` (Android)
- [ ] Télécharger et placer `GoogleService-Info.plist` (iOS)
- [ ] Vérifier que l'API backend est déployée et accessible
- [ ] Tester la connexion Google sur iOS et Android
- [ ] Tester la connexion Email/Password
- [ ] Vérifier que les Google Maps fonctionnent
- [ ] Tester la synchronisation en mode hors ligne
- [ ] Build de production avec `eas build`

## Commandes utiles

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm start

# Build Android
npm run build:android

# Build iOS
npm run build:ios

# Vérification TypeScript
npm run type-check

# Tests
npm test
```

## Support

Pour toute question ou problème, consultez :
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Google Sign-In](https://developers.google.com/identity)
