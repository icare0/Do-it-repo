# Do-it Backend API

Backend complet pour **Do-it**, une application mobile de productivité avec assistant personnel intelligent.

## 🚀 Fonctionnalités

### ✨ Fonctionnalités Clés

- **🧠 Parsing NLP (Langage Naturel)** - Création de tâches en langage naturel
  - Extraction automatique des dates, heures, récurrences
  - Détection de la priorité et de la catégorie
  - Support multilingue (français principalement)

- **📍 Geofencing & Rappels Géolocalisés**
  - Notifications basées sur la position en temps réel
  - Support des zones d'entrée/sortie
  - Calcul de proximité et distance

- **🔔 Notifications Push (Firebase FCM)**
  - Rappels basés sur le temps
  - Rappels basés sur la localisation
  - Notifications pour tâches récurrentes

- **🔄 Synchronisation Hors-ligne**
  - Gestion des conflits avec versioning
  - Soft delete des tâches
  - Sync bidirectionnel robuste

- **📊 Vues Contextuelles**
  - Vue "Aujourd'hui"
  - Vue "Cette semaine"
  - Statistiques et analytics utilisateur
  - Recherche avancée

- **⚡ Performance**
  - Cache Redis pour réponses rapides
  - File d'attente Bull pour jobs asynchrones
  - Workers dédiés pour background tasks

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/          # Configuration (DB, Redis, Queue, Logger)
│   ├── controllers/     # Logique des endpoints
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Schémas Mongoose
│   ├── routes/          # Définition des routes API
│   ├── services/        # Logique métier
│   │   ├── nlpService.ts          # Parsing langage naturel
│   │   ├── notificationService.ts # Push notifications
│   │   ├── geofenceService.ts     # Geofencing
│   │   ├── cacheService.ts        # Redis caching
│   │   └── calendarService.ts     # Google Calendar
│   ├── workers/         # Background job processors
│   ├── types/           # Types TypeScript
│   └── utils/           # Utilitaires
├── docker-compose.yml   # Environnement de développement
├── Dockerfile           # Multi-stage build
└── package.json
```

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** >= 7.0
- **Redis** >= 7.0
- **Docker & Docker Compose** (optionnel mais recommandé)

## 🔧 Installation

### Option 1 : Avec Docker (Recommandé)

```bash
# Cloner le repository
git clone <repo-url>
cd backend

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
nano .env

# Démarrer tous les services
npm run docker:up

# Voir les logs
npm run docker:logs

# L'API sera disponible sur http://localhost:3000
# MongoDB UI sur http://localhost:8081
# Redis UI sur http://localhost:8082
```

### Option 2 : Installation Locale

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer MongoDB et Redis localement
# Éditer .env avec les bonnes URLs

# Démarrer le serveur de développement
npm run dev

# Dans un autre terminal, démarrer les workers
npm run workers
```

## 🔑 Configuration

### Variables d'Environnement Essentielles

```env
# Serveur
NODE_ENV=development
PORT=3000

# Base de données
MONGODB_URI=mongodb://localhost:27017/doit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=<générer-avec-crypto>
JWT_REFRESH_SECRET=<générer-avec-crypto>

# Firebase (pour les notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

### Générer des Secrets JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Aller dans **Project Settings** > **Service Accounts**
3. Générer une nouvelle clé privée (JSON)
4. Sauvegarder le fichier dans `backend/config/firebase-service-account.json`

## 📡 API Endpoints

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Inscription avec email/mot de passe |
| POST | `/login` | Connexion |
| POST | `/google` | Authentification Google OAuth |
| POST | `/refresh` | Rafraîchir le token |
| POST | `/logout` | Déconnexion |
| GET | `/profile` | Profil utilisateur |

### Tâches (`/api/tasks`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des tâches (avec filtres) |
| GET | `/:id` | Détails d'une tâche |
| POST | `/` | Créer une tâche (avec NLP optionnel) |
| PATCH | `/:id` | Modifier une tâche |
| DELETE | `/:id` | Supprimer une tâche (soft delete) |
| PATCH | `/:id/toggle` | Basculer le statut complété |
| POST | `/sync` | Synchronisation batch |
| POST | `/parse` | Parser du texte en langage naturel |

**Exemple : Création avec NLP**

```json
POST /api/tasks
{
  "title": "Acheter du pain demain à 18h chez la boulangerie",
  "useNLP": true
}

