import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  type: 'task_reminder' | 'location_reminder' | 'daily_briefing' | 'achievement' | 'system';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  timestamp: Date;
  taskId?: string;
}

export interface NotificationSettings {
  // General
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;

  // Specific notifications
  taskReminders: boolean;
  locationReminders: boolean;
  dailyBriefing: boolean;
  dailyBriefingTime: string; // HH:mm format
  achievements: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm

  // Advanced
  reminderMinutes: number; // minutes before task
  locationRadius: number; // meters for proximity notifications
}

interface NotificationState {
  notifications: NotificationItem[];
  settings: NotificationSettings;
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<NotificationItem, 'timestamp' | 'read'> & { id?: string }) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  badge: true,
  taskReminders: true,
  locationReminders: true,
  dailyBriefing: true,
  dailyBriefingTime: '08:00',
  achievements: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  reminderMinutes: 15,
  locationRadius: 100,
};

const NOTIFICATIONS_KEY = 'notifications_history';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  settings: DEFAULT_SETTINGS,
  unreadCount: 0,

  addNotification: (notification) => {
    const { notifications } = get();

    // Check for duplicates if ID is provided
    if (notification.id && notifications.some(n => n.id === notification.id)) {
      return;
    }

    const newNotification: NotificationItem = {
      ...notification,
      id: notification.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
      unreadCount: state.unreadCount + 1,
    }));

    get().saveToStorage();
  },

  markAsRead: (notificationId) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
    get().saveToStorage();
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    get().saveToStorage();
  },

  deleteNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = notification && !notification.read;
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
    get().saveToStorage();
  },

  clearAllNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
    get().saveToStorage();
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const [notificationsJson, settingsJson] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY),
      ]);

      const notifications: NotificationItem[] = notificationsJson
        ? JSON.parse(notificationsJson).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
        : [];

      const settings: NotificationSettings = settingsJson
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) }
        : DEFAULT_SETTINGS;

      const unreadCount = notifications.filter((n) => !n.read).length;

      set({ notifications, settings, unreadCount });
    } catch (error) {
      console.error('Error loading notification store:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { notifications, settings } = get();
      await Promise.all([
        AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications)),
        AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings)),
      ]);
    } catch (error) {
      console.error('Error saving notification store:', error);
    }
  },
}));
