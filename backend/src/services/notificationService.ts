import admin from 'firebase-admin';
import { notificationQueue } from '../config/queue';
import logger from '../config/logger';
import User from '../models/User';

/**
 * Service de notifications push avec Firebase Cloud Messaging
 * Gère l'envoi de notifications pour :
 * - Rappels basés sur le temps
 * - Rappels basés sur la localisation (geofencing)
 * - Tâches récurrentes
 */

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: { [key: string]: string };
  taskId?: string;
  type: 'reminder' | 'geofence' | 'recurring' | 'general';
}

class NotificationService {
  private initialized = false;

  /**
   * Initialise Firebase Admin SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Vérifier si Firebase est déjà initialisé
      if (admin.apps.length === 0) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          logger.info('✅ Firebase Admin SDK initialized with service account');
        } else {
          // Initialiser avec les credentials par défaut (pour environnement de production)
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          logger.info('✅ Firebase Admin SDK initialized with default credentials');
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification push à un utilisateur
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      await this.initialize();

      // Récupérer le token FCM de l'utilisateur
      const user = await User.findById(payload.userId);
      if (!user || !user.fcmToken) {
        logger.warn(`⚠️  User ${payload.userId} has no FCM token`);
        return false;
      }

      // Construire le message avec rich content
      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          // Image pour les notifications riches (optionnel)
          ...(payload.data?.imageUrl && { imageUrl: payload.data.imageUrl }),
        },
        data: {
          type: payload.type,
          taskId: payload.taskId || '',
          ...payload.data,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'doit_reminders',
            // Style de notification riche
            color: this.getNotificationColor(payload.type),
            // Icône personnalisée basée sur le type
            icon: 'ic_notification',
            // Son personnalisé
            sound: this.getNotificationSound(payload.type),
            // Vibration pattern
            vibrateTimingsMillis: [0, 250, 250, 250],
            // Badge
            notificationCount: 1,
            // Priorité visuelle
            visibility: 'public',
            // Actions rapides
            ...(payload.data?.actions && {
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            }),
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
                // Sous-titre pour iOS
                ...(payload.data?.subtitle && { subtitle: payload.data.subtitle }),
              },
              sound: this.getNotificationSound(payload.type),
              badge: 1,
              // Category pour les actions personnalisées iOS
              category: this.getNotificationCategory(payload.type),
              // Thread ID pour grouper les notifications
              'thread-id': payload.type,
              // Interruption level (iOS 15+)
              'interruption-level': this.getInterruptionLevel(payload.type),
            },
          },
        },
        // Configuration web push (optionnel)
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            ...(payload.data?.imageUrl && { image: payload.data.imageUrl }),
            vibrate: [200, 100, 200],
            requireInteraction: payload.type === 'reminder',
          },
          fcmOptions: {
            link: payload.data?.link || '/',
          },
        },
      };

      // Envoyer la notification
      const response = await admin.messaging().send(message);
      logger.info(`📬 Notification sent successfully to user ${payload.userId}: ${response}`);

      return true;
    } catch (error: any) {
      // Gérer les erreurs de token invalide
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        logger.warn(`⚠️  Invalid FCM token for user ${payload.userId}, clearing token`);
        await User.findByIdAndUpdate(payload.userId, { $unset: { fcmToken: 1 } });
      } else {
        logger.error('❌ Failed to send notification:', error);
      }

      return false;
    }
  }

  /**
   * Envoie une notification à plusieurs utilisateurs
   */
  async sendMulticastNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      await this.initialize();

      // Récupérer les tokens FCM des utilisateurs
      const users = await User.find({ _id: { $in: userIds }, fcmToken: { $exists: true } });
      const tokens = users.map((u) => u.fcmToken!).filter(Boolean);

      if (tokens.length === 0) {
        logger.warn('⚠️  No valid FCM tokens found for multicast notification');
        return { successCount: 0, failureCount: userIds.length };
      }

      // Construire le message multicast
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'doit_reminders',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Envoyer les notifications
      const response = await admin.messaging().sendMulticast(message);
      logger.info(
        `📬 Multicast notification sent: ${response.successCount} successful, ${response.failureCount} failed`
      );

