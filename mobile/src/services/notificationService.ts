import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATIONS_ENABLED_KEY = '@doit_notifications_enabled';

/**
 * Service de notifications LOCAL simplifié
 * Plus de Firebase, plus de complexité inutile
 * Juste des notifications locales qui FONCTIONNENT
 */

// Configuration du handler de notifications
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const settings = useNotificationStore.getState().settings;
    return {
      shouldShowAlert: settings.enabled,
      shouldPlaySound: settings.sound,
      shouldSetBadge: settings.badge,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

interface TaskNotification {
  taskId: string;
  title: string;
  body: string;
  scheduledTime: Date;
}

class NotificationService {
  private isInitialized = false;
  private hasPermissions = false;

  /**
   * Initialise le service de notifications
   * À appeler au démarrage de l'app
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 [NotificationService] ==========================================');
      console.log('🔔 [NotificationService] INITIALISATION DU SERVICE');
      console.log('🔔 [NotificationService] ==========================================');

      // Vérifier si on est sur un vrai device
      if (!Device.isDevice) {
        console.log('🔔 [NotificationService] ⚠️ Simulateur détecté - les notifications ne fonctionneront pas');
        this.isInitialized = true;
        return false;
      }

      // Demander les permissions
      const hasPerms = await this.requestPermissions();
      this.hasPermissions = hasPerms;

      if (!hasPerms) {
        console.log('🔔 [NotificationService] ❌ Permissions refusées');
        this.isInitialized = true;
        return false;
      }

      // Setup les listeners
      this.setupListeners();

      this.isInitialized = true;
      console.log('🔔 [NotificationService] ✅ Service initialisé avec succès');
      console.log('🔔 [NotificationService] ==========================================');

      return true;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur initialisation:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Demande les permissions de notifications
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔔 [NotificationService] 📱 Demande de permissions...');

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 [NotificationService] Status actuel:', existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔔 [NotificationService] 🙏 Demande de permissions à l\'utilisateur...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔔 [NotificationService] Nouveau status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('🔔 [NotificationService] ❌ Permissions refusées');
        return false;
      }

      // Configuration Android
      if (Platform.OS === 'android') {
        console.log('🔔 [NotificationService] 🤖 Configuration canal Android...');
        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Rappels de tâches',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          sound: 'default',
          enableVibrate: true,
        });
        console.log('🔔 [NotificationService] ✅ Canal Android configuré');
      }

      console.log('🔔 [NotificationService] ✅ Permissions accordées');
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur permissions:', error);
      return false;
    }
  }

  /**
   * Setup des listeners pour les notifications
   */
  private setupListeners() {
    console.log('🔔 [NotificationService] 👂 Setup des listeners...');

    // Quand une notification est reçue (app en foreground)
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 [NotificationService] 📬 Notification reçue:', notification.request.content.title);

      const content = notification.request.content;
      useNotificationStore.getState().addNotification({
        id: notification.request.identifier,
        type: (content.data?.type as any) || 'system',
        title: content.title || 'Notification',
        body: content.body || '',
        data: content.data,
        taskId: content.data?.taskId,
      });
    });

    // Quand l'utilisateur tape sur une notification
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 [NotificationService] 👆 Notification tapée:', response.notification.request.content.title);

      // S'assurer que la notification est dans l'historique (au cas où reçue en background)
      const notification = response.notification;
      const content = notification.request.content;

      useNotificationStore.getState().addNotification({
        id: notification.request.identifier,
        type: (content.data?.type as any) || 'system',
        title: content.title || 'Notification',
        body: content.body || '',
        data: content.data,
        taskId: content.data?.taskId,
      });

      const taskId = content.data?.taskId;
      if (taskId) {
        console.log('🔔 [NotificationService] 🎯 Task ID:', taskId);
        // La navigation sera gérée par le RootNavigator ou via un event global
        // Pour l'instant on stocke juste l'info
      }
    });

    console.log('🔔 [NotificationService] ✅ Listeners configurés');
  }

  /**
   * Planifie une notification pour une tâche
   */
  async scheduleTaskNotification(task: {
    id: string;
    title: string;
    startDate: Date;
    minutesBefore?: number;
  }): Promise<string | null> {
    try {
      const settings = useNotificationStore.getState().settings;

      if (!this.hasPermissions) {
        console.log('🔔 [NotificationService] ⚠️ Pas de permissions - notification ignorée');
        return null;
      }

      if (!settings.enabled) {
        console.log('🔔 [NotificationService] 🔕 Notifications globalement désactivées');
        return null;
      }

      if (!settings.taskReminders) {
        console.log('🔔 [NotificationService] 🔕 Rappels de tâches désactivés dans les paramètres');
        return null;
      }

      const now = new Date();
      const taskDate = new Date(task.startDate);
      const minutesBefore = task.minutesBefore || settings.reminderMinutes || 15;

      // Calculer le moment de la notification
      const notificationTime = new Date(taskDate.getTime() - minutesBefore * 60000);

      // Si c'est dans le passé, ne pas planifier
      if (notificationTime <= now) {
        console.log('🔔 [NotificationService] ⏰ Heure passée - notification ignorée');
        return null;
      }

      console.log('🔔 [NotificationService] ');
      console.log('🔔 [NotificationService] 📅 Planification notification');
      console.log('🔔 [NotificationService] Tâche:', task.title);
      console.log('🔔 [NotificationService] Date tâche:', taskDate.toLocaleString('fr-FR'));
      console.log('🔔 [NotificationService] Notification prévue:', notificationTime.toLocaleString('fr-FR'));
      console.log('🔔 [NotificationService] Dans:', Math.round((notificationTime.getTime() - now.getTime()) / 60000), 'minutes');

      // Planifier la notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Rappel de tâche',
          body: task.title,
          data: {
            taskId: task.id,
            type: 'task_reminder'
          },
          sound: settings.sound,
          vibrate: settings.vibration ? [0, 250, 250, 250] : [],
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: notificationTime,
          channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
        },
      });

      console.log('🔔 [NotificationService] ✅ Notification planifiée - ID:', notificationId);

      // Sauvegarder la correspondance task -> notification
      await this.saveNotificationMapping(task.id, notificationId);

      return notificationId;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur planification:', error);
      return null;
    }
  }

  /**
   * Annule la notification d'une tâche
   */
  async cancelTaskNotification(taskId: string): Promise<void> {
    try {
      const notificationId = await this.getNotificationId(taskId);
      if (notificationId) {
        console.log('🔔 [NotificationService] 🚫 Annulation notification pour tâche:', taskId);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await this.removeNotificationMapping(taskId);
        console.log('🔔 [NotificationService] ✅ Notification annulée');
      }
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur annulation:', error);
    }
  }

  /**
   * Met à jour la notification d'une tâche (annule + replanifie)
   */
  async updateTaskNotification(task: {
    id: string;
    title: string;
    startDate: Date;
    minutesBefore?: number;
  }): Promise<void> {
    console.log('🔔 [NotificationService] 🔄 Mise à jour notification pour:', task.title);
    await this.cancelTaskNotification(task.id);
    await this.scheduleTaskNotification(task);
  }

  /**
   * Envoie une notification immédiate (pour tests)
   */
  async sendImmediateNotification(title: string, body: string): Promise<void> {
    try {
      if (!this.hasPermissions) {
        console.log('🔔 [NotificationService] ⚠️ Pas de permissions');
        return;
      }

      console.log('🔔 [NotificationService] 📤 Envoi notification immédiate');

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'immediate' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Immédiat
      });

      console.log('🔔 [NotificationService] ✅ Notification envoyée');
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur envoi:', error);
    }
  }

  /**
   * Liste toutes les notifications planifiées (pour debug)
   */
  async listScheduledNotifications(): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('🔔 [NotificationService] ');
      console.log('🔔 [NotificationService] 📋 NOTIFICATIONS PLANIFIÉES:', notifications.length);
      notifications.forEach((notif, index) => {
        console.log(`🔔 [NotificationService] ${index + 1}. ${notif.content.title}`);
        console.log(`🔔 [NotificationService]    ID: ${notif.identifier}`);
        if (notif.trigger && 'date' in notif.trigger) {
          console.log(`🔔 [NotificationService]    Prévue: ${new Date(notif.trigger.date).toLocaleString('fr-FR')}`);
        }
      });
      console.log('🔔 [NotificationService] ');
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur liste:', error);
    }
  }

  /**
   * Annule toutes les notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      console.log('🔔 [NotificationService] 🧹 Annulation de toutes les notifications...');
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('@doit_notification_mappings');
      console.log('🔔 [NotificationService] ✅ Toutes les notifications annulées');
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Erreur annulation totale:', error);
    }
  }

  // === HELPERS PRIVÉS ===

  private async saveNotificationMapping(taskId: string, notificationId: string): Promise<void> {
    try {
      const mappingsJson = await AsyncStorage.getItem('@doit_notification_mappings');
      const mappings = mappingsJson ? JSON.parse(mappingsJson) : {};
      mappings[taskId] = notificationId;
      await AsyncStorage.setItem('@doit_notification_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('🔔 [NotificationService] Erreur save mapping:', error);
    }
  }

  private async getNotificationId(taskId: string): Promise<string | null> {
    try {
      const mappingsJson = await AsyncStorage.getItem('@doit_notification_mappings');
      if (!mappingsJson) return null;
      const mappings = JSON.parse(mappingsJson);
      return mappings[taskId] || null;
    } catch (error) {
      console.error('🔔 [NotificationService] Erreur get mapping:', error);
      return null;
    }
  }

  private async removeNotificationMapping(taskId: string): Promise<void> {
    try {
      const mappingsJson = await AsyncStorage.getItem('@doit_notification_mappings');
      if (!mappingsJson) return;
      const mappings = JSON.parse(mappingsJson);
      delete mappings[taskId];
      await AsyncStorage.setItem('@doit_notification_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('🔔 [NotificationService] Erreur remove mapping:', error);
    }
  }
}

export const notificationService = new NotificationService();