// Réponse automatique :
{
  "task": {
    "title": "Acheter du pain",
    "startDate": "2025-01-19T18:00:00.000Z",
    "location": { "name": "boulangerie" },
    "priority": "medium",
    "category": "courses"
  }
}
```

### Geofencing (`/api/geofences`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des geofences |
| POST | `/` | Créer un geofence |
| PATCH | `/:id` | Modifier un geofence |
| DELETE | `/:id` | Supprimer un geofence |
| POST | `/location` | Mettre à jour la position |
| GET | `/nearby` | Geofences à proximité |
| POST | `/sync` | Synchroniser avec les tâches |

### Vues Contextuelles (`/api/views`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/today` | Vue "Aujourd'hui" |
| GET | `/week` | Vue "Cette semaine" |
| GET | `/category/:category` | Tâches par catégorie |
| GET | `/priority/:priority` | Tâches par priorité |
| GET | `/overdue` | Tâches en retard |
| GET | `/stats` | Statistiques utilisateur |
| GET | `/search` | Recherche de tâches |

### Calendrier (`/api/calendar`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/connect` | URL de connexion Google |
| POST | `/callback` | Callback OAuth |
| GET | `/events` | Liste des événements |
| POST | `/sync` | Synchroniser une tâche |

## 🧪 Tests

```bash
# Exécuter tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm test -- --coverage
```

## 🔍 Développement

### Structure des Services

```typescript
// Service NLP
import nlpService from './services/nlpService';

const parsed = nlpService.parseTask(
  "Appeler le dentiste mardi prochain à 14h",
  "Europe/Paris"
);

// Service de Cache
import cacheService from './services/cacheService';

await cacheService.set('key', value, 3600); // TTL: 1h
const cached = await cacheService.get('key');

// Service de Notifications
import notificationService from './services/notificationService';

await notificationService.sendTaskReminder(
  userId,
  taskId,
  "Titre de la tâche"
);
```

### Logging

```typescript
import logger from './config/logger';

logger.info('Message informatif');
logger.error('Erreur', error);
logger.debug('Debug détaillé');
```

## 🐳 Docker

### Commandes Utiles

```bash
# Démarrer l'environnement
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f api

# Rebuild après changements
docker-compose up -d --build

# Accéder au conteneur
docker exec -it doit-api sh
```

### Services Docker

- **API** : http://localhost:3000
- **MongoDB UI** : http://localhost:8081 (admin/admin)
- **Redis UI** : http://localhost:8082
- **MongoDB** : localhost:27017
- **Redis** : localhost:6379

## 📊 Monitoring

### Logs

Les logs sont stockés dans le dossier `logs/` :

- `error.log` - Erreurs uniquement
- `combined.log` - Tous les logs
- Rotation automatique (14 jours, 20MB max)

### Queues (Redis)

Les jobs sont gérés par Bull :

- `notifications` - Notifications push
- `geofences` - Vérifications de géolocalisation
- `recurring-tasks` - Tâches récurrentes
- `sync` - Synchronisation

### Health Check

```bash
curl http://localhost:3000/api/health
```

## 🚀 Déploiement en Production

### Prérequis Production

1. **Variables d'environnement**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   REDIS_HOST=redis-prod.example.com
   JWT_SECRET=<secret-fort>
   ```

2. **Build de production**
   ```bash
   npm run build
   npm start
   ```

3. **Workers séparés**
   ```bash
   npm run start:workers
   ```

### Recommandations

- Utiliser **PM2** pour gérer les processus
- Configurer **Nginx** comme reverse proxy
- Activer **SSL/TLS** (Let's Encrypt)
- Utiliser **MongoDB Atlas** pour la base de données
- Redis managé (Redis Cloud, AWS ElastiCache)
- Monitoring avec **Sentry** ou **New Relic**

## 🤝 Contribution

Le backend est conçu pour être extensible. Pour ajouter de nouvelles fonctionnalités :

1. Créer un service dans `src/services/`
2. Ajouter les modèles nécessaires dans `src/models/`
3. Créer un controller dans `src/controllers/`
4. Définir les routes dans `src/routes/`
5. Ajouter la validation dans les routes
6. Tester avec des tests unitaires

## 📝 Licence

Propriétaire - Tous droits réservés

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Version:** 1.0.0
**Dernière mise à jour:** Janvier 2025