      // Nettoyer les tokens invalides
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (
              error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await User.updateMany(
            { fcmToken: { $in: failedTokens } },
            { $unset: { fcmToken: 1 } }
          );
          logger.info(`🗑️  Cleared ${failedTokens.length} invalid FCM tokens`);
        }
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error('❌ Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: userIds.length };
    }
  }

  /**
   * Programme une notification pour plus tard
   */
  async scheduleNotification(
    payload: NotificationPayload,
    delay: number
  ): Promise<void> {
    await notificationQueue.add(payload, { delay });
    logger.info(`⏰ Notification scheduled for user ${payload.userId} in ${delay}ms`);
  }

  /**
   * Annule une notification programmée
   */
  async cancelScheduledNotification(jobId: string): Promise<boolean> {
    try {
      const job = await notificationQueue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`🗑️  Cancelled scheduled notification: ${jobId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('❌ Failed to cancel scheduled notification:', error);
      return false;
    }
  }

  /**
   * Envoie une notification de rappel pour une tâche
   */
  async sendTaskReminder(
    userId: string,
    taskId: string,
    taskTitle: string,
    taskDescription?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      taskId,
      title: '⏰ Rappel',
      body: taskTitle,
      type: 'reminder',
      data: {
        description: taskDescription || '',
      },
    });
  }

  /**
   * Envoie une notification de geofence
   */
  async sendGeofenceNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    locationName: string,
    isEntering: boolean
  ): Promise<boolean> {
    const action = isEntering ? 'entré dans' : 'quitté';
    return this.sendNotification({
      userId,
      taskId,
      title: `📍 ${locationName}`,
      body: `Vous avez ${action} la zone. ${taskTitle}`,
      type: 'geofence',
      data: {
        locationName,
        action: isEntering ? 'enter' : 'exit',
      },
    });
  }

  /**
   * Envoie une notification pour une tâche récurrente
   */
  async sendRecurringTaskNotification(
    userId: string,
    taskId: string,
    taskTitle: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      taskId,
      title: '🔄 Tâche récurrente',
      body: taskTitle,
      type: 'recurring',
    });
  }

  /**
   * Récupère la couleur de notification selon le type
   */
  private getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      reminder: '#FF6B6B',       // Rouge pour les rappels
      geofence: '#4ECDC4',       // Turquoise pour le geofencing
      recurring: '#95E1D3',      // Vert clair pour récurrent
      general: '#F38181',        // Rose pour général
      achievement: '#FFD700',    // Or pour les achievements
      level_up: '#9B59B6',       // Violet pour level up
      streak: '#FF7F50',         // Orange coral pour les streaks
    };

    return colors[type] || '#667EEA'; // Bleu par défaut
  }

  /**
   * Récupère le son de notification selon le type
   */
  private getNotificationSound(type: string): string {
    const sounds: { [key: string]: string } = {
      reminder: 'reminder_sound.mp3',
      geofence: 'location_sound.mp3',
      recurring: 'recurring_sound.mp3',
      achievement: 'achievement_sound.mp3',
      level_up: 'level_up_sound.mp3',
      streak: 'streak_sound.mp3',
    };

    return sounds[type] || 'default';
  }

  /**
   * Récupère la catégorie iOS de notification
   */
  private getNotificationCategory(type: string): string {
    const categories: { [key: string]: string } = {
      reminder: 'TASK_REMINDER',
      geofence: 'LOCATION_ALERT',
      recurring: 'RECURRING_TASK',
      achievement: 'ACHIEVEMENT',
      level_up: 'LEVEL_UP',
    };

    return categories[type] || 'GENERAL';
  }

  /**
   * Récupère le niveau d'interruption iOS
   */
  private getInterruptionLevel(type: string): string {
    // Niveaux: passive, active, time-sensitive, critical
    const levels: { [key: string]: string } = {
      reminder: 'time-sensitive',
      geofence: 'active',
      achievement: 'active',
      level_up: 'active',
      recurring: 'active',
    };

    return levels[type] || 'active';
  }
}

export default new NotificationService();
