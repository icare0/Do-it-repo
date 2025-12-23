import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { SmartPromptModal } from '@/components/SmartPromptModal';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { getTheme, spacing, borderRadius } from '@/theme';
import { nlpService } from '@/services/nlpService';
import { nlpServiceAdvanced } from '@/services/nlpServiceAdvanced';
import { predictiveSuggestionsService } from '@/services/predictiveSuggestionsService';
import { smartTaskService } from '@/services/smartTaskService';
import { notificationService } from '@/services/notificationService';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

export default function QuickAddScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();

  const [input, setInput] = useState((route.params as any)?.prefillText || '');
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSmartPrompt, setShowSmartPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  const [enrichedTitle, setEnrichedTitle] = useState('');

  useEffect(() => {
    if (input.length > 2) {
      // Utiliser le service NLP avancé
      const parsed = nlpServiceAdvanced.parseAdvanced(input);
      const { enrichedTitle: autoEnriched, wasEnriched } = smartTaskService.enrichTaskTitle(input);

      if (wasEnriched) {
        parsed.title = smartTaskService.enrichTaskTitle(parsed.title).enrichedTitle;
        setEnrichedTitle(autoEnriched);
      } else {
        setEnrichedTitle('');
      }
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
      setEnrichedTitle('');
    }
  }, [input]);

  async function handleCreate() {
    if (!input.trim()) return;
    if (!user) return;

    const smartPrompt = smartTaskService.detectSmartPrompt(input);
    if (smartPrompt) {
      setCurrentPrompt(smartPrompt);
      setShowSmartPrompt(true);
      return;
    }
    await createTask();
  }

  async function handleSmartPromptSubmit(answer: string) {
    if (currentPrompt) {
      if (!currentPrompt.alwaysAsk) {
        await smartTaskService.saveEnrichment(currentPrompt.contextKey, answer);
      }
      if (currentPrompt.alwaysAsk && parsedTask) {
        const regex = new RegExp(`\\b${currentPrompt.contextKey}\\b`, 'gi');
        parsedTask.title = parsedTask.title.replace(regex, answer);
      }
    }
    setShowSmartPrompt(false);
    setCurrentPrompt(null);
    await createTask();
  }

  async function createTask() {
    try {
      setLoading(true);
      const taskData = parsedTask || { title: input };

      // Vérifier les duplicatas
      const { tasks } = useTaskStore.getState();
      const todayTasks = tasks.filter(t => !t.completed);
      const duplicates = nlpServiceAdvanced.detectDuplicates(
        taskData.title,
        todayTasks.map(t => t.title)
      );

      if (duplicates.length > 0) {
        Alert.alert(
          'Tâche similaire détectée',
          `Une tâche similaire existe déjà: "${duplicates[0]}". Voulez-vous quand même créer cette tâche ?`,
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Créer quand même', onPress: () => proceedWithTaskCreation(taskData) }
          ]
        );
        return;
      }

      await proceedWithTaskCreation(taskData);
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
      setLoading(false);
    }
  }

  async function proceedWithTaskCreation(taskData: any) {
    try {
      const { enrichedTitle: finalTitle, location: enrichedLocation } =
        smartTaskService.enrichTaskTitle(taskData.title);

      taskData.title = finalTitle;
      if (enrichedLocation && !taskData.location?.latitude) {
        taskData.location = enrichedLocation;
      }

      const newTask = await database.write(async () => {
        return await database.get<TaskModel>('tasks').create((task) => {
          task.userId = user!.id;
          task.title = taskData.title;
          task.description = taskData.description || undefined;
          task.priority = taskData.priority || 'medium';
          task.completed = false;
          task.category = taskData.category;
          if (taskData.date) task.startDate = taskData.date;
          if (taskData.duration) task.duration = taskData.duration;
          if (taskData.recurringPattern) task.recurringPattern = taskData.recurringPattern;
          if (taskData.location) task.location = taskData.location;
          if (taskData.tags) task.tags = taskData.tags;
        });
      });

      addTask({
        id: newTask.id,
        userId: user!.id,
        title: taskData.title,
        description: taskData.description,
        completed: false,
        priority: taskData.priority || 'medium',
        category: taskData.category,
        startDate: taskData.date,
        duration: taskData.duration,
        recurringPattern: taskData.recurringPattern,
        location: taskData.location,
        tags: taskData.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await syncService.addToSyncQueue('task', newTask.id, 'create', newTask._raw);
      await smartTaskService.learnFromTask(newTask._raw as any);

      if (taskData.date) {
        await notificationService.scheduleTaskNotification({
          id: newTask.id,
          title: taskData.title,
          startDate: taskData.date,
          minutesBefore: 15,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } finally {
      setLoading(false);
    }
  }

  const QuickChip = ({ label, icon, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.quickChip, { backgroundColor: theme.colors.surfaceSecondary }]}>
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      <Text style={[styles.quickChipText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nouvelle tâche</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Qu'avez-vous en tête ?"
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              autoFocus
            />

            {/* Smart Detection Visualization */}
            {parsedTask && (
              <View style={styles.detectedContainer}>
                {parsedTask.date && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                    <Text style={[styles.detectedText, { color: theme.colors.primary }]}>
                      {format(parsedTask.date, 'd MMM HH:mm', { locale: fr })}
                    </Text>
                  </View>
                )}
                {parsedTask.duration && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.info + '15' }]}>
                    <Ionicons name="time" size={14} color={theme.colors.info || theme.colors.primary} />
                    <Text style={[styles.detectedText, { color: theme.colors.info || theme.colors.primary }]}>
                      {parsedTask.duration}min
                    </Text>
                  </View>
                )}
                {parsedTask.needsFocus && (
                  <View style={[styles.detectedChip, { backgroundColor: '#9333EA15' }]}>
                    <Ionicons name="flash" size={14} color="#9333EA" />
                    <Text style={[styles.detectedText, { color: '#9333EA' }]}>Focus requis</Text>
                  </View>
                )}
                {parsedTask.priority === 'high' && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.error + '15' }]}>
                    <Ionicons name="flag" size={14} color={theme.colors.error} />
                    <Text style={[styles.detectedText, { color: theme.colors.error }]}>Urgent</Text>
                  </View>
                )}
                {parsedTask.category && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Ionicons name="folder" size={14} color={theme.colors.secondary} />
                    <Text style={[styles.detectedText, { color: theme.colors.secondary }]}>{parsedTask.category}</Text>
                  </View>
                )}
                {parsedTask.description && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.success + '15' }]}>
                    <Ionicons name="document-text" size={14} color={theme.colors.success} />
                    <Text style={[styles.detectedText, { color: theme.colors.success }]}>Infos enrichies</Text>
                  </View>
                )}
              </View>
            )}

            {/* Quick Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsLabel, { color: theme.colors.textTertiary }]}>SUGGESTIONS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                <QuickChip label="Demain matin" icon="sunny-outline" onPress={() => setInput(input + ' demain 9h')} />
                <QuickChip label="Ce weekend" icon="cafe-outline" onPress={() => setInput(input + ' samedi')} />
                <QuickChip label="Urgent" icon="flag-outline" onPress={() => setInput(input + ' !urgent')} />
                <QuickChip label="Perso" icon="person-outline" onPress={() => setInput(input + ' #perso')} />
                <QuickChip label="Travail" icon="briefcase-outline" onPress={() => setInput(input + ' #travail')} />
              </ScrollView>
            </View>

          </View>

          {/* Floating Create Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              title={loading ? "Création..." : "Ajouter la tâche"}
              onPress={handleCreate}
              disabled={!input.trim() || loading}
              fullWidth
              size="large"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Parsing Help / Examples */}
      {parsedTask && (
        <View style={[styles.magicIndicator, { top: insets.top + 16 }]}>
          <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
          <Text style={[styles.magicText, { color: theme.colors.primary }]}>IA Active</Text>
        </View>
      )}

      {currentPrompt && (
        <SmartPromptModal
          visible={showSmartPrompt}
          question={currentPrompt.question}
          placeholder={currentPrompt.placeholder}
          icon={currentPrompt.icon}
          suggestions={currentPrompt.suggestions}
          onSubmit={handleSmartPromptSubmit}
          onDismiss={() => { setShowSmartPrompt(false); setCurrentPrompt(null); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  input: {
    fontSize: 24,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  detectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  detectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  detectedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 40,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  suggestionsScroll: {
    gap: 10,
    paddingRight: 24,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  magicIndicator: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  magicText: {
    fontSize: 12,
    fontWeight: '700',
  }
});
