import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, updateTask, deleteTask } = useTaskStore();

  const taskId = (route.params as any)?.taskId;
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return null;
  }

  async function handleDelete() {
    Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await database.write(async () => {
            const dbTask = await database.get<TaskModel>('tasks').find(task.id);
            await dbTask.markAsDeleted();
          });
          await syncService.addToSyncQueue('task', task.id, 'delete', {});
          deleteTask(task.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={theme.colors.text} />}
          onPress={() => navigation.goBack()}
        />
        <IconButton
          icon={<Ionicons name="trash-outline" size={24} color={theme.colors.error} />}
          onPress={handleDelete}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>

        {task.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {task.description}
          </Text>
        )}

        <View style={styles.details}>
          {task.category && (
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} />
              <Badge label={task.category} />
            </View>
          )}

          {task.priority && (
            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={20} color={theme.colors.textSecondary} />
              <Badge label={task.priority} variant={task.priority === 'high' ? 'error' : 'default'} />
            </View>
          )}

          {task.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>
                {task.location.name}
              </Text>
            </View>
          )}
        </View>

        <Button
          title={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
          onPress={() => updateTask(task.id, { completed: !task.completed })}
          variant="outline"
          fullWidth
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  content: { paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  description: { fontSize: 16, marginBottom: 24 },
  details: { gap: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { fontSize: 16 },
});
