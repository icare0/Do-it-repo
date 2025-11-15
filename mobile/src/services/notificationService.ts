import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  async initialize() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return null;
      }

      // Get Expo Push token
      const token = await this.getExpoPushToken();

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
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      // Check if we already have a token
      const cachedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (cachedToken) {
        return cachedToken;
      }

      // Get new token
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: '8dffdf0a-29c3-483c-b083-02cc73b7777e',
      });

      // Cache the token
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private setupListeners() {
    // Handle notification received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    // Handle different notification types
    if (data.type === 'task_reminder') {
      // Navigate to task detail
      console.log('Navigate to task:', data.taskId);
    } else if (data.type === 'geofence_trigger') {
      // Navigate to location-based task
      console.log('Navigate to location task:', data.taskId);
    }
  }

  async scheduleTaskReminder(taskId: string, title: string, body: string, trigger: Date) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'task_reminder', taskId },
          sound: true,
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async scheduleLocationReminder(taskId: string, title: string, body: string) {
    try {
      // For now, just show an immediate notification
      // TODO: Implement proper geofencing with expo-location
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'geofence_trigger', taskId },
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling location notification:', error);
      throw error;
    }
  }

  async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();
