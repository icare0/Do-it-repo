import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
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
import { SmartPromptModal } from '@/components/SmartPromptModal';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/theme';
import { nlpService } from '@/services/nlpService';
import { smartTaskService } from '@/services/smartTaskService';
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
  const [showSmartPrompt, setShowSmartPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  const [enrichedTitle, setEnrichedTitle] = useState('');

  useEffect(() => {
    if (input.length > 3) {
      const parsed = nlpService.parseQuickAdd(input);

      // Check if we can enrich the title automatically
      const { enrichedTitle: autoEnriched, wasEnriched } = smartTaskService.enrichTaskTitle(input);

      if (wasEnriched) {
        // Use the enriched title
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
    if (!input.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une tâche');
      return;
    }

    if (!user) return;

    // Check if we need to ask a smart question
    const smartPrompt = smartTaskService.detectSmartPrompt(input);
    if (smartPrompt) {
      setCurrentPrompt(smartPrompt);
      setShowSmartPrompt(true);
      return;
    }

    // Proceed with task creation
    await createTask();
  }

  async function handleSmartPromptSubmit(answer: string) {
    if (currentPrompt) {
      // Only save the enrichment if it's not marked as "alwaysAsk"
      if (!currentPrompt.alwaysAsk) {
        await smartTaskService.saveEnrichment(currentPrompt.contextKey, answer);

        // Show a subtle confirmation only if we're saving it
        Alert.alert('✨ Parfait !', `Je me souviendrai que "${currentPrompt.contextKey}" = "${answer}"`, [
          { text: 'OK', style: 'default' },
        ]);
      }

      // For "alwaysAsk" prompts, use the answer directly in the title
      if (currentPrompt.alwaysAsk && parsedTask) {
        // Replace the generic keyword with the specific answer
        const regex = new RegExp(`\\b${currentPrompt.contextKey}\\b`, 'gi');
        parsedTask.title = parsedTask.title.replace(regex, answer);
      }
    }

    setShowSmartPrompt(false);
    setCurrentPrompt(null);

    // Re-parse and enrich the title
    const { enrichedTitle } = smartTaskService.enrichTaskTitle(input);
    if (parsedTask && !currentPrompt?.alwaysAsk) {
      parsedTask.title = smartTaskService.enrichTaskTitle(parsedTask.title).enrichedTitle;
    }

    // Create the task
    await createTask();
  }

  async function createTask() {
    try {
      setLoading(true);

      const taskData = parsedTask || { title: input };

      // Final enrichment before saving
      const { enrichedTitle: finalTitle, location: enrichedLocation } =
        smartTaskService.enrichTaskTitle(taskData.title);

      taskData.title = finalTitle;

      // Use enriched location if available
      if (enrichedLocation && !taskData.location) {
        taskData.location = enrichedLocation;
      }

      // Create task in local database
      const newTask = await database.write(async () => {
        return await database.get<TaskModel>('tasks').create((task) => {
          task.userId = user!.id;
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

          if (taskData.recurringPattern) {
            task.recurringPattern = taskData.recurringPattern;
          }

          if (taskData.location) {
            task.location = taskData.location;
          }
        });
      });

      // Add to store
      addTask({
        id: newTask.id,
        userId: user!.id,
        title: taskData.title,
        completed: false,
        priority: taskData.priority || 'medium',
        category: taskData.category,
        startDate: taskData.date,
        duration: taskData.duration,
        recurringPattern: taskData.recurringPattern,
        location: taskData.location,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add to sync queue
      await syncService.addToSyncQueue('task', newTask.id, 'create', {
        userId: user!.id,
        title: taskData.title,
        priority: taskData.priority || 'medium',
        category: taskData.category,
        startDate: taskData.date,
        duration: taskData.duration,
        recurringPattern: taskData.recurringPattern,
        location: taskData.location,
      });

      // Learn from this task
      await smartTaskService.learnFromTask({
        id: newTask.id,
        userId: user!.id,
        title: taskData.title,
        completed: false,
        priority: taskData.priority || 'medium',
        category: taskData.category,
        startDate: taskData.date,
        duration: taskData.duration,
        recurringPattern: taskData.recurringPattern,
        location: taskData.location,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Décrivez votre tâche..."
            placeholderTextColor={theme.colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            autoFocus
          />
        </View>

        {/* Enrichment Banner */}
        {enrichedTitle && (
          <View style={[styles.enrichmentBanner, { backgroundColor: `${theme.colors.success}15`, borderColor: theme.colors.success }]}>
            <Ionicons name="sparkles" size={20} color={theme.colors.success} />
            <Text style={[styles.enrichmentText, { color: theme.colors.success }]}>
              Titre enrichi : "{enrichedTitle}"
            </Text>
          </View>
        )}

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

              {parsedTask.recurringPattern && (
                <View style={styles.parseItem}>
                  <Ionicons name="repeat-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.parseLabel, { color: theme.colors.text }]}>
                    {parsedTask.recurringPattern.frequency === 'daily' ? 'Quotidien' :
                     parsedTask.recurringPattern.frequency === 'weekly' ? 'Hebdomadaire' :
                     parsedTask.recurringPattern.frequency === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpSection}>
          <View style={[styles.helpCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.helpHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
                Saisie intelligente
              </Text>
            </View>
            <Text style={[styles.helpDescription, { color: theme.colors.textSecondary }]}>
              Décrivez simplement votre tâche. L'app apprend de vos habitudes et enrichit automatiquement vos tâches !
            </Text>

            <View style={styles.examplesContainer}>
              <View style={styles.exampleItem}>
                <View style={[styles.exampleBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="fitness" size={14} color={theme.colors.primary} />
                </View>
                <Text style={[styles.exampleText, { color: theme.colors.text }]}>
                  "Sport à la salle demain"
                </Text>
              </View>

              <View style={styles.exampleItem}>
                <View style={[styles.exampleBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="cart" size={14} color={theme.colors.primary} />
                </View>
                <Text style={[styles.exampleText, { color: theme.colors.text }]}>
                  "Acheter du pain au magasin"
                </Text>
              </View>

              <View style={styles.exampleItem}>
                <View style={[styles.exampleBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="restaurant" size={14} color={theme.colors.primary} />
                </View>
                <Text style={[styles.exampleText, { color: theme.colors.text }]}>
                  "Déjeuner au restaurant ce soir"
                </Text>
              </View>

              <View style={styles.exampleItem}>
                <View style={[styles.exampleBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="repeat" size={14} color={theme.colors.primary} />
                </View>
                <Text style={[styles.exampleText, { color: theme.colors.text }]}>
                  "Réunion équipe tous les lundis à 10h"
                </Text>
              </View>
            </View>
          </View>
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

      {/* Smart Prompt Modal */}
      {currentPrompt && (
        <SmartPromptModal
          visible={showSmartPrompt}
          question={currentPrompt.question}
          placeholder={currentPrompt.placeholder}
          icon={currentPrompt.icon}
          suggestions={currentPrompt.suggestions}
          onSubmit={handleSmartPromptSubmit}
          onDismiss={() => {
            setShowSmartPrompt(false);
            setCurrentPrompt(null);
          }}
        />
      )}
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
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  enrichmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  enrichmentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
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
    marginTop: 16,
  },
  helpCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  helpDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  examplesContainer: {
    gap: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exampleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleText: {
    fontSize: 14,
    flex: 1,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
