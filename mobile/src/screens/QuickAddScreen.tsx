import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/theme';
import { nlpService } from '@/services/nlpService';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

export default function QuickAddScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();

  const [input, setInput] = useState('');
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (input.length > 3) {
      const parsed = nlpService.parseQuickAdd(input);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  }, [input]);

  async function handleCreate() {
    if (!input.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une tâche');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);

      const taskData = parsedTask || { title: input };

      // Create task in local database
      await database.write(async () => {
        const newTask = await database.get<TaskModel>('tasks').create((task) => {
          task.userId = user.id;
          task.title = taskData.title;
          task.priority = taskData.priority || 'medium';
          task.completed = false;
          task.category = taskData.category;

          if (taskData.date) {
            task.startDate = taskData.date;
          }

          if (taskData.duration) {
            task.duration = taskData.duration;
          }
        });

        // Add to store
        addTask({
          id: newTask.id,
          userId: user.id,
          title: taskData.title,
          completed: false,
          priority: taskData.priority || 'medium',
          category: taskData.category,
          startDate: taskData.date,
          duration: taskData.duration,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Add to sync queue
        await syncService.addToSyncQueue('task', newTask.id, 'create', {
          userId: user.id,
          title: taskData.title,
          priority: taskData.priority || 'medium',
          category: taskData.category,
          startDate: taskData.date,
          duration: taskData.duration,
        });
      });

      navigation.goBack();
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Nouvelle tâche
        </Text>
        <IconButton
          icon={<Ionicons name="close" size={24} color={theme.colors.text} />}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Ex: Appeler Paul demain à 14h #travail"
            placeholderTextColor={theme.colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            autoFocus
          />
        </View>

        {/* NLP Parsing Result */}
        {parsedTask && (
          <View style={styles.parseResult}>
            <Text style={[styles.parseTitle, { color: theme.colors.textSecondary }]}>
              Détecté automatiquement :
            </Text>

            <View style={styles.parseItems}>
              {parsedTask.title && (
                <View style={styles.parseItem}>
                  <Ionicons name="text-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.parseLabel, { color: theme.colors.text }]}>
                    {parsedTask.title}
                  </Text>
                </View>
              )}

              {parsedTask.date && (
                <View style={styles.parseItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.parseLabel, { color: theme.colors.text }]}>
                    {format(parsedTask.date, "dd MMM 'à' HH:mm", { locale: fr })}
                  </Text>
                </View>
              )}

              {parsedTask.category && (
                <Badge label={parsedTask.category} variant="primary" />
              )}

              {parsedTask.priority && parsedTask.priority !== 'medium' && (
                <Badge
                  label={parsedTask.priority === 'high' ? 'Priorité haute' : 'Priorité basse'}
                  variant={parsedTask.priority === 'high' ? 'error' : 'default'}
                />
              )}

              {parsedTask.duration && (
                <View style={styles.parseItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.parseLabel, { color: theme.colors.text }]}>
                    {parsedTask.duration} min
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
            Exemples de saisie rapide :
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            • "Réunion demain à 15h"
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            • "Acheter du lait #courses"
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            • "Call important client urgent"
          </Text>
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            • "Gym session 1h #sport"
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button
          title="Créer la tâche"
          onPress={handleCreate}
          loading={loading}
          disabled={!input.trim()}
          fullWidth
        />
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  parseResult: {
    marginBottom: 24,
  },
  parseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  parseItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  parseLabel: {
    fontSize: 14,
  },
  helpSection: {
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
