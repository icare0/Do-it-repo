
# Do'It - Smart To-Do List App

Une application mobile de gestion de tâches intelligente avec synchronisation temps réel, géolocalisation, et intégration calendrier.

## 🚀 Fonctionnalités

### Mobile (React Native)
- ✅ **Authentification** : Email/Password, Google OAuth, Apple Sign In
- ✅ **Quick Add** : Ajout rapide avec parsing NLP intelligent
- ✅ **Timeline** : Vue quotidienne avec progression
- ✅ **Géolocalisation** : Rappels basés sur la localisation avec géofencing
- ✅ **Intégration Calendrier** : Synchronisation Google Calendar & iCloud
- ✅ **Mode Hors-ligne** : Fonctionnement offline avec synchronisation automatique
- ✅ **Notifications Push** : Rappels intelligents (temps + localisation)
- ✅ **Dark Mode** : Support du thème sombre
- ✅ **Cartes** : Vue cartographique des tâches avec localisation

### Backend (Node.js/Express)
- ✅ **API REST** : Architecture propre et scalable
- ✅ **MongoDB** : Base de données NoSQL performante
- ✅ **JWT Authentication** : Sécurisation avec tokens + refresh tokens
- ✅ **Rate Limiting** : Protection contre les abus
- ✅ **Validation** : Validation des données entrantes
- ✅ **Logging** : Winston pour les logs détaillés
- ✅ **Docker** : Containerisation pour déploiement facile

## 📁 Structure du Projet

```
Do-it-repo/
├── mobile/                 # Application React Native
│   ├── src/
│   │   ├── components/    # Composants UI réutilisables
│   │   ├── screens/       # Écrans de l'application
│   │   ├── navigation/    # Configuration React Navigation
│   │   ├── services/      # Services (API, Auth, Location, etc.)
│   │   ├── store/         # Zustand state management
│   │   ├── database/      # WatermelonDB schemas & models
│   │   ├── theme/         # Thème et design system
│   │   ├── types/         # Types TypeScript
│   │   └── utils/         # Utilitaires
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── backend/               # API Node.js/Express
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Modèles Mongoose
│   │   ├── routes/       # Routes Express
│   │   ├── middleware/   # Middlewares (auth, validation, etc.)
│   │   ├── services/     # Services métier
│   │   ├── config/       # Configuration (DB, Logger)
│   │   ├── types/        # Types TypeScript
│   │   └── utils/        # Utilitaires
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml     # Configuration Docker
└── README.md              # Ce fichier
```

## 🛠️ Installation & Configuration

### Prérequis

- **Node.js** : v18 ou supérieur
- **npm** ou **yarn**
- **MongoDB** : v7 ou supérieur
- **Expo CLI** : `npm install -g expo-cli`
- **Docker** (optionnel) : Pour déploiement containerisé

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-username/doit.git
cd doit
```

### 2. Installation Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
```

**Variables d'environnement importantes (.env) :**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/doit

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
```

**Démarrer le backend :**

```bash
# Mode développement
npm run dev

# Build pour production
npm run build
npm start
```

### 3. Installation Mobile

```bash
cd mobile
npm install

# Configurer les clés API dans app.json
```

**Configuration Firebase :**
1. Créer un projet Firebase
2. Télécharger `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
3. Placer les fichiers dans le dossier mobile/

**Configuration Google Maps :**
- Mettre à jour `YOUR_GOOGLE_MAPS_API_KEY_IOS` et `YOUR_GOOGLE_MAPS_API_KEY_ANDROID` dans `app.json`

**Démarrer l'application mobile :**

```bash
# Démarrer Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

## 🐳 Déploiement avec Docker

### Lancer avec Docker Compose

```bash
# Lancer l'ensemble de la stack (MongoDB + Backend)
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Build manuel du backend

```bash
cd backend
docker build -t doit-backend .
docker run -p 3000:3000 --env-file .env doit-backend
```

## 📱 Builds Production Mobile

### Android

```bash
cd mobile

# Build APK
eas build --platform android

# Build AAB (pour Play Store)
eas build --platform android --profile production
```

### iOS

```bash
cd mobile

# Build IPA
eas build --platform ios

# Build pour App Store
eas build --platform ios --profile production
```

## 🧪 Tests

### Backend

```bash
cd backend
npm test                # Tests unitaires
npm run test:watch      # Mode watch
```

### Mobile

```bash
cd mobile
npm test                # Tests unitaires
npm run test:e2e        # Tests E2E avec Detox
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/google` - Auth Google
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur

### Tasks

- `GET /api/tasks` - Liste des tâches
- `GET /api/tasks/:id` - Détails d'une tâche
- `POST /api/tasks` - Créer une tâche
- `PATCH /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
- `PATCH /api/tasks/:id/toggle` - Toggle completion
- `POST /api/tasks/sync` - Synchronisation offline

### Health Check

- `GET /api/health` - Status de l'API

## 🔑 Sécurité

- ✅ Hashing des mots de passe avec bcrypt
- ✅ JWT avec refresh tokens
- ✅ Rate limiting (100 req/15min)
- ✅ Validation des entrées avec express-validator
- ✅ Helmet.js pour headers de sécurité
- ✅ CORS configuré
- ✅ Protection CSRF

## 🚦 Variables d'Environnement Requises

### Backend (.env)

```
NODE_ENV=development|production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/doit
JWT_SECRET=votre-secret-jwt
JWT_REFRESH_SECRET=votre-secret-refresh
GOOGLE_CLIENT_ID=votre-google-client-id
CORS_ORIGIN=http://localhost:19006
```

### Mobile (app.json + .env)

- Google Maps API Keys (iOS + Android)
- Firebase configuration
- Google OAuth Web Client ID

## 📈 Monitoring & Logs

Les logs sont stockés dans `backend/logs/` :
- `error.log` : Erreurs uniquement
- `combined.log` : Tous les logs

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

MIT License

## 👥 Auteurs

- Votre Nom - Développement initial

## 🙏 Remerciements

- Design Figma original : https://www.figma.com/design/ZaOjKreNMn4PL2viHP3Zwj/Smart-To-Do-List-App-Design
- React Native & Expo
- MongoDB & Mongoose
- Express.js
- WatermelonDB pour la synchro offline

## 🐛 Problèmes Connus & Solutions

### MongoDB Connection Failed
```bash
# Vérifier que MongoDB est lancé
sudo systemctl start mongodb
# ou avec Docker
docker-compose up mongodb
```

### Expo Build Failed
```bash
# Nettoyer le cache
expo start -c
rm -rf node_modules
npm install
```

### Android Build Errors
- Vérifier que `google-services.json` est présent
- Vérifier les API Keys Google Maps

### iOS Build Errors
- Vérifier que `GoogleService-Info.plist` est présent
- Vérifier les permissions dans `Info.plist`

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Email : support@doit.app

---

**Built with ❤️ using React Native, Node.js, and MongoDB**
  