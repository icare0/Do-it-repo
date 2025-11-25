# Exemples d'Utilisation de l'API Do-it

Ce document contient des exemples pratiques d'utilisation de l'API.

## 🔐 Authentification

### Inscription

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Jean Dupont"
}

# Réponse
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k",
    "email": "user@example.com",
    "name": "Jean Dupont",
    "timezone": "Europe/Paris"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

## 📝 Création de Tâches

### Tâche Simple

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Acheter du lait",
  "priority": "medium"
}
```

### Tâche avec NLP (Langage Naturel)

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Appeler le dentiste demain à 14h",
  "useNLP": true
}

# Le backend parse automatiquement et extrait :
# - Date: demain
# - Heure: 14h
# - Action: Appeler le dentiste
```

**Autres exemples NLP :**

```json
// Tâche récurrente
{
  "title": "Sortir les poubelles tous les mardis à 20h",
  "useNLP": true
}

// Tâche avec lieu
{
  "title": "Acheter du pain à la boulangerie demain matin",
  "useNLP": true
}

// Tâche urgente
{
  "title": "Finir le rapport urgent pour vendredi",
  "useNLP": true
}

// Tâche avec catégorie détectée
{
  "title": "Aller au gym lundi prochain",
  "useNLP": true
}
// → catégorie: "santé" détectée automatiquement
```

### Tâche avec Localisation et Geofencing

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Acheter des médicaments",
  "location": {
    "name": "Pharmacie",
    "address": "123 Rue de la Santé, Paris",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "radius": 100
  },
  "reminder": {
    "type": "location"
  }
}

# Un geofence sera automatiquement créé
# Notification quand vous entrez dans un rayon de 100m
```

### Tâche Récurrente

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Réunion d'équipe",
  "startDate": "2025-01-20T10:00:00.000Z",
  "duration": 60,
  "recurringPattern": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "endDate": "2025-12-31T23:59:59.999Z"
  }
}

# Se répète tous les lundis, mercredis et vendredis jusqu'au 31/12/2025
```

### Tâche avec Sous-tâches

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Préparer voyage à Londres",
  "startDate": "2025-02-01T00:00:00.000Z",
  "subtasks": [
    { "title": "Réserver hôtel", "completed": false, "order": 1 },
    { "title": "Acheter billets train", "completed": false, "order": 2 },
    { "title": "Faire valise", "completed": false, "order": 3 }
  ]
}
```

## 🔍 Recherche et Filtres

### Recherche de Tâches

```bash
GET /api/views/search?q=dentiste&completed=false
Authorization: Bearer <token>

# Cherche "dentiste" dans titre, description, notes et tags
```

### Vue "Aujourd'hui"

```bash
GET /api/views/today
Authorization: Bearer <token>

# Réponse
{
  "date": "2025-01-18",
  "tasks": [...],
  "stats": {
    "total": 10,
    "completed": 3,
    "remaining": 7,
    "highPriority": 2,
    "overdue": 1
  }
}
```

### Tâches par Priorité

```bash
GET /api/views/priority/high
Authorization: Bearer <token>

# Retourne toutes les tâches haute priorité non complétées
```

### Tâches en Retard

```bash
GET /api/views/overdue
Authorization: Bearer <token>

# Toutes les tâches non complétées avec date passée
```

## 📊 Statistiques

```bash
GET /api/views/stats
Authorization: Bearer <token>

# Réponse
{
  "stats": {
    "totalTasks": 150,
    "completedTasks": 98,
    "activeTasks": 52,
    "overdueTasks": 5,
    "completionRate": 65,
    "completedThisWeek": 23,
    "tasksByCategory": [
      { "_id": "travail", "count": 45, "completed": 30 },
      { "_id": "personnel", "count": 35, "completed": 25 }
    ],
    "tasksByPriority": [
      { "_id": "high", "count": 8 },
      { "_id": "medium", "count": 35 },
      { "_id": "low", "count": 9 }
    ]
  }
}
```

## 📍 Geofencing

### Créer un Geofence

```bash
POST /api/geofences
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "65a1b2c3d4e5f6g7h8i9j0k",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius": 150,
  "notifyOnEnter": true,
  "notifyOnExit": false
}
```

### Mettre à Jour la Position

```bash
POST /api/geofences/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 48.8570,
  "longitude": 2.3525,
  "accuracy": 10
}

