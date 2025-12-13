import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isAfter, startOfTomorrow } from 'date-fns';

import { PremiumTaskItem } from '@/components/PremiumTaskItem';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { AnimatedFAB } from '@/components/ui/AnimatedFAB';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { getTheme, shadows, layout, spacing } from '@/theme';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';
import { hapticsService } from '@/services/hapticsService';

const { width } = Dimensions.get('window');

export default function TaskListScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, deleteTask, setSelectedTask, searchQuery, setSearchQuery, filter, setFilter } = useTaskStore();
  const { points } = useUserStore();

  const [activeTab, setActiveTab] = useState(filter);

  // Contextual empty state message
  const getEmptyMessage = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    if (searchQuery) {
      return { icon: 'search-outline', title: 'Aucun résultat', subtitle: 'Essayez un autre terme de recherche' };
    }

    if (filter === 'completed') {
      return { icon: 'trophy-outline', title: 'Pas encore de victoire', subtitle: 'Termine une tâche pour débloquer cet onglet !' };
    }

    if (filter === 'today') {
      if (hour < 12) {
        return { icon: 'sunny-outline', title: 'Journée dégagée !', subtitle: 'Profite de ce moment pour planifier 🌅' };
      } else if (hour < 18) {
        return { icon: 'partly-sunny-outline', title: 'Après-midi tranquille', subtitle: 'Parfait pour se reposer un peu ☕' };
      } else {
        return { icon: 'moon-outline', title: 'Soirée libre !', subtitle: 'Time to chill 😎' };
      }
    }

    if (filter === 'upcoming') {
      return { icon: 'calendar-outline', title: 'Rien à l\'horizon', subtitle: 'Planifie tes prochaines tâches !' };
    }

    // Default for 'all'
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { icon: 'beer-outline', title: 'Weekend mode activé !', subtitle: 'Profite de ton temps libre 🌴' };
    }

    return { icon: 'leaf-outline', title: 'Prêt à conquérir le monde ?', subtitle: 'Ajoute ta première tâche ! 🚀' };
  };

  // Sync local tab state with store filter
  useEffect(() => {
    setActiveTab(filter);
  }, [filter]);

  const handleTabPress = (newFilter: typeof filter) => {
    setActiveTab(newFilter);
    setFilter(newFilter);
  };

  const filteredTasks = tasks.filter(task => {
    // 1. Search Filter
    if (!task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Tab Filter
    switch (filter) {
      case 'today':
        if (task.completed || !task.startDate) return false;
        return format(new Date(task.startDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

      case 'upcoming':
        if (task.completed || !task.startDate) return false;
        return isAfter(new Date(task.startDate), startOfTomorrow());

      case 'completed':
        return task.completed;

      case 'all':
      default:
        // Show all active tasks (pending)
        return !task.completed;
    }
  });

  const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high');

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

  function handleTaskPress(task: any) {
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as never, { taskId: task.id } as never);
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Bon retour,</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mon Tableau de Bord</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher une tâche..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Focus Section (Only visible if there are high priority tasks and filter is 'all') */}
      {filter === 'all' && !searchQuery && highPriorityTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.focusSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎯 Focus Prioritaire</Text>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.countText}>{highPriorityTasks.length}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusList}>
            {highPriorityTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => handleTaskPress(task)}
                style={[styles.focusCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={[styles.focusStrip, { backgroundColor: theme.colors.error }]} />
                <Text style={[styles.focusTitle, { color: theme.colors.text }]} numberOfLines={2}>{task.title}</Text>
                <View style={styles.focusMeta}>
                  <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.focusTime, { color: theme.colors.textSecondary }]}>Aujourd'hui</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Custom Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {['all', 'today', 'upcoming', 'completed'].map((tab) => {
            const isActive = activeTab === tab;
            const label = {
              all: 'Tout',
              today: "Aujourd'hui",
              upcoming: 'À venir',
              completed: 'Terminé'
            }[tab];

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab as any)}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: theme.colors.text },
                  !isActive && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  isActive ? { color: theme.colors.background } : { color: theme.colors.text }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 50).springify()} layout={Layout.springify()}>
            <PremiumTaskItem
              task={item}
              onPress={handleTaskPress}
              onToggle={toggleTaskCompletion}
              onDelete={handleDeleteTask}
            />
          </Animated.View>
        )}
        ListEmptyComponent={() => {
          const emptyMsg = getEmptyMessage();
          return (
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.emptyState}
            >
              <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name={emptyMsg.icon as any} size={40} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{emptyMsg.title}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{emptyMsg.subtitle}</Text>
            </Animated.View>
          );
        }}
      />

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <AnimatedFAB
          onPress={() => navigation.navigate('QuickAdd' as never)}
          gradientColors={theme.colors.gradient.primary}
          iconColor={theme.colors.textOnColor}
          pulse={filteredTasks.length === 0 && !searchQuery}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingBottom: 16 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  greeting: { fontSize: 14, fontWeight: '600', marginBottom: 4, opacity: 0.7 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },

  focusSection: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  countBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  countText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  focusList: { paddingHorizontal: 24, gap: 12 },
  focusCard: {
    width: 140,
    height: 100,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  focusStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  focusTitle: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  focusMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  focusTime: { fontSize: 10, fontWeight: '500' },

  tabsContainer: { marginBottom: 8 },
  tabsContent: { paddingHorizontal: 24, gap: 10 },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  listContent: { paddingBottom: layout.scrollContentPaddingBottom },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: spacing.xxxl },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, fontWeight: '500', textAlign: 'center', opacity: 0.7 },

  fabContainer: {
    position: 'absolute',
    bottom: layout.fabBottomOffset,
    right: spacing.xl,
    zIndex: 100,
  },
});
