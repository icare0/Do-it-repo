import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';

export default function TaskListScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, toggleTaskCompletion, setSelectedTask, searchQuery, setSearchQuery } = useTaskStore();

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleTaskPress(task: any) {
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as never, { taskId: task.id } as never);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Toutes les tâches</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />}
        />
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: task }) => (
          <Card style={styles.taskCard} onPress={() => handleTaskPress(task)}>
            <View style={styles.taskContent}>
              <Checkbox checked={task.completed} onPress={() => toggleTaskCompletion(task.id)} />
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: theme.colors.text }, task.completed && styles.completed]}>
                  {task.title}
                </Text>
                {task.category && <Badge label={task.category} size="small" />}
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  taskCard: { marginBottom: 12 },
  taskContent: { flexDirection: 'row', alignItems: 'center' },
  taskInfo: { flex: 1, marginLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskTitle: { fontSize: 16, flex: 1 },
  completed: { textDecorationLine: 'line-through', opacity: 0.5 },
});
