import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  type: 'task_reminder' | 'location' | 'daily_summary' | 'achievement';
  title: string;
  message: string;
  time: Date;
  taskId?: string;
  read: boolean;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks } = useTaskStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    taskReminders: true,
    locationBased: true,
    dailySummary: true,
    achievements: true,
  });

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  async function loadNotifications() {
    // Generate sample notifications from tasks
    const upcomingNotifications: Notification[] = tasks
      .filter(t => !t.completed && t.startDate && t.startDate > new Date())
      .slice(0, 10)
      .map((task, index) => ({
        id: `notif-${task.id}`,
        type: 'task_reminder' as const,
        title: 'Rappel de tâche',
        message: `N'oubliez pas : ${task.title}`,
        time: new Date(task.startDate!.getTime() - 15 * 60 * 1000), // 15 min before
        taskId: task.id,
        read: false,
        enabled: true,
      }));

    // Add location-based notifications
    const locationTasks = tasks.filter(t => !t.completed && t.location);
    if (locationTasks.length > 0) {
      upcomingNotifications.push({
        id: 'loc-1',
        type: 'location',
        title: 'Tâches à proximité',
        message: `Vous avez ${locationTasks.length} tâche(s) avec un lieu défini`,
        time: new Date(),
        read: false,
        enabled: true,
      });
    }

    // Daily summary
    upcomingNotifications.push({
      id: 'daily-1',
      type: 'daily_summary',
      title: 'Résumé quotidien',
      message: `Vous avez ${tasks.filter(t => !t.completed).length} tâches en cours`,
      time: new Date(new Date().setHours(8, 0, 0, 0)),
      read: false,
      enabled: true,
    });

    setNotifications(upcomingNotifications.sort((a, b) => b.time.getTime() - a.time.getTime()));
  }

  async function loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        setNotificationSettings(JSON.parse(settings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async function saveSettings(newSettings: typeof notificationSettings) {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  function toggleNotification(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  }

  function markAsRead(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          },
        },
      ]
    );
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'task_reminder':
        return 'alarm-outline';
      case 'location':
        return 'location-outline';
      case 'daily_summary':
        return 'calendar-outline';
      case 'achievement':
        return 'trophy-outline';
      default:
        return 'notifications-outline';
    }
  }

  function getNotificationColor(type: Notification['type']) {
    switch (type) {
      case 'task_reminder':
        return theme.colors.primary;
      case 'location':
        return theme.colors.warning;
      case 'daily_summary':
        return theme.colors.info;
      case 'achievement':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon={<Ionicons name="arrow-back" size={24} color={theme.colors.text} />}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerTitle}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllButton, { color: theme.colors.primary }]}>
              Tout marquer comme lu
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Préférences de notification
          </Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="alarm-outline" size={24} color={theme.colors.text} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Rappels de tâches
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Recevoir des notifications avant vos tâches
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.taskReminders}
                onValueChange={(value) =>
                  saveSettings({ ...notificationSettings, taskReminders: value })
                }
              />
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="location-outline" size={24} color={theme.colors.text} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Notifications de proximité
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Être alerté près d'un lieu de tâche
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.locationBased}
                onValueChange={(value) =>
                  saveSettings({ ...notificationSettings, locationBased: value })
                }
              />
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar-outline" size={24} color={theme.colors.text} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Résumé quotidien
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Résumé de vos tâches chaque matin
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.dailySummary}
                onValueChange={(value) =>
                  saveSettings({ ...notificationSettings, dailySummary: value })
                }
              />
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="trophy-outline" size={24} color={theme.colors.text} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Réussites
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Célébrer vos accomplissements
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.achievements}
                onValueChange={(value) =>
                  saveSettings({ ...notificationSettings, achievements: value })
                }
              />
            </View>
          </Card>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Notifications programmées
          </Text>

          {notifications.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Aucune notification pour le moment
                </Text>
              </View>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
                  !notification.enabled && { opacity: 0.5 },
                ]}
              >
                <View style={styles.notificationContent}>
                  <View style={[styles.iconContainer, { backgroundColor: `${getNotificationColor(notification.type)}15` }]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type) as any}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>

                  <View style={styles.notificationInfo}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                      )}
                    </View>

                    <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                      {notification.message}
                    </Text>

                    <View style={styles.notificationMeta}>
                      <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                        {format(notification.time, "dd MMM 'à' HH:mm", { locale: fr })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleNotification(notification.id)}
                    >
                      <Ionicons
                        name={notification.enabled ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={notification.enabled ? theme.colors.success : theme.colors.textTertiary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: '700' },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: { padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingCard: { marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingDescription: { fontSize: 12 },
  notificationCard: {
    marginBottom: 12,
    borderLeftWidth: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: { fontSize: 14, marginBottom: 8 },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: { fontSize: 12 },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
