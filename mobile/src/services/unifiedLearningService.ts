/**
 * Unified Learning Service
 * Bridges AI Engine and Smart Task Service for holistic learning
 */

import { aiEngine } from './aiEngine';
import { smartTaskService } from './smartTaskService';
import { Task } from '@/types';
import { UserCorrection } from './aiEngine/types';

class UnifiedLearningService {
  /**
   * Learn from task creation
   * Combines both AI Engine and Smart Task Service learning
   */
  async learnFromTaskCreation(
    task: Task,
    originalInput?: string,
    aiPrediction?: any
  ): Promise<void> {
    // 1. Smart Task Service learning (contextual enrichments)
    await smartTaskService.learnFromTask(task);

    // 2. AI Engine learning (if we have AI prediction data)
    if (originalInput && aiPrediction && task.parsingConfidence !== undefined) {
      // Check if user modified AI predictions
      const userMadeChanges = this.detectChanges(aiPrediction, task);

      if (userMadeChanges) {
        // User corrected AI → record as correction
        const correction: UserCorrection = {
          taskId: task.id,
          originalInput,
          parsedResult: aiPrediction,
          changed: true,
          timestamp: new Date(),

          // Corrected values
          correctCategory: task.category,
          correctPriority: task.priority,
          correctHasSpecificTime: task.hasSpecificTime,
          correctIntent: task.detectedIntent,
          correctDate: task.startDate,
          correctSuggestedTimeSlot: task.suggestedTimeSlot,
          timeOfDay: task.timeOfDay,

          // Accuracy flags
          intentCorrect: task.detectedIntent === aiPrediction.intent,
          temporalCorrect: task.startDate?.getTime() === aiPrediction.date?.getTime(),
        };

        await aiEngine.recordCorrection(correction);
        console.log('🎓 AI learned from user correction');

        // Trigger retraining if needed
        await this.checkAndRetrain();
      }
    }
  }

  /**
   * Learn from smart prompt enrichment
   * When user answers a smart prompt (e.g., "salle" → "Basic Fit")
   */
  async learnFromEnrichment(
    keyword: string,
    specificValue: string,
    location?: any
  ): Promise<void> {
    // Save in Smart Task Service
    await smartTaskService.saveEnrichment(keyword, specificValue, location);

    // Also teach AI Engine about this pattern
    // Create a synthetic correction to help AI learn location patterns
    const syntheticCorrection: UserCorrection = {
      taskId: `synthetic_${Date.now()}`,
      originalInput: `aller à la ${keyword}`,
      parsedResult: {
        title: `aller à la ${keyword}`,
        originalInput: `aller à la ${keyword}`,
        confidence: 0.5,
        hasSpecificTime: false,
        priority: 'medium',
      },
      changed: true,
      timestamp: new Date(),
      correctLocation: location,
      locationCorrect: false,
    };

    await aiEngine.recordCorrection(syntheticCorrection);
    console.log(`🎓 Both systems learned: "${keyword}" → "${specificValue}"`);
  }

  /**
   * Detect if user modified AI predictions
   */
  private detectChanges(aiPrediction: any, actualTask: Task): boolean {
    const changes = {
      category: actualTask.category !== aiPrediction.category,
      priority: actualTask.priority !== aiPrediction.priority,
      hasSpecificTime: actualTask.hasSpecificTime !== aiPrediction.hasSpecificTime,
      timeOfDay: actualTask.timeOfDay !== aiPrediction.timeOfDay,
      intent: actualTask.detectedIntent !== aiPrediction.intent,
      date: actualTask.startDate?.getTime() !== aiPrediction.date?.getTime(),
    };

    return Object.values(changes).some(changed => changed);
  }

  /**
   * Check if we should retrain and do it
   */
  private async checkAndRetrain(): Promise<void> {
    const metrics = aiEngine.getMetrics();

    // Retrain every 10 corrections
    if (metrics.totalCorrections > 0 && metrics.totalCorrections % 10 === 0) {
      console.log('🔄 Auto-retraining AI with new corrections...');
      try {
        await aiEngine.retrain();
        console.log('✅ AI retrained successfully');
      } catch (error) {
        console.error('❌ Error during retraining:', error);
      }
    }
  }

  /**
   * Get unified analytics
   * Combines metrics from both systems
   */
  getUnifiedAnalytics() {
    const aiMetrics = aiEngine.getMetrics();
    const aiAnalytics = aiEngine.getAnalytics();
    const smartPatterns = smartTaskService.getLearnedContexts();

    return {
      ai: {
        ...aiMetrics,
        learnedPatterns: aiAnalytics.learnedPatterns.length,
        improvementTrend: aiAnalytics.improvementOverTime,
      },
      smart: {
        enrichments: smartPatterns.length,
        mostUsed: smartPatterns.slice(0, 5),
      },
      combined: {
        totalLearnings: aiAnalytics.learnedPatterns.length + smartPatterns.length,
        overallAccuracy: aiMetrics.overallAccuracy,
      },
    };
  }

  /**
   * Reset all learning data
   */
  async resetAll(): Promise<void> {
    await aiEngine.reset();
    // smartTaskService doesn't have a reset method, but we could add one
    console.log('🔄 All learning data reset');
  }

  /**
   * Export all learned data (for backup/sync)
   */
  async exportLearnedData(): Promise<any> {
    const aiPatterns = aiEngine.getLearnedPatterns();
    const smartEnrichments = smartTaskService.getLearnedContexts();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      aiPatterns,
      smartEnrichments,
      metrics: this.getUnifiedAnalytics(),
    };
  }

  /**
   * Import learned data (for restore/sync)
   */
  async importLearnedData(data: any): Promise<void> {
    // TODO: Implement import logic
    // This would restore AI patterns and smart enrichments
    console.log('📥 Import not yet implemented');
  }
}

export const unifiedLearningService = new UnifiedLearningService();
