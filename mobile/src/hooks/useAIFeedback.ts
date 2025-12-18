/**
 * useAIFeedback Hook
 * Manages AI feedback collection and learning
 */

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { aiEngine } from '@/services/aiEngine';
import { UserCorrection } from '@/services/aiEngine/types';

interface UseAIFeedbackOptions {
  task: Task;
  onFeedbackSubmitted?: () => void;
}

export function useAIFeedback({ task, onFeedbackSubmitted }: UseAIFeedbackOptions) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasAskedFeedback, setHasAskedFeedback] = useState(false);
  const initialValuesRef = useRef<Task | null>(null);
  const changesDetectedRef = useRef(false);

  // Capture initial values when task is loaded
  useEffect(() => {
    if (task && !initialValuesRef.current) {
      initialValuesRef.current = { ...task };
    }
  }, [task]);

  // Detect if task has AI prediction data
  const hasAIPrediction = Boolean(
    task.originalInput &&
    task.parsingConfidence !== undefined
  );

  // Detect if user made changes compared to AI predictions
  const detectChanges = (): boolean => {
    if (!initialValuesRef.current || !hasAIPrediction) return false;

    const initial = initialValuesRef.current;
    const current = task;

    const changes = {
      title: current.title !== initial.title,
      category: current.category !== initial.category,
      priority: current.priority !== initial.priority,
      hasSpecificTime: current.hasSpecificTime !== initial.hasSpecificTime,
      timeOfDay: current.timeOfDay !== initial.timeOfDay,
      date: current.startDate?.getTime() !== initial.startDate?.getTime(),
      intent: current.detectedIntent !== initial.detectedIntent,
    };

    return Object.values(changes).some(changed => changed);
  };

  // Check if we should ask for feedback
  const shouldAskFeedback = (): boolean => {
    if (!hasAIPrediction) return false;
    if (hasAskedFeedback) return false;
    if (task.completed) return false; // Don't ask for completed tasks

    return detectChanges();
  };

  // Trigger feedback request
  const requestFeedback = () => {
    if (shouldAskFeedback()) {
      setShowFeedbackModal(true);
      setHasAskedFeedback(true);
      changesDetectedRef.current = true;
    }
  };

  // Handle feedback submission
  const submitFeedback = async (feedback: {
    wasCorrect: boolean;
    corrections?: Partial<Task>;
  }) => {
    if (!hasAIPrediction || !initialValuesRef.current) return;

    const correction: UserCorrection = {
      taskId: task.id,
      originalInput: task.originalInput!,
      parsedResult: {
        title: initialValuesRef.current.title,
        category: initialValuesRef.current.category,
        priority: initialValuesRef.current.priority,
        hasSpecificTime: initialValuesRef.current.hasSpecificTime,
        timeOfDay: initialValuesRef.current.timeOfDay,
        suggestedTimeSlot: initialValuesRef.current.suggestedTimeSlot,
        date: initialValuesRef.current.startDate,
        intent: initialValuesRef.current.detectedIntent,
        confidence: initialValuesRef.current.parsingConfidence || 0,
        originalInput: task.originalInput!,
      },
      changed: !feedback.wasCorrect,
      timestamp: new Date(),
    };

    // Add corrected values if user made changes
    if (!feedback.wasCorrect && feedback.corrections) {
      if (feedback.corrections.category) {
        correction.correctCategory = feedback.corrections.category;
      }
      if (feedback.corrections.priority) {
        correction.correctPriority = feedback.corrections.priority;
      }
      if (feedback.corrections.hasSpecificTime !== undefined) {
        correction.correctHasSpecificTime = feedback.corrections.hasSpecificTime;
      }
      if (feedback.corrections.timeOfDay) {
        correction.timeOfDay = feedback.corrections.timeOfDay;
      }
      if (feedback.corrections.detectedIntent) {
        correction.correctIntent = feedback.corrections.detectedIntent;
      }
      if (feedback.corrections.startDate) {
        correction.correctDate = feedback.corrections.startDate;
      }
      if (feedback.corrections.suggestedTimeSlot) {
        correction.correctSuggestedTimeSlot = feedback.corrections.suggestedTimeSlot;
      }

      // Set accuracy flags
      correction.intentCorrect = feedback.corrections.detectedIntent
        ? feedback.corrections.detectedIntent === initialValuesRef.current.detectedIntent
        : true;

      correction.temporalCorrect = feedback.corrections.startDate
        ? feedback.corrections.startDate.getTime() === initialValuesRef.current.startDate?.getTime()
        : true;
    }

    // Record correction in AI Engine
    try {
      await aiEngine.recordCorrection(correction);
      console.log('✅ AI feedback recorded successfully');

      // Check if we should retrain (every 10 corrections)
      const metrics = aiEngine.getMetrics();
      if (metrics.totalCorrections > 0 && metrics.totalCorrections % 10 === 0) {
        console.log('🔄 Triggering AI retraining...');
        await aiEngine.retrain();
      }

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('❌ Error recording AI feedback:', error);
    }

    setShowFeedbackModal(false);
  };

  // Dismiss feedback modal
  const dismissFeedback = () => {
    setShowFeedbackModal(false);
  };

  return {
    showFeedbackModal,
    hasAIPrediction,
    hasChanges: detectChanges(),
    aiPrediction: initialValuesRef.current,
    currentValues: task,
    requestFeedback,
    submitFeedback,
    dismissFeedback,
  };
}
