import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = 'fcm_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async initialize() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return null;
      }

      // Get FCM token
      const token = await this.getFCMToken();

      // Setup notification listeners
      this.setupListeners();

      return token;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return null;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (cachedToken) return cachedToken;

      // Request authorization (iOS)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

      return token;
    } catch (error) {
      console.error('Get FCM token error:', error);
      return null;
    }
  }

  private setupListeners() {
    // Foreground notification handler
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Notification response handler (when user taps notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      // Handle navigation based on notification data
    });

    // FCM foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received:', remoteMessage);

      // Show local notification
      if (remoteMessage.notification) {
        await this.scheduleLocalNotification({
          title: remoteMessage.notification.title || '',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data,
        });
      }
    });

    // Token refresh handler
    messaging().onTokenRefresh(async (token) => {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      // Send updated token to backend
    });
  }

  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    data?: any;
    trigger?: Date | { seconds: number };
  }) {
    try {
      let trigger = null;
      if (options.trigger) {
        if (options.trigger instanceof Date) {
          trigger = options.trigger;
        } else {
          trigger = { seconds: options.trigger.seconds };
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: true,
        },
        trigger,
      });
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  }

  async scheduleTaskReminder(task: {
    id: string;
    title: string;
    date: Date;
    minutesBefore?: number;
  }) {
    const reminderTime = new Date(task.date);
    reminderTime.setMinutes(reminderTime.getMinutes() - (task.minutesBefore || 15));

    await this.scheduleLocalNotification({
      title: 'Rappel de tâche',
      body: task.title,
      data: { taskId: task.id, type: 'task_reminder' },
      trigger: reminderTime,
    });
  }

  async scheduleLocationReminder(task: {
    id: string;
    title: string;
    locationName: string;
  }) {
    await this.scheduleLocalNotification({
      title: `Tâche à proximité`,
      body: `${task.title} - ${task.locationName}`,
      data: { taskId: task.id, type: 'location_reminder' },
    });
  }

  async cancelNotification(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
