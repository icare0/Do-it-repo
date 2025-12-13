import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Pressable,
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
import { CategoryBadge, PriorityBadge } from '@/components/ui/Badge';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { VoiceButton } from '@/components/ui/VoiceButton';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, TaskModel } from '@/database';

export default function TodayScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, setSelectedTask, updateTask, deleteTask } = useTaskStore();
  const { isSyncing } = useSyncStore();
  const { unreadCount } = useNotificationStore();
  const { points, level, streak } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  const confettiRef = React.useRef<ConfettiCannon>(null);

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
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = priorityOrder[a.priority || 'medium'];
      const priorityB = priorityOrder[b.priority || 'medium'];
      if (priorityA !== priorityB) return priorityA - priorityB;
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

  // Effect for celebration
  useEffect(() => {
    if (progressPercent === 1 && completedToday.length > 0) {
      setTimeout(() => {
        confettiRef.current?.start();
      }, 500); // Small delay for effect
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
    navigation.navigate('QuickAdd' as never, { prefillText: result.text } as never);
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

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
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.compactHeader,
          {
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
            ...shadows.sm,
          },
        ]}
      >
        <Text style={[styles.compactTitle, { color: theme.colors.text }]}>
          Aujourd'hui
        </Text>
        <View style={styles.compactHeaderRight}>
          <OfflineBadge />
        </View>
      </Animated.View>

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
        {/* Large Title Header */}
        <View style={styles.largeHeader}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
                {format(today, 'EEEE d MMMM', { locale: fr })}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {/* Streak Badge */}
              {streak > 0 && (
                <Pressable
                  style={[styles.streakContainer, { backgroundColor: theme.colors.orangeSoft }]}
                  onPress={() => navigation.navigate('Stats' as never)}
                >
                  <Ionicons name="flame" size={18} color={theme.colors.orange} />
                  <Text style={[styles.streakText, { color: theme.colors.orange }]}>
                    {streak}
                  </Text>
                </Pressable>
              )}
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
          <Text style={[styles.largeTitle, { color: theme.colors.text }]}>
            Aujourd'hui
          </Text>
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              VOS TÂCHES
            </Text>
            {todayTasks.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.countText}>{todayTasks.length}</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <SkeletonList count={3} component={SkeletonTaskCard} />
          ) : todayTasks.length === 0 ? (
            <Card variant="elevated" padding="xxxl">
              <View style={styles.emptyState}>
                <View style={[
                  styles.emptyIcon,
                  { backgroundColor: completedToday.length > 0 ? `${theme.colors.success}20` : `${theme.colors.primary}15` }
                ]}>
                  <Ionicons
                    name={completedToday.length > 0 ? "checkmark-circle" : "calendar-number-outline"}
                    size={32}
                    color={completedToday.length > 0 ? theme.colors.success : theme.colors.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  {completedToday.length > 0 ? "Tout est fait !" : "Rien de prévu"}
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {completedToday.length > 0
                    ? "Vous avez terminé toutes vos tâches du jour !"
                    : "Rien de prévu pour le moment, profitez-en !"}
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.taskList}>
              {todayTasks.map((task, index) => (
                <SwipeableRow
                  key={task.id}
                  leftAction={{
                    icon: 'calendar-outline',
                    color: '#fff',
                    gradient: ['#F59E0B', '#FCD34D'],
                    onPress: () => handlePostponeTask(task),
                    label: 'Demain',
                  }}
                  rightAction={{
                    icon: 'trash-outline',
                    color: '#fff',
                    gradient: ['#EF4444', '#F87171'],
                    onPress: () => handleDeleteTask(task.id),
                    label: 'Supprimer',
                  }}
                >
                  <View style={styles.timelineRow}>
                    {/* Time Column */}
                    <View style={styles.timeColumn}>
                      <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                        {task.startDate ? format(task.startDate, 'HH:mm') : '--:--'}
                      </Text>
                      {task.startDate && (
                        <View style={[styles.timeDot, { backgroundColor: theme.colors.primary }]} />
                      )}
                    </View>

                    {/* Task Card */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleTaskPress(task)}
                      style={[
                        styles.timelineCard,
                        {
                          backgroundColor: theme.colors.surface,
                          shadowColor: theme.colors.shadowColor || '#000',
                          borderColor: theme.colors.border,
                        }
                      ]}
                    >
                      <View style={styles.cardMainContent}>
                        <View style={styles.cardHeader}>
                          <Text
                            style={[
                              styles.cardTitle,
                              { color: theme.colors.text },
                              task.completed && styles.taskTitleCompleted
                            ]}
                            numberOfLines={2}
                          >
                            {task.title}
                          </Text>
                          <Checkbox
                            checked={task.completed}
                            onPress={() => handleToggleTask(task.id)}
                            size={22}
                          />
                        </View>

                        {(task.description || task.location || task.category) && (
                          <View style={styles.cardDetails}>
                            {task.location && (
                              <View style={styles.detailItem}>
                                <Ionicons name="location-sharp" size={12} color={theme.colors.textTertiary} />
                                <Text style={[styles.detailText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                                  {task.location.name}
                                </Text>
                              </View>
                            )}
                            {task.category && (
                              <View style={[styles.detailItem, {
                                backgroundColor: theme.colors.primary + '10',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }]}>
                                <Text style={[styles.detailText, { color: theme.colors.primary, fontSize: 11, fontWeight: '600' }]}>
                                  {task.category.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </SwipeableRow>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                À VENIR
              </Text>
            </View>
            <View style={styles.taskList}>
              {upcomingTasks.map((task, index) => (
                <Card
                  key={task.id}
                  variant="flat"
                  padding="lg"
                  borderRadiusSize="lg"
                  style={[
                    styles.taskCard,
                    index === upcomingTasks.length - 1 && styles.taskCardLast,
                  ]}
                  onPress={() => handleTaskPress(task)}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={1}>
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
                        {task.category && (
                          <CategoryBadge category={task.category as any} size="small" />
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Completed Today */}
        {completedToday.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                TERMINÉES AUJOURD'HUI
              </Text>
              <View style={[styles.countBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.countText}>{completedToday.length}</Text>
              </View>
            </View>
            <View style={styles.taskList}>
              {completedToday.slice(0, 5).map((task, index) => (
                <Card
                  key={task.id}
                  variant="flat"
                  padding="md"
                  borderRadiusSize="md"
                  style={[
                    styles.completedCard,
                    index === Math.min(completedToday.length, 5) - 1 && styles.taskCardLast,
                  ]}
                  onPress={() => handleTaskPress(task)}
                >
                  <View style={styles.completedContent}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text
                      style={[styles.completedTitle, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Confetti Cannon */}
      {/* Confetti Cannon removed for debugging */}
      {/* <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.success, '#FFD700']}
      /> */}

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <AnimatedFAB
          onPress={() => navigation.navigate('QuickAdd' as never)}
          gradientColors={theme.colors.gradient.primary}
          iconColor={theme.colors.textOnColor}
          pulse={todayTasks.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44 + 44, // status bar + header
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  compactTitle: {
    ...typography.headline,
  },
  compactHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: layout.scrollContentPaddingBottom,
  },
  largeHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.headline,
    marginBottom: spacing.xxs,
  },
  date: {
    ...typography.subheadline,
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  streakText: {
    ...typography.footnoteEmphasized,
  },
  largeTitle: {
    ...typography.largeTitle,
  },
  briefingContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  progressCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  progressHeader: {
    marginBottom: spacing.xl,
  },
  progressTitle: {
    ...typography.title3,
    marginBottom: spacing.xxs,
  },
  progressSubtitle: {
    ...typography.subheadline,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleBg: {
    borderWidth: 8,
  },
  progressCircleInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    ...typography.title1,
  },
  progressLabel: {
    ...typography.caption1,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption1Emphasized,
    letterSpacing: 0.5,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    ...typography.caption2Emphasized,
    color: '#FFFFFF',
  },
  taskList: {
    paddingHorizontal: spacing.xl,
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskCardLast: {
    marginBottom: 0,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    ...typography.body,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskDescription: {
    ...typography.subheadline,
    marginBottom: spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption1,
  },
  completedCard: {
    marginBottom: spacing.sm,
  },
  completedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  completedTitle: {
    ...typography.subheadline,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.title3,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.subheadline,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: layout.fabBottomOffset,
    right: spacing.xl,
    zIndex: 100,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timeColumn: {
    width: 50,
    alignItems: 'center',
    paddingTop: 16,
    marginRight: 8,
  },
  timeText: {
    ...typography.caption1Emphasized,
    fontSize: 13,
  },
  timeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  simpleCard: {
    marginBottom: spacing.md,
  },
  cardMainContent: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    ...typography.bodyEmphasized,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...typography.caption1,
    fontSize: 12,
  },
});
