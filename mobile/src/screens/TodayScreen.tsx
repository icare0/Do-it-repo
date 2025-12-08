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

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CategoryBadge, PriorityBadge } from '@/components/ui/Badge';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { VoiceButton } from '@/components/ui/VoiceButton';
import { SkeletonTaskCard, SkeletonList } from '@/components/ui/Skeleton';
import { OfflineBadge } from '@/components/ui/OfflineIndicator';
import { DailyBriefing } from '@/components/DailyBriefing';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useSyncStore } from '@/store/syncStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import { getTheme, spacing, borderRadius, typography, shadows } from '@/theme';
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
  const { points, level, streak } = useUserStore();
  const [showBriefing, setShowBriefing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

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

  const totalTasks = todayTasks.length + completedToday.length;
  const progressPercent = totalTasks > 0 ? (completedToday.length / totalTasks) : 0;

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
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.notificationDot, { backgroundColor: theme.colors.error }]} />
            )}
          </TouchableOpacity>
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
              {/* Add Task Button - iOS Style */}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  hapticsService.medium();
                  navigation.navigate('QuickAdd' as never);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.largeTitle, { color: theme.colors.text }]}>
            Aujourd'hui
          </Text>
        </View>

        {/* Daily Briefing */}
        {showBriefing && (
          <View style={styles.briefingContainer}>
            <DailyBriefing
              onDismiss={handleDismissBriefing}
              onTaskPress={() => navigation.navigate('TaskList' as never)}
              onFocusPress={() => navigation.navigate('FocusMode' as never)}
            />
          </View>
        )}

        {/* Progress Card */}
        {totalTasks > 0 && (
          <Card variant="elevated" padding="xl" borderRadiusSize="xxl" style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
                  Progression du jour
                </Text>
                <Text style={[styles.progressSubtitle, { color: theme.colors.textSecondary }]}>
                  {completedToday.length} sur {totalTasks} terminées
                </Text>
              </View>
            </View>

            {/* Circular Progress */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircleWrapper}>
                {/* Background circle */}
                <View
                  style={[
                    styles.progressCircleBg,
                    {
                      borderColor: theme.colors.borderLight,
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                    }
                  ]}
                />
                {/* Progress circle */}
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      opacity: progressPercent,
                    },
                  ]}
                />
                <View style={styles.progressCircleInner}>
                  <Text style={[styles.progressPercentText, { color: theme.colors.text }]}>
                    {Math.round(progressPercent * 100)}%
                  </Text>
                  <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                    complété
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

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
                <View style={[styles.emptyIcon, { backgroundColor: theme.colors.successLight }]}>
                  <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  Tout est fait !
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Vous n'avez aucune tâche pour aujourd'hui
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
                    color: theme.colors.textOnColor,
                    backgroundColor: theme.colors.orange,
                    onPress: () => handlePostponeTask(task),
                    label: 'Demain',
                  }}
                  rightAction={{
                    icon: 'trash-outline',
                    color: theme.colors.textOnColor,
                    backgroundColor: theme.colors.error,
                    onPress: () => handleDeleteTask(task.id),
                    label: 'Supprimer',
                  }}
                >
                  <Card
                    variant="elevated"
                    padding="lg"
                    borderRadiusSize="lg"
                    style={[
                      styles.taskCard,
                      index === todayTasks.length - 1 && styles.taskCardLast,
                    ]}
                    onPress={() => handleTaskPress(task)}
                  >
                    <View style={styles.taskContent}>
                      <Checkbox
                        checked={task.completed}
                        onPress={() => handleToggleTask(task.id)}
                      />
                      <View style={styles.taskInfo}>
                        <View style={styles.taskHeader}>
                          <Text
                            style={[
                              styles.taskTitle,
                              { color: theme.colors.text },
                              task.completed && styles.taskTitleCompleted,
                            ]}
                            numberOfLines={2}
                          >
                            {task.title}
                          </Text>
                          {task.priority === 'high' && (
                            <View style={[styles.priorityDot, { backgroundColor: theme.colors.error }]} />
                          )}
                        </View>

                        {task.description && (
                          <Text
                            style={[styles.taskDescription, { color: theme.colors.textTertiary }]}
                            numberOfLines={1}
                          >
                            {task.description}
                          </Text>
                        )}

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
                              <Text
                                style={[styles.metaText, { color: theme.colors.textSecondary }]}
                                numberOfLines={1}
                              >
                                {task.location.name}
                              </Text>
                            </View>
                          )}
                          {task.category && (
                            <CategoryBadge category={task.category as any} size="small" />
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
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
    paddingBottom: 70, // Space for tab bar (50px + 20px margin)
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
});
