import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { SkeletonNotification, SkeletonList } from '@/components/ui/Skeleton';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationStore, NotificationItem } from '@/store/notificationStore';
import { getTheme } from '@/theme';
import { hapticsService } from '@/services/hapticsService';

const getNotificationIcon = (type: NotificationItem['type']): string => {
  switch (type) {
    case 'task_reminder':
      return 'alarm-outline';
    case 'location_reminder':
      return 'location-outline';
    case 'daily_briefing':
      return 'sunny-outline';
    case 'achievement':
      return 'trophy-outline';
    case 'system':
      return 'information-circle-outline';
    default:
      return 'notifications-outline';
  }
};

const getNotificationColor = (type: NotificationItem['type'], theme: any): string => {
  switch (type) {
    case 'task_reminder':
      return theme.colors.primary;
    case 'location_reminder':
      return theme.colors.secondary;
    case 'daily_briefing':
      return theme.colors.warning;
    case 'achievement':
      return theme.colors.success;
    case 'system':
      return theme.colors.info;
    default:
      return theme.colors.textSecondary;
  }
};

const formatNotificationDate = (date: Date): string => {
  if (isToday(date)) {
    return `Aujourd'hui, ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Hier, ${format(date, 'HH:mm')}`;
  }
  return format(date, "d MMM, HH:mm", { locale: fr });
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadFromStorage,
  } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFromStorage().then(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFromStorage();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    await hapticsService.light();
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.taskId) {
      navigation.navigate('TaskDetail' as never, { taskId: notification.taskId } as never);
    }
  };

  const handleDelete = async (notificationId: string) => {
    await hapticsService.medium();
    deleteNotification(notificationId);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Effacer tout',
      'Voulez-vous vraiment supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            hapticsService.medium();
            clearAllNotifications();
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    await hapticsService.light();
    markAllAsRead();
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const iconColor = getNotificationColor(item.type, theme);

    return (
      <SwipeableRow
        rightAction={{
          icon: 'trash-outline',
          color: '#fff',
          backgroundColor: theme.colors.error,
          onPress: () => handleDelete(item.id),
          label: 'Supprimer',
        }}
      >
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <Card
            style={[
              styles.notificationCard,
              !item.read && { backgroundColor: `${theme.colors.primary}08` },
            ]}
          >
            <View style={styles.notificationContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${iconColor}15` },
                ]}
              >
                <Ionicons
                  name={getNotificationIcon(item.type) as any}
                  size={24}
                  color={iconColor}
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                  <Text
                    style={[
                      styles.title,
                      { color: theme.colors.text },
                      !item.read && styles.unread,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>

                <Text
                  style={[styles.body, { color: theme.colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.body}
                </Text>

                <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
                  {formatNotificationDate(item.timestamp)}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={theme.colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Aucune notification
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Vos notifications apparaîtront ici
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <>
              <IconButton
                icon={<Ionicons name="checkmark-done-outline" size={22} color={theme.colors.primary} />}
                onPress={handleMarkAllRead}
              />
              <IconButton
                icon={<Ionicons name="trash-outline" size={22} color={theme.colors.error} />}
                onPress={handleClearAll}
              />
            </>
          )}
          <IconButton
            icon={<Ionicons name="settings-outline" size={22} color={theme.colors.text} />}
            onPress={() => navigation.navigate('NotificationSettings' as never)}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={5} component={SkeletonNotification} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingContainer: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    marginBottom: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  unread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
});
