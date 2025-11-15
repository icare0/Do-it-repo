import React, { useEffect } from 'react';
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
import { IconButton } from '@/components/ui/IconButton';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useSyncStore } from '@/store/syncStore';
import { getTheme } from '@/theme';
import { syncService } from '@/services/syncService';

export default function TodayScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, setSelectedTask } = useTaskStore();
  const { isSyncing } = useSyncStore();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.startDate &&
      format(task.startDate, 'yyyy-MM-dd') === todayStr
  ).sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return a.startDate.getTime() - b.startDate.getTime();
  });

  const completedToday = tasks.filter(
    (task) =>
      task.completed &&
      task.startDate &&
      format(task.startDate, 'yyyy-MM-dd') === todayStr
  );

  const upcomingTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.startDate &&
      task.startDate > today
  ).slice(0, 3);

  async function handleRefresh() {
    await syncService.forceSyncNow();
  }

  function handleTaskPress(task: any) {
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as never, { taskId: task.id } as never);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Aujourd'hui
          </Text>
        </View>
        <IconButton
          icon={<Ionicons name="notifications-outline" size={24} color={theme.colors.text} />}
          onPress={() => {}}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />
        }
      >
        {/* Progress Card */}
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
            <View style={styles.progressCircle}>
              <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                {todayTasks.length + completedToday.length > 0
                  ? Math.round((completedToday.length / (todayTasks.length + completedToday.length)) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tâches du jour
            </Text>
            <Badge label={todayTasks.length.toString()} variant="primary" />
          </View>

          {todayTasks.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Aucune tâche pour aujourd'hui
                </Text>
              </View>
            </Card>
          ) : (
            todayTasks.map((task) => (
              <Card key={task.id} style={styles.taskCard} onPress={() => handleTaskPress(task)}>
                <View style={styles.taskContent}>
                  <Checkbox
                    checked={task.completed}
                    onPress={() => toggleTaskCompletion(task.id)}
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
                      {task.category && (
                        <Badge label={task.category} size="small" />
                      )}
                    </View>
                  </View>
                  {task.priority === 'high' && (
                    <View style={[styles.priorityIndicator, { backgroundColor: theme.colors.error }]} />
                  )}
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              À venir
            </Text>
            {upcomingTasks.map((task) => (
              <Card key={task.id} style={styles.taskCard} onPress={() => handleTaskPress(task)}>
                <View style={styles.taskContent}>
                  <Checkbox
                    checked={task.completed}
                    onPress={() => toggleTaskCompletion(task.id)}
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, theme.shadows.lg]}
        onPress={() => navigation.navigate('QuickAdd' as never)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  progressCard: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  taskCard: {
    marginBottom: 12,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
