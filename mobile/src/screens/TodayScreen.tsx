import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CategoryBadge } from '@/components/ui/Badge';
import { VoiceButton } from '@/components/ui/VoiceButton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { SkeletonTaskCard, SkeletonList } from '@/components/ui/Skeleton';
import { OfflineBadge } from '@/components/ui/OfflineIndicator';
import { AnimatedFAB } from '@/components/ui/AnimatedFAB';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useSyncStore } from '@/store/syncStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import { getTheme, spacing, borderRadius, typography, shadows, layout } from '@/theme';
import { syncService } from '@/services/syncService';
import { hapticsService } from '@/services/hapticsService';
import { VoiceTranscription } from '@/services/voiceService';
import { database, TaskModel } from '@/database';

const { width } = Dimensions.get('window');

export default function TodayScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, setSelectedTask, updateTask, deleteTask } = useTaskStore();
  const { isSyncing } = useSyncStore();
  const { unreadCount } = useNotificationStore();
  const { points, level, streak } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  const confettiRef = useRef<ConfettiCannon>(null);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayTasks = tasks
    .filter(
      (task) =>
        !task.completed &&
        task.startDate &&
        format(task.startDate, 'yyyy-MM-dd') === todayStr
    )
    .sort((a, b) => {
      // Sort by priority then time
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = priorityOrder[a.priority || 'medium'];
      const priorityB = priorityOrder[b.priority || 'medium'];
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (!a.startDate || !b.startDate) return 0;
      return a.startDate.getTime() - b.startDate.getTime();
    });

  const nextTask = todayTasks.length > 0 ? todayTasks[0] : null;
  const otherTasks = todayTasks.length > 0 ? todayTasks.slice(1) : [];

  const completedToday = tasks.filter(
    (task) =>
      task.completed &&
      task.startDate &&
      format(task.startDate, 'yyyy-MM-dd') === todayStr
  );

  const upcomingTasks = tasks
    .filter(
      (task) =>
        !task.completed &&
        task.startDate &&
        task.startDate > today &&
        format(task.startDate, 'yyyy-MM-dd') !== todayStr
    )
    .slice(0, 3);

  const totalTasks = todayTasks.length + completedToday.length;
  const progressPercent = totalTasks > 0 ? (completedToday.length / totalTasks) : 0;

  // XP Progress Calculation
  const nextLevelPoints = level * 100;
  const xpProgress = Math.min(points / nextLevelPoints, 1);

  // Effect for celebration
  useEffect(() => {
    if (progressPercent === 1 && completedToday.length > 0) {
      setTimeout(() => {
        confettiRef.current?.start();
      }, 500);
    }
  }, [progressPercent, completedToday.length]);

  async function handleRefresh() {
    setIsLoading(true);
    await syncService.forceSyncNow();
    setIsLoading(false);
  }

  function handleTaskPress(task: any) {
    hapticsService.light();
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as any, { taskId: task.id });
  }

  function handleStartFocus(task: any) {
    hapticsService.medium();
    navigation.navigate('FocusMode' as any, { taskTitle: task.title });
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

  async function handleDeleteTask(taskId: string) {
    try {
      await database.write(async () => {
        const dbTask = await database.get<TaskModel>('tasks').find(taskId);
        await dbTask.markAsDeleted();
      });
      await syncService.addToSyncQueue('task', taskId, 'delete', {});
      deleteTask(taskId);
      hapticsService.medium();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function handleVoiceTranscription(result: VoiceTranscription) {
    navigation.navigate('QuickAdd' as any, { prefillText: result.text });
  }

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing || isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Top User Bar */}
        <View style={[styles.topBar, { justifyContent: 'flex-end' }]}>
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              {unreadCount > 0 && (
                <View style={[styles.notificationDot, { backgroundColor: theme.colors.error }]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.largeTitle, { color: theme.colors.text }]}>
            {todayTasks.length > 0 ? "Votre Mission" : "Tout est calme"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </Text>
        </View>

        {/* HERO SECTION: Current Mission */}
        {nextTask ? (
          <View style={styles.heroSection}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleTaskPress(nextTask)}
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.primary,
                }
              ]}
            >
              <LinearGradient
                colors={[theme.colors.primarySoft, theme.colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroHeader}>
                  <View style={styles.heroBadge}>
                    <Text style={[styles.heroBadgeText, { color: theme.colors.primary }]}>
                      EN COURS
                    </Text>
                  </View>
                  <Text style={[styles.heroTime, { color: theme.colors.primaryDark }]}>
                    {nextTask.startDate ? format(nextTask.startDate, 'HH:mm') : 'Maintenant'}
                  </Text>
                </View>

                <Text style={[styles.heroTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {nextTask.title}
                </Text>

                <View style={styles.heroFooter}>
                  <CategoryBadge category={nextTask.category as any} />

                  <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStartFocus(nextTask);
                    }}
                  >
                    <Ionicons name="play" size={16} color="#FFF" />
                    <Text style={styles.startButtonText}>Focus</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <Card variant="elevated" padding="xxxl" style={styles.emptyCard}>
            <View style={styles.emptyState}>
              <View style={[
                styles.emptyIcon,
                { backgroundColor: completedToday.length > 0 ? `${theme.colors.success}20` : `${theme.colors.primary}15` }
              ]}>
                <Ionicons
                  name={completedToday.length > 0 ? "checkmark-circle" : "trophy-outline"}
                  size={40}
                  color={completedToday.length > 0 ? theme.colors.success : theme.colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {completedToday.length > 0 ? "Mission Accomplie !" : "Prêt à décoller ?"}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {completedToday.length > 0
                  ? "Profitez de votre temps libre."
                  : "Ajoutez une tâche pour commencer."}
              </Text>
            </View>
          </Card>
        )}

        {/* Secondary Tasks List */}
        {otherTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              SUITE DU PROGRAMME
            </Text>
            <View style={styles.taskList}>
              {otherTasks.map((task) => (
                <SwipeableRow
                  key={task.id}
                  leftAction={{
                    icon: 'calendar-outline',
                    color: '#fff',
                    gradient: ['#F59E0B', '#FCD34D'],
                    onPress: () => handlePostponeTask(task),
                    label: 'Reporter',
                  }}
                  rightAction={{
                    icon: 'trash-outline',
                    color: '#fff',
                    gradient: ['#EF4444', '#F87171'],
                    onPress: () => handleDeleteTask(task.id),
                    label: 'Supprimer',
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleTaskPress(task)}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    ]}
                  >
                    <Checkbox
                      checked={task.completed}
                      onPress={() => handleToggleTask(task.id)}
                      size={22}
                    />
                    <View style={styles.taskItemContent}>
                      <Text style={[styles.taskItemTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskItemTime, { color: theme.colors.textSecondary }]}>
                        {task.startDate ? format(task.startDate, 'HH:mm') : ''} • {task.category || 'Général'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </SwipeableRow>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Section */}
        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              DEMAIN ET APRÈS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {upcomingTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleTaskPress(task)}
                  style={[styles.upcomingCard, { backgroundColor: theme.colors.surfaceSecondary }]}
                >
                  <Text style={[styles.upcomingDate, { color: theme.colors.primary }]}>
                    {task.startDate ? format(task.startDate, 'dd MMM') : ''}
                  </Text>
                  <Text style={[styles.upcomingTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Completed Stats Footer */}
        {completedToday.length > 0 && (
          <View style={styles.footerStats}>
            <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
              {completedToday.length} tâches terminées aujourd'hui
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Confetti Cannon */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.success, '#FFD700']}
      />

      {/* Floating Action Button Group */}
      <View style={styles.fabContainer}>
        <View style={{ marginBottom: 16 }}>
          <VoiceButton onTranscription={handleVoiceTranscription} />
        </View>
        <AnimatedFAB
          onPress={() => navigation.navigate('QuickAdd' as never)}
          gradientColors={theme.colors.gradient.primary}
          iconColor={theme.colors.textOnColor}
          pulse={todayTasks.length === 0}
        />
      </View>

      {/* Compact Header for Scroll */}
      <Animated.View
        style={[
          styles.compactHeader,
          {
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <Text style={[styles.compactTitle, { color: theme.colors.text }]}>
          Aujourd'hui
        </Text>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: layout.scrollContentPaddingBottom,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  compactTitle: {
    ...typography.headline,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  levelText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  xpContainer: {
    justifyContent: 'center',
    gap: 2,
  },
  xpText: {
    ...typography.caption2,
    fontWeight: '600',
  },
  xpBarBg: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakNumber: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  titleContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  largeTitle: {
    ...typography.largeTitle,
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.title3,
    textTransform: 'capitalize',
  },
  heroSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: spacing.lg,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTime: {
    fontWeight: '600',
    fontSize: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: spacing.lg,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.title2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.7,
  },
  taskList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  taskItemContent: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskItemTime: {
    fontSize: 13,
  },
  horizontalScroll: {
    paddingLeft: spacing.xl,
  },
  upcomingCard: {
    width: 140,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  upcomingDate: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerStats: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  footerText: {
    fontSize: 13,
  },
  fabContainer: {
    position: 'absolute',
    bottom: layout.fabBottomOffset,
    right: spacing.xl,
    zIndex: 100,
  },
});
