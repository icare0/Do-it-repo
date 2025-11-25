# 🔔 Guide des Notifications Riches pour Do-it

Ce document explique comment implémenter et utiliser les notifications riches dans l'application mobile Do-it.

## 📱 Fonctionnalités des Notifications Riches

Le backend envoie des notifications avec les fonctionnalités suivantes :

### 🎨 Design Personnalisé

- **Couleurs** : Chaque type de notification a sa propre couleur
  - 🔴 Rappels : `#FF6B6B` (Rouge)
  - 🔵 Geofencing : `#4ECDC4` (Turquoise)
  - 🟢 Récurrent : `#95E1D3` (Vert clair)
  - 🟡 Achievements : `#FFD700` (Or)
  - 🟣 Level Up : `#9B59B6` (Violet)
  - 🟠 Streaks : `#FF7F50` (Orange coral)

- **Sons personnalisés** selon le type de notification
- **Vibrations** pattern personnalisé
- **Icônes** différentes par type

### 🖼️ Rich Media

Les notifications peuvent inclure :

- **Images** : Passez `imageUrl` dans le data
- **Sous-titres** (iOS) : Passez `subtitle` dans le data
- **Badges** : Compteur de notifications

### ⚡ Actions Rapides

Les notifications supportent des actions directes sans ouvrir l'app.

## 🚀 Implémentation Mobile

### 1. Configuration Firebase

#### Android (Flutter)

```yaml
# android/app/src/main/AndroidManifest.xml
<application>
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="doit_reminders" />

  <!-- Icône de notification -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />

  <!-- Couleur par défaut -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
</application>
```

#### iOS (Flutter)

```swift
// ios/Runner/AppDelegate.swift
import UserNotifications

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    // Demander les permissions
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self

      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: {_, _ in })
    }

    application.registerForRemoteNotifications()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### 2. Créer les Canaux de Notifications (Android)

```dart
// lib/services/notification_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Canal pour les rappels
    const reminderChannel = AndroidNotificationChannel(
      'doit_reminders',
      'Rappels',
      description: 'Notifications de rappels de tâches',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      vibrationPattern: Int64List.fromList([0, 250, 250, 250]),
      ledColor: Color(0xFFFF6B6B), // Rouge
    );

    // Canal pour les achievements
    const achievementChannel = AndroidNotificationChannel(
      'doit_achievements',
      'Achievements',
      description: 'Déblocage d\'achievements et level up',
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('achievement_sound'),
      ledColor: Color(0xFFFFD700), // Or
    );

    // Canal pour le geofencing
    const geofenceChannel = AndroidNotificationChannel(
      'doit_geofence',
      'Rappels Géolocalisés',
      description: 'Notifications basées sur votre position',
      importance: Importance.high,
      playSound: true,
      ledColor: Color(0xFF4ECDC4), // Turquoise
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(reminderChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(achievementChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(geofenceChannel);
  }
}
```

### 3. Gérer les Notifications avec Rich Content

```dart
// lib/services/firebase_messaging_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Demander les permissions
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // Obtenir le token FCM
    final token = await _messaging.getToken();
    print('FCM Token: $token');

    // Envoyer le token au backend
    await _sendTokenToBackend(token);

    // Écouter les nouvelles notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('Message reçu en foreground: ${message.messageId}');

    final notification = message.notification;
    final data = message.data;

    if (notification == null) return;

    // Déterminer le style de notification basé sur le type
    final type = data['type'] ?? 'general';

    AndroidNotificationDetails androidDetails;

    switch (type) {
      case 'achievement':
      case 'level_up':
        androidDetails = AndroidNotificationDetails(
          'doit_achievements',
          'Achievements',
          channelDescription: 'Déblocage d\'achievements',
          importance: Importance.max,
          priority: Priority.max,
          color: Color(0xFFFFD700), // Or
          playSound: true,
          sound: RawResourceAndroidNotificationSound('achievement_sound'),
          styleInformation: BigPictureStyleInformation(
            FilePathAndroidBitmap(data['imageUrl'] ?? ''),
            contentTitle: notification.title,
            summaryText: notification.body,
            largeIcon: DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
          ),
        );
        break;

      case 'streak':
        androidDetails = AndroidNotificationDetails(
          'doit_reminders',
          'Rappels',
          importance: Importance.high,
          color: Color(0xFFFF7F50), // Orange
          playSound: true,
          styleInformation: BigTextStyleInformation(
            notification.body ?? '',
            htmlFormatBigText: true,
            contentTitle: notification.title,
            htmlFormatContentTitle: true,
            summaryText: '🔥 Série en cours !',
            htmlFormatSummaryText: true,
          ),
        );
        break;

      case 'geofence':
        androidDetails = AndroidNotificationDetails(
          'doit_geofence',
          'Rappels Géolocalisés',
          importance: Importance.high,
          color: Color(0xFF4ECDC4), // Turquoise
          playSound: true,
          icon: 'ic_location',
        );
        break;

      default:
        androidDetails = AndroidNotificationDetails(
          'doit_reminders',
          'Rappels',
          importance: Importance.high,
        );
    }

    final iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      subtitle: data['subtitle'],
      threadIdentifier: type,
      interruptionLevel: _getInterruptionLevel(type),
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      ),
      payload: jsonEncode(data),
    );
  }

  InterruptionLevel _getInterruptionLevel(String type) {
    switch (type) {
      case 'reminder':
        return InterruptionLevel.timeSensitive;
      case 'achievement':
      case 'level_up':
      case 'streak':
        return InterruptionLevel.active;
      default:
        return InterruptionLevel.passive;
    }
  }
}
```

### 4. Actions Rapides sur les Notifications (iOS)

```swift
// ios/Runner/AppDelegate.swift
import UserNotifications

