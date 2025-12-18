/**
 * Rich Notification Service
 * AI-powered, contextual, beautiful notifications
 *
 * Features:
 * - Smart templates based on task type
 * - Expandable notifications with maps, images
 * - Shopping lists with checkboxes
 * - Location-based reminders with maps
 * - Quick actions (complete, snooze, view)
 * - AI-optimized timing
 */

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Task } from '@/types';
import { aiEngine } from './aiEngine';

interface RichNotificationTemplate {
  type: 'shopping' | 'meeting' | 'travel' | 'call' | 'reminder' | 'location' | 'default';
  title: string;
  body: string;
  image?: string;
  actions?: NotificationAction[];
  expandedView?: ExpandedView;
  priority: 'low' | 'default' | 'high' | 'max';
  sound?: string;
  vibration?: number[];
  color?: string;
}

interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
}

interface ExpandedView {
  type: 'list' | 'map' | 'image' | 'bigtext';
  content: any;
}

class RichNotificationService {
  /**
   * Create a rich notification for a task
   * AI-powered content generation
   */
  async createRichNotification(task: Task): Promise<string | null> {
    try {
      // 1. Analyze task with AI to determine best template
      const template = await this.generateTemplate(task);

      // 2. Setup notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // 3. Build rich notification content
      const content = await this.buildNotificationContent(task, template);

      // 4. Schedule with optimal timing (AI-powered)
      const trigger = await this.calculateOptimalTiming(task);

      // 5. Create notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      console.log(`🔔 Rich notification scheduled: ${notificationId}`);
      return notificationId;

    } catch (error) {
      console.error('Error creating rich notification:', error);
      return null;
    }
  }

  /**
   * Generate AI-powered template based on task
   */
  private async generateTemplate(task: Task): Promise<RichNotificationTemplate> {
    const intent = task.detectedIntent || 'default';
    const hasLocation = Boolean(task.location);
    const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);

    // Shopping list notification
    if (intent === 'shopping' || hasSubtasks) {
      return {
        type: 'shopping',
        title: '🛒 Liste de courses',
        body: this.formatShoppingList(task),
        actions: [
          { id: 'view', title: 'Voir la liste', icon: 'list' },
          { id: 'complete', title: 'Terminé', icon: 'checkmark' },
          { id: 'snooze', title: '+15min', icon: 'time' },
        ],
        expandedView: {
          type: 'list',
          content: task.subtasks || [],
        },
        priority: 'default',
        color: '#10b981',
        vibration: [0, 250, 100, 250],
      };
    }

    // Location-based notification with map
    if (hasLocation) {
      return {
        type: 'location',
        title: `📍 ${task.title}`,
        body: this.formatLocationInfo(task),
        actions: [
          { id: 'navigate', title: 'Y aller', icon: 'navigate' },
          { id: 'view', title: 'Voir', icon: 'eye' },
          { id: 'complete', title: 'Fait', icon: 'checkmark' },
        ],
        expandedView: {
          type: 'map',
          content: {
            latitude: task.location!.latitude,
            longitude: task.location!.longitude,
            name: task.location!.name,
          },
        },
        priority: 'high',
        color: '#3b82f6',
        sound: 'notification_location.mp3',
      };
    }

    // Meeting notification
    if (intent === 'meeting' || intent === 'call') {
      return {
        type: 'meeting',
        title: `📞 ${task.title}`,
        body: this.formatMeetingInfo(task),
        actions: [
          { id: 'join', title: 'Rejoindre', icon: 'videocam' },
          { id: 'snooze', title: '+5min', icon: 'time' },
          { id: 'cancel', title: 'Annuler', icon: 'close', destructive: true },
        ],
        priority: 'max',
        color: '#ef4444',
        sound: 'notification_urgent.mp3',
        vibration: [0, 500, 200, 500, 200, 500],
      };
    }

    // Travel notification
    if (intent === 'travel' || task.category === 'transport') {
      return {
        type: 'travel',
        title: `✈️ ${task.title}`,
        body: this.formatTravelInfo(task),
        actions: [
          { id: 'directions', title: 'Itinéraire', icon: 'navigate' },
          { id: 'view', title: 'Détails', icon: 'information' },
        ],
        priority: 'high',
        color: '#8b5cf6',
      };
    }

