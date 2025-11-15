# Fonctionnalités temporairement retirées

Pour permettre au build de fonctionner, certaines dépendances natives complexes ont été temporairement retirées. Voici la liste et comment les réintégrer.

## Packages retirés

### 1. Firebase (@react-native-firebase/*)
**Packages:**
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/messaging`

**Impact:**
- Google Sign-In désactivé (méthode `loginWithGoogle()` retourne une erreur)
- Push notifications via FCM désactivées (utilise Expo Push Notifications à la place)

**Pour réintégrer:**
1. Installer les packages:
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging
   ```

2. Obtenir un vrai fichier `google-services.json` depuis [Firebase Console](https://console.firebase.google.com/)

3. Ajouter dans `app.json`:
   ```json
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```

4. Restaurer le code Firebase dans `src/services/authService.ts` et `notificationService.ts`

### 2. WatermelonDB (@nozbe/watermelondb)
**Impact:**
- Pas de base de données locale SQLite
- Pas de synchronisation offline
- Les fichiers database/* ne fonctionnent plus

**Pour réintégrer:**
1. Installer le package:
   ```bash
   npm install @nozbe/watermelondb
   ```

2. Ajouter les decorators Babel dans `babel.config.js` (AVANT les autres plugins):
   ```javascript
   plugins: [
     ['@babel/plugin-proposal-decorators', { legacy: true }],
     // ... autres plugins
   ]
   ```

3. Réactiver les fichiers database:
   - `src/database/index.ts`
   - `src/database/schema.ts`
   - `src/database/models/*.ts`

### 3. React Native Maps (react-native-maps)
**Impact:**
- Écran Map (`MapScreen.tsx`) ne fonctionne plus
- Pas de sélection de lieu sur carte

**Pour réintégrer:**
1. Installer le package:
   ```bash
   npm install react-native-maps
   ```

2. Obtenir des clés API Google Maps:
   - [Google Cloud Console](https://console.cloud.google.com/)
   - Activer "Maps SDK for Android" et "Maps SDK for iOS"

3. Ajouter dans `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_ANDROID_API_KEY"
       }
     }
   },
   "ios": {
     "config": {
       "googleMapsApiKey": "YOUR_IOS_API_KEY"
     }
   }
   ```

4. Restaurer `src/screens/MapScreen.tsx`

### 4. Google Sign-In (@react-native-google-signin/google-signin)
**Impact:**
- Bouton "Se connecter avec Google" ne fonctionne pas

**Pour réintégrer:**
1. Installer le package:
   ```bash
   npm install @react-native-google-signin/google-signin
   ```

2. Configurer OAuth dans [Google Cloud Console](https://console.cloud.google.com/):
   - Créer des identifiants OAuth 2.0
   - Obtenir le `webClientId`

3. Restaurer le code Google Sign-In dans `src/services/authService.ts`:
   ```typescript
   import { GoogleSignin } from '@react-native-google-signin/google-signin';

   async initialize() {
     GoogleSignin.configure({
       webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
     });
   }

   async loginWithGoogle() {
     await GoogleSignin.hasPlayServices();
     const { idToken } = await GoogleSignin.signIn();
     const googleCredential = auth.GoogleAuthProvider.credential(idToken);
     return auth().signInWithCredential(googleCredential);
   }
   ```

## Fonctionnalités actuellement disponibles

✅ **Navigation** - React Navigation fonctionne
✅ **UI Components** - Tous les composants UI sont disponibles
✅ **État global** - Zustand pour state management
✅ **Authentification email/password** - Via backend API
✅ **Notifications locales** - Expo Notifications
✅ **Location** - expo-location pour géolocalisation
✅ **Calendrier** - expo-calendar pour intégration calendrier
✅ **Storage** - AsyncStorage pour petites données

## Ordre recommandé de réintégration

1. **Firebase** (pour auth et notifications cloud)
2. **Google Sign-In** (dépend de Firebase Auth)
3. **React Native Maps** (fonctionnalité indépendante)
4. **WatermelonDB** (le plus complexe, à faire en dernier)

## Support

Si vous avez besoin d'aide pour réintégrer ces fonctionnalités, consultez:
- [Documentation Expo](https://docs.expo.dev/)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