# Le backend vérifie automatiquement tous les geofences actifs
# et envoie des notifications si vous entrez/sortez d'une zone
```

### Geofences à Proximité

```bash
GET /api/geofences/nearby?latitude=48.8566&longitude=2.3522&maxDistance=5000
Authorization: Bearer <token>

# Trouve tous les geofences dans un rayon de 5km
```

## 🔄 Synchronisation Hors-ligne

### Sync Batch

```bash
POST /api/tasks/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "tasks": [
    {
      "id": "local-id-1",
      "operation": "create",
      "data": {
        "title": "Nouvelle tâche créée offline",
        "completed": false
      }
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k",
      "operation": "update",
      "data": {
        "completed": true
      }
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0l",
      "operation": "delete"
    }
  ]
}

# Réponse
{
  "tasks": [...],  // Tâches synchronisées
  "processed": 3,
  "successful": 3,
  "errors": [],
  "failed": 0
}
```

## 🧠 Parsing NLP Standalone

### Parser du Texte sans Créer de Tâche

```bash
POST /api/tasks/parse
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Réunion avec le client important mardi prochain à 15h30"
}

# Réponse
{
  "parsed": {
    "title": "Réunion avec le client",
    "startDate": "2025-01-21T15:30:00.000Z",
    "priority": "high",
    "category": "travail"
  }
}

# Vous pouvez ensuite utiliser ces données pour créer la tâche
```

## 📅 Intégration Google Calendar

### Connecter Google Calendar

```bash
GET /api/calendar/connect
Authorization: Bearer <token>

# Réponse
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}

# Rediriger l'utilisateur vers cette URL
```

### Synchroniser une Tâche vers Google Calendar

```bash
POST /api/calendar/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "65a1b2c3d4e5f6g7h8i9j0k",
  "title": "Réunion d'équipe",
  "description": "Discussion sur le projet",
  "startDate": "2025-01-20T10:00:00.000Z",
  "endDate": "2025-01-20T11:00:00.000Z"
}
```

## 🔔 Tester les Notifications (Dev)

Pour tester les notifications, vous devez d'abord enregistrer un token FCM :

```bash
# 1. Mettre à jour le token FCM de l'utilisateur
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fcmToken": "token-fcm-depuis-app-mobile"
}

# 2. Créer une tâche avec rappel
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test notification",
  "startDate": "2025-01-18T15:00:00.000Z",
  "reminder": {
    "type": "time",
    "time": "2025-01-18T14:55:00.000Z"
  }
}

# La notification sera envoyée 5 minutes avant l'heure de début
```

## 📱 Workflow Typique d'une App Mobile

### 1. Lancement de l'App

```bash
# Vérifier le token
GET /api/auth/profile
Authorization: Bearer <token>

# Récupérer les tâches du jour
GET /api/views/today
Authorization: Bearer <token>

# Récupérer les geofences actifs
GET /api/geofences
Authorization: Bearer <token>
```

### 2. Création Rapide (Quick Add)

```bash
# Utiliser NLP pour une saisie ultra rapide
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Acheter du pain ce soir",
  "useNLP": true
}
```

### 3. Synchronisation Périodique

```bash
# Toutes les X minutes (ou au retour du réseau)
POST /api/tasks/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "tasks": [ /* changements locaux */ ]
}
```

### 4. Mise à Jour de Position (Background)

```bash
# Toutes les 5-10 minutes en background
POST /api/geofences/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 48.8570,
  "longitude": 2.3525,
  "accuracy": 15
}
```

## 🐛 Gestion des Erreurs

Toutes les erreurs suivent le format :

```json
{
  "message": "Description de l'erreur",
  "error": "Détails techniques (en dev uniquement)"
}
```

### Codes HTTP Courants

- `200` - Succès
- `201` - Création réussie
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Interdit
- `404` - Ressource non trouvée
- `429` - Trop de requêtes (rate limit)
- `500` - Erreur serveur

### Refresh Token Expiré

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Si le refresh token est aussi expiré (401)
# → Redemander à l'utilisateur de se connecter
```

---

**Note :** Tous ces exemples nécessitent un serveur en cours d'exécution (`npm run dev` ou `npm run docker:up`)