// Définir les catégories de notifications
func setupNotificationCategories() {
  // Actions pour les rappels de tâches
  let completeAction = UNNotificationAction(
    identifier: "COMPLETE_TASK",
    title: "✓ Marquer comme fait",
    options: [.foreground]
  )

  let snoozeAction = UNNotificationAction(
    identifier: "SNOOZE_TASK",
    title: "⏰ Rappeler plus tard",
    options: []
  )

  let taskCategory = UNNotificationCategory(
    identifier: "TASK_REMINDER",
    actions: [completeAction, snoozeAction],
    intentIdentifiers: [],
    options: []
  )

  // Actions pour les achievements
  let viewAchievementAction = UNNotificationAction(
    identifier: "VIEW_ACHIEVEMENT",
    title: "🏆 Voir",
    options: [.foreground]
  )

  let shareAchievementAction = UNNotificationAction(
    identifier: "SHARE_ACHIEVEMENT",
    title: "📤 Partager",
    options: []
  )

  let achievementCategory = UNNotificationCategory(
    identifier: "ACHIEVEMENT",
    actions: [viewAchievementAction, shareAchievementAction],
    intentIdentifiers: [],
    options: []
  )

  UNUserNotificationCenter.current().setNotificationCategories([
    taskCategory,
    achievementCategory
  ])
}
```

### 5. Personnaliser les Sons

**Android** : Placez vos fichiers `.mp3` dans `android/app/src/main/res/raw/`

```
android/app/src/main/res/raw/
  ├── achievement_sound.mp3
  ├── level_up_sound.mp3
  ├── streak_sound.mp3
  ├── reminder_sound.mp3
  └── location_sound.mp3
```

**iOS** : Placez les fichiers `.caf` ou `.aiff` dans le bundle de l'app

## 📊 Exemples de Notifications du Backend

### Achievement Débloqué

```json
{
  "title": "🏆 Nouveau Achievement !",
  "body": "🌟 Débutant : 10 tâches complétées",
  "type": "achievement",
  "data": {
    "achievementType": "tasks_10",
    "tier": "bronze",
    "points": "30",
    "imageUrl": "https://example.com/achievement-badge.png",
    "subtitle": "+30 points"
  }
}
```

### Level Up

```json
{
  "title": "🎉 Level Up !",
  "body": "Félicitations ! Vous êtes maintenant niveau 5 !",
  "type": "level_up",
  "data": {
    "level": "5",
    "points": "250",
    "subtitle": "Niveau 5 atteint"
  }
}
```

### Streak

```json
{
  "title": "🔥 Série Active !",
  "body": "7 jours consécutifs ! Continuez comme ça !",
  "type": "streak",
  "data": {
    "currentStreak": "7",
    "subtitle": "Ne cassez pas la série !"
  }
}
```

### Geofencing

```json
{
  "title": "📍 Boulangerie",
  "body": "Vous avez entré dans la zone. Acheter du pain",
  "type": "geofence",
  "data": {
    "taskId": "abc123",
    "locationName": "Boulangerie",
    "action": "enter"
  }
}
```

## 🎨 Best Practices

1. **Grouper les notifications** par type (thread-id sur iOS)
2. **Limiter le nombre** de notifications pour ne pas spammer
3. **Utiliser des couleurs cohérentes** avec votre design system
4. **Tester sur différents devices** (Android/iOS)
5. **Gérer les permissions** gracieusement
6. **Permettre de désactiver** certains types de notifications

## 🔧 Configuration Backend

Pour envoyer une notification avec image :

```typescript
await notificationService.sendNotification({
  userId: 'user123',
  title: '🏆 Achievement débloqué',
  body: 'Vous avez complété 100 tâches !',
  type: 'achievement',
  data: {
    imageUrl: 'https://example.com/achievement.png',
    subtitle: '+250 points',
    achievementType: 'tasks_100',
  },
});
```

## 📱 Permissions Nécessaires

### Android

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

### iOS

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

---

Avec cette configuration, vos notifications seront **magnifiques, riches et interactives** ! 🎉
