/**
 * AI Feedback Modal
 * Allows users to correct AI predictions for continuous learning
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { Button } from './ui/Button';
import { ParsedResult } from '@/services/aiEngine/types';

interface AIFeedbackModalProps {
  visible: boolean;
  originalInput: string;
  aiPrediction: ParsedResult;
  actualValues: {
    title?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    hasSpecificTime?: boolean;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    date?: Date;
    intent?: string;
  };
  onSubmitFeedback: (feedback: {
    wasCorrect: boolean;
    corrections?: Partial<ParsedResult>;
  }) => void;
  onDismiss: () => void;
}

export function AIFeedbackModal({
  visible,
  originalInput,
  aiPrediction,
  actualValues,
  onSubmitFeedback,
  onDismiss,
}: AIFeedbackModalProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const [hasChanges, setHasChanges] = useState(false);
  const [corrections, setCorrections] = useState<Partial<ParsedResult>>({});

  // Detect if user made changes
  const detectChanges = (): boolean => {
    const changes = {
      title: actualValues.title !== aiPrediction.title,
      category: actualValues.category !== aiPrediction.category,
      priority: actualValues.priority !== aiPrediction.priority,
      hasSpecificTime: actualValues.hasSpecificTime !== aiPrediction.hasSpecificTime,
      timeOfDay: actualValues.timeOfDay !== aiPrediction.timeOfDay,
      intent: actualValues.intent !== aiPrediction.intent,
      date: actualValues.date?.getTime() !== aiPrediction.date?.getTime(),
    };

    return Object.values(changes).some(changed => changed);
  };

  const handleSubmit = (wasCorrect: boolean) => {
    if (wasCorrect) {
      onSubmitFeedback({ wasCorrect: true });
    } else {
      // Build corrections object
      const correctedData: Partial<ParsedResult> = {};

      if (actualValues.title && actualValues.title !== aiPrediction.title) {
        correctedData.title = actualValues.title;
      }
      if (actualValues.category && actualValues.category !== aiPrediction.category) {
        correctedData.category = actualValues.category;
      }
      if (actualValues.priority && actualValues.priority !== aiPrediction.priority) {
        correctedData.priority = actualValues.priority;
      }
      if (actualValues.hasSpecificTime !== undefined && actualValues.hasSpecificTime !== aiPrediction.hasSpecificTime) {
        correctedData.hasSpecificTime = actualValues.hasSpecificTime;
      }
      if (actualValues.timeOfDay && actualValues.timeOfDay !== aiPrediction.timeOfDay) {
        correctedData.timeOfDay = actualValues.timeOfDay;
      }
      if (actualValues.intent && actualValues.intent !== aiPrediction.intent) {
        correctedData.intent = actualValues.intent;
      }
      if (actualValues.date && actualValues.date.getTime() !== aiPrediction.date?.getTime()) {
        correctedData.date = actualValues.date;
      }

      onSubmitFeedback({ wasCorrect: false, corrections: correctedData });
    }
    onDismiss();
  };

  const userMadeChanges = detectChanges();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Aidez l'IA à s'améliorer
            </Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Original Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                VOTRE SAISIE
              </Text>
              <View style={[styles.card, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.inputText, { color: theme.colors.text }]}>
                  "{originalInput}"
                </Text>
              </View>
            </View>

            {/* AI Prediction vs Actual */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                PRÉDICTIONS DE L'IA
              </Text>

              {userMadeChanges ? (
                <View>
                  <Text style={[styles.changesDetected, { color: theme.colors.warning }]}>
                    ⚠️ Des modifications ont été détectées
                  </Text>

                  {/* Show differences */}
                  {actualValues.category !== aiPrediction.category && (
                    <ComparisonRow
                      label="Catégorie"
                      predicted={aiPrediction.category || 'Aucune'}
                      actual={actualValues.category || 'Aucune'}
                      theme={theme}
                    />
                  )}

                  {actualValues.priority !== aiPrediction.priority && (
                    <ComparisonRow
                      label="Priorité"
                      predicted={aiPrediction.priority || 'medium'}
                      actual={actualValues.priority || 'medium'}
                      theme={theme}
                    />
                  )}

                  {actualValues.hasSpecificTime !== undefined &&
                    actualValues.hasSpecificTime !== aiPrediction.hasSpecificTime && (
                    <ComparisonRow
                      label="Heure spécifique"
                      predicted={aiPrediction.hasSpecificTime ? 'Oui' : 'Non'}
                      actual={actualValues.hasSpecificTime ? 'Oui' : 'Non'}
                      theme={theme}
                    />
                  )}

                  {actualValues.intent && actualValues.intent !== aiPrediction.intent && (
                    <ComparisonRow
                      label="Intention"
                      predicted={aiPrediction.intent || 'Aucune'}
                      actual={actualValues.intent || 'Aucune'}
                      theme={theme}
                    />
                  )}
                </View>
              ) : (
                <View style={[styles.card, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <View style={styles.correctBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text style={[styles.correctText, { color: theme.colors.success }]}>
                      Prédictions correctes
                    </Text>
                  </View>
                  <Text style={[styles.confidence, { color: theme.colors.textSecondary }]}>
                    Confiance: {(aiPrediction.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Question */}
            <View style={styles.section}>
              <Text style={[styles.question, { color: theme.colors.text }]}>
                L'IA a-t-elle bien compris votre intention ?
              </Text>
              <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
                Votre réponse aide l'IA à mieux vous comprendre la prochaine fois
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.incorrectButton, { backgroundColor: theme.colors.error + '15' }]}
              onPress={() => handleSubmit(false)}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={[styles.buttonText, { color: theme.colors.error }]}>
                Non, corrigez
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.correctButton, { backgroundColor: theme.colors.success + '15' }]}
              onPress={() => handleSubmit(true)}
            >
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.buttonText, { color: theme.colors.success }]}>
                Oui, parfait
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Helper component for showing differences
function ComparisonRow({
  label,
  predicted,
  actual,
  theme
}: {
  label: string;
  predicted: string;
  actual: string;
  theme: any;
}) {
  return (
    <View style={styles.comparisonRow}>
      <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.comparisonValues}>
        <View style={styles.comparisonValue}>
          <Text style={[styles.comparisonTag, { color: theme.colors.error }]}>IA</Text>
          <Text style={[styles.comparisonText, { color: theme.colors.text, textDecorationLine: 'line-through' }]}>
            {predicted}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={theme.colors.textTertiary} />
        <View style={styles.comparisonValue}>
          <Text style={[styles.comparisonTag, { color: theme.colors.success }]}>Vous</Text>
          <Text style={[styles.comparisonText, { color: theme.colors.text, fontWeight: '600' }]}>
            {actual}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34, // Safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  changesDetected: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  comparisonText: {
    fontSize: 14,
  },
  correctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  correctText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 13,
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  incorrectButton: {},
  correctButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
