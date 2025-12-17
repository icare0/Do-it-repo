/**
 * Enhanced QuickAddScreen with Custom AI Engine
 * Uses the new AI Engine for intelligent task comprehension
 */

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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { SmartPromptModal } from '@/components/SmartPromptModal';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/theme';
import { aiEngine, ParsedResult } from '@/services/aiEngine';
import { smartTaskService } from '@/services/smartTaskService';
import { notificationService } from '@/services/notificationService';
import { database, TaskModel } from '@/database';
import { syncService } from '@/services/syncService';

export default function QuickAddScreenEnhanced() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();

  const [input, setInput] = useState((route.params as any)?.prefillText || '');
  const [parsedTask, setParsedTask] = useState<ParsedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showSmartPrompt, setShowSmartPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  const [aiInitialized, setAiInitialized] = useState(false);

  // Initialize AI Engine on mount
  useEffect(() => {
    aiEngine.initialize().then(() => {
      setAiInitialized(true);
      console.log('✅ AI Engine ready for QuickAdd');
    }).catch(err => {
      console.error('Failed to initialize AI Engine:', err);
      Alert.alert('Erreur', "L'IA n'a pas pu être initialisée. Les fonctionnalités de base restent disponibles.");
    });
  }, []);

  // Parse input with AI Engine
  useEffect(() => {
    if (input.length > 2 && aiInitialized) {
      parseWithAI();
    } else {
      setParsedTask(null);
    }
  }, [input, aiInitialized]);

  async function parseWithAI() {
    setParsing(true);
    try {
      const result = await aiEngine.parseTask(input, {
        userId: user!.id,
        userHabits: undefined, // TODO: Get from habit learning service
        currentTime: new Date()
      });

      setParsedTask(result);
    } catch (error) {
      console.error('Error parsing with AI:', error);
      // Fallback to basic parsing
      setParsedTask({
        title: input,
        originalInput: input,
        confidence: 0.3,
        hasSpecificTime: false,
        priority: 'medium'
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleCreate() {
    if (!input.trim()) return;
    if (!user) return;

    // Check for smart prompts (like location clarification)
    const smartPrompt = smartTaskService.detectSmartPrompt(input);
    if (smartPrompt && parsedTask && !parsedTask.location) {
      setCurrentPrompt(smartPrompt);
      setShowSmartPrompt(true);
      return;
    }

    await createTask();
  }

  async function handleSmartPromptSubmit(answer: string) {
    if (currentPrompt && parsedTask) {
      if (!currentPrompt.alwaysAsk) {
        await smartTaskService.saveEnrichment(currentPrompt.contextKey, answer);
      }

      // Add location to parsed task
      if (!parsedTask.location) {
        parsedTask.location = { name: answer };
      }
    }

    setShowSmartPrompt(false);
    setCurrentPrompt(null);
    await createTask();
  }

  async function createTask() {
    try {
      setLoading(true);

      if (!parsedTask) {
        Alert.alert('Erreur', 'Impossible de créer la tâche');
        return;
      }

      // Create task in database
      const newTask = await database.write(async () => {
        return await database.get<TaskModel>('tasks').create((task) => {
          task.userId = user!.id;
          task.title = parsedTask.title;
          task.priority = parsedTask.priority || 'medium';
          task.completed = false;

          // Core fields
          if (parsedTask.category) task.category = parsedTask.category;
          if (parsedTask.date) task.startDate = parsedTask.date;
          if (parsedTask.endDate) task.endDate = parsedTask.endDate;
          if (parsedTask.duration) task.duration = parsedTask.duration;
          if (parsedTask.location) task.location = parsedTask.location as any;

          // 🆕 AI Engine fields
          task.hasSpecificTime = parsedTask.hasSpecificTime;
          if (parsedTask.timeOfDay) task.timeOfDay = parsedTask.timeOfDay;
          if (parsedTask.suggestedTimeSlot) task.suggestedTimeSlot = parsedTask.suggestedTimeSlot;
          if (parsedTask.deadline) task.deadline = parsedTask.deadline;
          task.originalInput = input; // Save original for learning
          task.parsingConfidence = parsedTask.confidence;
          if (parsedTask.intent) task.detectedIntent = parsedTask.intent;

          if (parsedTask.recurringPattern) {
            task.recurringPattern = parsedTask.recurringPattern as any;
          }
        });
      });

      // Add to store
      addTask({
        id: newTask.id,
        userId: user!.id,
        title: parsedTask.title,
        completed: false,
        priority: parsedTask.priority || 'medium',
        category: parsedTask.category,
        startDate: parsedTask.date,
        endDate: parsedTask.endDate,
        duration: parsedTask.duration,
        location: parsedTask.location as any,
        recurringPattern: parsedTask.recurringPattern as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        // AI fields
        hasSpecificTime: parsedTask.hasSpecificTime,
        timeOfDay: parsedTask.timeOfDay,
        suggestedTimeSlot: parsedTask.suggestedTimeSlot,
        deadline: parsedTask.deadline,
        originalInput: input,
        parsingConfidence: parsedTask.confidence,
        detectedIntent: parsedTask.intent
      } as any);

      // Sync
      await syncService.addToSyncQueue('task', newTask.id, 'create', newTask._raw);

      // Learn from task
      await smartTaskService.learnFromTask(newTask._raw as any);

      // Schedule notification if needed
      if (parsedTask.date && parsedTask.hasSpecificTime) {
        await notificationService.scheduleTaskNotification({
          id: newTask.id,
          title: parsedTask.title,
          startDate: parsedTask.date,
          minutesBefore: 15,
        });
      }

      console.log('✅ Task created with AI understanding:', newTask._raw);
      navigation.goBack();

    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } finally {
      setLoading(false);
    }
  }

  const QuickChip = ({ label, icon, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.quickChip, { backgroundColor: theme.colors.surfaceSecondary }]}
    >
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      <Text style={[styles.quickChipText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nouvelle tâche</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            {/* Input */}
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Qu'avez-vous en tête ?"
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              autoFocus
            />

            {/* AI Parsing Indicator */}
            {parsing && (
              <View style={styles.parsingIndicator}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.parsingText, { color: theme.colors.textSecondary }]}>
                  L'IA analyse...
                </Text>
              </View>
            )}

            {/* Parsed Information */}
            {parsedTask && !parsing && (
              <View style={styles.detectedContainer}>
                {/* Date chip */}
                {parsedTask.date && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                    <Text style={[styles.detectedText, { color: theme.colors.primary }]}>
                      {parsedTask.hasSpecificTime
                        ? format(parsedTask.date, 'd MMM HH:mm', { locale: fr })
                        : format(parsedTask.date, 'd MMM', { locale: fr }) + ' (journée)'}
                    </Text>
                  </View>
                )}

                {/* Time of day chip */}
                {parsedTask.timeOfDay && !parsedTask.hasSpecificTime && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Ionicons
                      name={
                        parsedTask.timeOfDay === 'morning' ? 'sunny' :
                        parsedTask.timeOfDay === 'afternoon' ? 'partly-sunny' :
                        parsedTask.timeOfDay === 'evening' ? 'moon' : 'moon-outline'
                      }
                      size={14}
                      color={theme.colors.secondary}
                    />
                    <Text style={[styles.detectedText, { color: theme.colors.secondary }]}>
                      {parsedTask.timeOfDay === 'morning' && 'Matin'}
                      {parsedTask.timeOfDay === 'afternoon' && 'Après-midi'}
                      {parsedTask.timeOfDay === 'evening' && 'Soir'}
                      {parsedTask.timeOfDay === 'night' && 'Nuit'}
                    </Text>
                  </View>
                )}

                {/* Priority chip */}
                {parsedTask.priority === 'high' && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.error + '15' }]}>
                    <Ionicons name="flag" size={14} color={theme.colors.error} />
                    <Text style={[styles.detectedText, { color: theme.colors.error }]}>Urgent</Text>
                  </View>
                )}

                {/* Category chip */}
                {parsedTask.category && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.accent + '15' }]}>
                    <Ionicons name="folder" size={14} color={theme.colors.accent} />
                    <Text style={[styles.detectedText, { color: theme.colors.accent }]}>
                      {parsedTask.category}
                    </Text>
                  </View>
                )}

                {/* Intent chip */}
                {parsedTask.intent && (
                  <View style={[styles.detectedChip, { backgroundColor: theme.colors.success + '15' }]}>
                    <Ionicons name="bulb" size={14} color={theme.colors.success} />
                    <Text style={[styles.detectedText, { color: theme.colors.success }]}>
                      {parsedTask.intent}
                    </Text>
                  </View>
                )}

                {/* Confidence indicator */}
                {parsedTask.confidence !== undefined && (
                  <View style={styles.confidenceContainer}>
                    <Text style={[styles.confidenceText, { color: theme.colors.textTertiary }]}>
                      Confiance: {(parsedTask.confidence * 100).toFixed(0)}%
                    </Text>
                    {parsedTask.confidence < 0.7 && (
                      <Ionicons name="help-circle" size={16} color={theme.colors.warning} />
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Quick Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsLabel, { color: theme.colors.textTertiary }]}>
                SUGGESTIONS RAPIDES
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                <QuickChip label="Demain matin" icon="sunny-outline" onPress={() => setInput(input + ' demain matin')} />
                <QuickChip label="Ce weekend" icon="cafe-outline" onPress={() => setInput(input + ' samedi')} />
                <QuickChip label="Urgent" icon="flag-outline" onPress={() => setInput(input + ' urgent')} />
                <QuickChip label="Perso" icon="person-outline" onPress={() => setInput(input + ' #perso')} />
                <QuickChip label="Travail" icon="briefcase-outline" onPress={() => setInput(input + ' #travail')} />
              </ScrollView>
            </View>
          </View>

          {/* Create Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              title={loading ? "Création..." : "Créer la tâche"}
              onPress={handleCreate}
              disabled={!input.trim() || loading || parsing}
              fullWidth
              size="large"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* AI Active Indicator */}
      {parsedTask && !parsing && aiInitialized && (
        <View style={[styles.magicIndicator, { top: insets.top + 16 }]}>
          <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
          <Text style={[styles.magicText, { color: theme.colors.primary }]}>IA Active</Text>
        </View>
      )}

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
  parsingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  parsingText: {
    fontSize: 14,
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detectedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  confidenceText: {
    fontSize: 12,
  },
  suggestionsContainer: {
    marginTop: 24,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  suggestionsScroll: {
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickChipText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  magicIndicator: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  magicText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