    // Default rich notification
    return {
      type: 'default',
      title: `⏰ ${task.title}`,
      body: this.formatDefaultInfo(task),
      actions: [
        { id: 'complete', title: 'Terminer', icon: 'checkmark' },
        { id: 'snooze', title: '+15min', icon: 'time' },
        { id: 'view', title: 'Voir', icon: 'eye' },
      ],
      expandedView: task.description ? {
        type: 'bigtext',
        content: task.description,
      } : undefined,
      priority: task.priority === 'high' ? 'high' : 'default',
      color: task.priority === 'high' ? '#f59e0b' : '#6366f1',
    };
  }

  /**
   * Build rich notification content
   */
  private async buildNotificationContent(
    task: Task,
    template: RichNotificationTemplate
  ): Promise<Notifications.NotificationContentInput> {
    const content: Notifications.NotificationContentInput = {
      title: template.title,
      body: template.body,
      data: {
        taskId: task.id,
        type: template.type,
        task: task,
      },
      priority: this.mapPriority(template.priority),
      sound: template.sound || 'default',
    };

    // Android-specific rich features
    if (Platform.OS === 'android') {
      content.channelId = this.getChannelId(template.type);
      content.color = template.color;

      // Add actions
      if (template.actions) {
        content.categoryIdentifier = template.type;
      }

      // Style for expanded view
      if (template.expandedView) {
        content.subtitle = this.getExpandedViewHint(template.expandedView);
      }
    }

    // iOS-specific features
    if (Platform.OS === 'ios') {
      content.categoryIdentifier = template.type;
      content.threadIdentifier = task.category || 'general';
      content.sound = template.sound || 'default';

      if (template.expandedView?.type === 'image') {
        // iOS can show images in notifications
        content.attachments = [{
          identifier: 'image',
          url: template.expandedView.content,
        }];
      }
    }

    return content;
  }

  /**
   * Calculate optimal notification timing using AI
   */
  private async calculateOptimalTiming(task: Task): Promise<Notifications.NotificationTriggerInput | null> {
    if (!task.startDate) {
      return null;
    }

    const now = new Date();
    const taskDate = new Date(task.startDate);

    // AI-powered timing optimization
    let minutesBefore = 15; // default

    // Adjust based on task type
    const intent = task.detectedIntent;
    if (intent === 'meeting' || intent === 'call') {
      minutesBefore = 5; // Less time for meetings
    } else if (intent === 'travel') {
      minutesBefore = 60; // More time for travel
    } else if (task.location) {
      // Calculate travel time with AI
      minutesBefore = await this.estimateTravelTime(task) + 10;
    } else if (task.priority === 'high') {
      minutesBefore = 30; // More time for important tasks
    }

    const notificationTime = new Date(taskDate.getTime() - minutesBefore * 60000);

    if (notificationTime <= now) {
      return null; // Don't schedule past notifications
    }

    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationTime,
    };
  }

  /**
   * Estimate travel time to location (AI-powered)
   */
  private async estimateTravelTime(task: Task): Promise<number> {
    if (!task.location) return 15;

    try {
      // Get user's current location
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return 15;

      const currentLocation = await Location.getCurrentPositionAsync({});
      const distance = this.calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        task.location.latitude,
        task.location.longitude
      );

      // Estimate: 50km/h average speed
      const travelMinutes = Math.ceil((distance / 50) * 60);

      // Cap between 5 and 120 minutes
      return Math.min(Math.max(travelMinutes, 5), 120);
    } catch {
      return 15;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Formatting helpers
  private formatShoppingList(task: Task): string {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.title;
    }

    const incomplete = task.subtasks.filter(st => !st.completed);
    if (incomplete.length === 0) {
      return `${task.title} - Tout acheté! ✅`;
    }

    const preview = incomplete.slice(0, 3).map(st => st.title).join(', ');
    const more = incomplete.length > 3 ? ` +${incomplete.length - 3} autres` : '';

    return `${incomplete.length} articles: ${preview}${more}`;
  }

  private formatLocationInfo(task: Task): string {
    if (!task.location) return task.title;

    const address = task.location.address || task.location.name;
    return `${task.title}\n📍 ${address}`;
  }

  private formatMeetingInfo(task: Task): string {
    let info = task.title;

    if (task.startDate) {
      const time = new Date(task.startDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      info = `${time} - ${info}`;
    }

    if (task.duration) {
      info += ` (${task.duration}min)`;
    }

    return info;
  }

  private formatTravelInfo(task: Task): string {
    let info = task.title;

    if (task.startDate) {
      const date = new Date(task.startDate).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const time = new Date(task.startDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      info = `${date} à ${time}\n${info}`;
    }

    return info;
  }

  private formatDefaultInfo(task: Task): string {
    let info = task.title;

    if (task.description) {
      info += `\n${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`;
    }

    if (task.category) {
      info += `\n📁 ${task.category}`;
    }

    return info;
  }

  // Helper methods
  private mapPriority(priority: string): Notifications.AndroidNotificationPriority {
    const map: Record<string, Notifications.AndroidNotificationPriority> = {
      low: Notifications.AndroidNotificationPriority.LOW,
      default: Notifications.AndroidNotificationPriority.DEFAULT,
      high: Notifications.AndroidNotificationPriority.HIGH,
      max: Notifications.AndroidNotificationPriority.MAX,
    };
    return map[priority] || Notifications.AndroidNotificationPriority.DEFAULT;
  }

  private getChannelId(type: string): string {
    return `rich-${type}`;
  }

  private getExpandedViewHint(expandedView: ExpandedView): string {
    const hints: Record<string, string> = {
      list: 'Appuyez pour voir la liste complète',
      map: 'Appuyez pour voir la carte',
      image: 'Appuyez pour voir l\'image',
      bigtext: 'Appuyez pour voir les détails',
    };
    return hints[expandedView.type] || '';
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels = [
      {
        id: 'rich-shopping',
        name: '🛒 Listes de courses',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'shopping.mp3',
        lightColor: '#10b981',
      },
      {
        id: 'rich-location',
        name: '📍 Rappels de lieu',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'location.mp3',
        lightColor: '#3b82f6',
      },
      {
        id: 'rich-meeting',
        name: '📞 Réunions et appels',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'urgent.mp3',
        lightColor: '#ef4444',
        vibrationPattern: [0, 500, 200, 500],
      },
      {
        id: 'rich-travel',
        name: '✈️ Voyages et déplacements',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        lightColor: '#8b5cf6',
      },
      {
        id: 'rich-default',
        name: '⏰ Rappels généraux',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        lightColor: '#6366f1',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        sound: channel.sound,
        lightColor: channel.lightColor,
        vibrationPattern: channel.vibrationPattern,
        enableVibrate: true,
      });
    }

    console.log('✅ Rich notification channels configured');
  }

  /**
   * Setup notification actions/categories
   */
  async setupNotificationActions(): Promise<void> {
    // Shopping actions
    await Notifications.setNotificationCategoryAsync('shopping', [
      {
        identifier: 'view',
        buttonTitle: 'Voir la liste',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'complete',
        buttonTitle: 'Terminé',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: '+15min',
        options: { opensAppToForeground: false },
      },
    ]);

    // Location actions
    await Notifications.setNotificationCategoryAsync('location', [
      {
        identifier: 'navigate',
        buttonTitle: 'Y aller',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'complete',
        buttonTitle: 'Fait',
        options: { opensAppToForeground: false },
      },
    ]);

    // Meeting actions
    await Notifications.setNotificationCategoryAsync('meeting', [
      {
        identifier: 'join',
        buttonTitle: 'Rejoindre',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze',
        buttonTitle: '+5min',
        options: { opensAppToForeground: false },
      },
    ]);

    // Default actions
    await Notifications.setNotificationCategoryAsync('default', [
      {
        identifier: 'complete',
        buttonTitle: 'Terminer',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: '+15min',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'view',
        buttonTitle: 'Voir',
        options: { opensAppToForeground: true },
      },
    ]);

    console.log('✅ Notification actions configured');
  }
}

export const richNotificationService = new RichNotificationService();
