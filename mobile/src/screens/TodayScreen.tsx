import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { VoiceButton } from '@/components/ui/VoiceButton';
import { SkeletonTaskCard, SkeletonList } from '@/components/ui/Skeleton';
import { OfflineBadge } from '@/components/ui/OfflineIndicator';
import { DailyBriefing } from '@/components/DailyBriefing';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useSyncStore } from '@/store/syncStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getTheme } from '@/theme';
import { syncService } from '@/services/syncService';
import { hapticsService } from '@/services/hapticsService';
import { VoiceTranscription } from '@/services/voiceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TodayScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, setSelectedTask, updateTask, deleteTask } = useTaskStore();
  const { isSyncing } = useSyncStore();
  const { unreadCount } = useNotificationStore();
  const [showBriefing, setShowBriefing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    checkBriefingStatus();
  }, []);

  const checkBriefingStatus = async () => {
    const lastDismissed = await AsyncStorage.getItem('briefing_dismissed_date');
    if (lastDismissed === todayStr) {
      setShowBriefing(false);
    }
  };

  const handleDismissBriefing = async () => {
    await AsyncStorage.setItem('briefing_dismissed_date', todayStr);
    setShowBriefing(false);
  };

  const todayTasks = tasks
    .filter(
      (task) =>
        !task.completed &&
        task.startDate &&
        format(task.startDate, 'yyyy-MM-dd') === todayStr
    )
    .sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return a.startDate.getTime() - b.startDate.getTime();
    });

  const completedToday = tasks.filter(
    (task) =>
      task.completed &&
      task.startDate &&
      format(task.startDate, 'yyyy-MM-dd') === todayStr
  );

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.startDate && task.startDate > today)
    .slice(0, 3);

  async function handleRefresh() {
    setIsLoading(true);
    await syncService.forceSyncNow();
    setIsLoading(false);
  }

  function handleTaskPress(task: any) {
    hapticsService.light();
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as never, { taskId: task.id } as never);
  }

  async function handleToggleTask(taskId: string) {
    await hapticsService.taskComplete();
    toggleTaskCompletion(taskId);
  }

  function handlePostponeTask(task: any) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(task.startDate?.getHours() || 9, task.startDate?.getMinutes() || 0);
    updateTask(task.id, { startDate: tomorrow });
    hapticsService.medium();
  }

  function handleDeleteTask(taskId: string) {
    deleteTask(taskId);
    hapticsService.medium();
  }

  function handleVoiceTranscription(result: VoiceTranscription) {
    navigation.navigate('QuickAdd' as never, { prefillText: result.text } as never);
  }

  const progressPercent =
    todayTasks.length + completedToday.length > 0
      ? Math.round((completedToday.length / (todayTasks.length + completedToday.length)) * 100)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>Aujourd'hui</Text>
        </View>
        <View style={styles.headerRight}>
          <OfflineBadge />
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isSyncing || isLoading} onRefresh={handleRefresh} />
        }
      >
        {showBriefing && (
          <View style={styles.briefingContainer}>
            <DailyBriefing
              onDismiss={handleDismissBriefing}
              onTaskPress={() => navigation.navigate('TaskList' as never)}
              onFocusPress={() => navigation.navigate('FocusMode' as never)}
            />
          </View>
        )}

        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
                Progression du jour
              </Text>
              <Text style={[styles.progressSubtitle, { color: theme.colors.textSecondary }]}>
                {completedToday.length} / {todayTasks.length + completedToday.length} tâches
              </Text>
            </View>
            <View
              style={[
                styles.progressCircle,
                {
                  backgroundColor:
                    colorScheme === 'dark'
                      ? 'rgba(96, 165, 250, 0.15)'
                      : 'rgba(59, 130, 246, 0.1)',
                },
              ]}
            >
              <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                {progressPercent}%
              </Text>
            </View>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tâches du jour
            </Text>
            <Badge label={todayTasks.length.toString()} variant="primary" />
          </View>

          {isLoading ? (
            <SkeletonList count={3} component={SkeletonTaskCard} />
          ) : todayTasks.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Aucune tâche pour aujourd'hui
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
                  Profitez de votre journée ! 🎉
                </Text>
              </View>
            </Card>
          ) : (
            todayTasks.map((task) => (
              <SwipeableRow
                key={task.id}
                leftAction={{
                  icon: 'calendar-outline',
                  color: '#fff',
                  backgroundColor: theme.colors.warning,
                  onPress: () => handlePostponeTask(task),
                  label: 'Demain',
                }}
                rightAction={{
                  icon: 'trash-outline',
                  color: '#fff',
                  backgroundColor: theme.colors.error,
                  onPress: () => handleDeleteTask(task.id),
                  label: 'Supprimer',
                }}
              >
                <Card style={styles.taskCard} onPress={() => handleTaskPress(task)}>
                  <View style={styles.taskContent}>
                    <Checkbox
                      checked={task.completed}
                      onPress={() => handleToggleTask(task.id)}
                    />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskMeta}>
                        {task.startDate && (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                              {format(task.startDate, 'HH:mm')}
                            </Text>
                          </View>
                        )}
                        {task.location && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                              {task.location.name}
                            </Text>
                          </View>
                        )}
                        {task.category && <Badge label={task.category} size="small" />}
                      </View>
                    </View>
                    {task.priority === 'high' && (
                      <View style={[styles.priorityIndicator, { backgroundColor: theme.colors.error }]} />
                    )}
                  </View>
                </Card>
              </SwipeableRow>
            ))
          )}
        </View>

        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>À venir</Text>
            {upcomingTasks.map((task) => (
              <Card key={task.id} style={styles.taskCard} onPress={() => handleTaskPress(task)}>
                <View style={styles.taskContent}>
                  <Checkbox
                    checked={task.completed}
                    onPress={() => handleToggleTask(task.id)}
                  />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      {task.startDate && (
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                            {format(task.startDate, 'dd MMM', { locale: fr })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <VoiceButton onTranscription={handleVoiceTranscription} size="medium" style={styles.voiceFab} />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
          onPress={() => {
            hapticsService.medium();
            navigation.navigate('QuickAdd' as never);
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 14, marginBottom: 4, textTransform: 'capitalize' },
  title: { fontSize: 32, fontWeight: '700' },
  notificationButton: { padding: 8, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  briefingContainer: { marginBottom: 16 },
  progressCard: { marginBottom: 24 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  progressSubtitle: { fontSize: 14 },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: { fontSize: 18, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  taskCard: { marginBottom: 12 },
  taskContent: { flexDirection: 'row', alignItems: 'center' },
  taskInfo: { flex: 1, marginLeft: 12 },
  taskTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  priorityIndicator: { width: 4, height: 40, borderRadius: 2, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  emptySubtext: { marginTop: 4, fontSize: 13 },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceFab: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
