/**
 * AI Engine - Main Orchestrator
 * Combines Pattern Engine + Intent Classifier + Learning System
 * 100% Local, 0€ cost, intelligent task understanding
 */

import { patternEngine } from './patternEngine';
import { intentClassifier } from './intentClassifier';
import { learningSystem } from './learningSystem';
import {
  ParsedResult,
  UserContext,
  UserCorrection,
  AnalyticsData,
  AccuracyMetrics
} from './types';

// Set to true for verbose debugging, false for production performance
const DEBUG_MODE = false;

export class AIEngine {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize all AI components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Avoid multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    await this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    console.log('🚀 Initializing AI Engine...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Initialize all components in parallel
      await Promise.all([
        intentClassifier.initialize(),
        learningSystem.initialize()
      ]);

      this.isInitialized = true;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ AI Engine initialized successfully!');
      console.log('   Pattern Engine: Ready');
      console.log('   Intent Classifier: Ready');
      console.log('   Learning System: Ready');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.error('❌ Error initializing AI Engine:', error);
      throw error;
    }
  }

  /**
   * Parse task from natural language input
   * Main entry point for task understanding
   */
  async parseTask(input: string, userContext?: UserContext): Promise<ParsedResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (DEBUG_MODE) {
      console.log(`\n🧠 AI Engine parsing: "${input}"`);
      console.log('─'.repeat(50));
    }

    try {
      // Step 1: Pattern-based parsing (fast, rule-based)
      if (DEBUG_MODE) console.log('1️⃣ Pattern Engine parsing...');
      let result = patternEngine.parse(input, userContext);
      if (DEBUG_MODE) console.log(`   ✓ Temporal: ${result.date ? '✓' : '✗'} | Intent: ${result.intent || '✗'}`);

      // Step 2: Intent classification with ML (if intent not found by patterns)
      if (!result.intent || result.confidence < 0.7) {
        if (DEBUG_MODE) console.log('2️⃣ Intent Classifier analyzing...');
        const intentPrediction = await intentClassifier.predict(input);
        if (DEBUG_MODE) console.log(`   ✓ Predicted: ${intentPrediction.intent} (${(intentPrediction.confidence * 100).toFixed(1)}%)`);

        // Merge ML predictions with pattern results (lowered threshold for better UX)
        if (intentPrediction.confidence > 0.4) {
          result.intent = intentPrediction.intent;

          if (!result.category) {
            result.category = intentClassifier.getCategory(intentPrediction.intent);
          }

          // Boost confidence if ML is confident
          result.confidence = Math.max(result.confidence, intentPrediction.confidence);

          // Add alternatives
          if (intentPrediction.alternatives) {
            result.alternatives = intentPrediction.alternatives.map(alt => ({
              description: `Intention alternative: ${alt.intent}`,
              confidence: alt.confidence,
              changes: { intent: alt.intent, category: intentClassifier.getCategory(alt.intent) }
            }));
          }
        }
      } else {
        if (DEBUG_MODE) console.log('2️⃣ Intent already found by patterns ✓');
      }

      // Step 3: Apply learned patterns from user corrections
      if (DEBUG_MODE) console.log('3️⃣ Applying learned patterns...');
      const patternsBefore = result.confidence;
      result = learningSystem.applyLearnedPatterns(input, result);
      if (DEBUG_MODE && result.confidence > patternsBefore) {
        console.log(`   ✓ Confidence boosted: ${(patternsBefore * 100).toFixed(1)}% → ${(result.confidence * 100).toFixed(1)}%`);
      } else if (DEBUG_MODE) {
        console.log('   ✓ No applicable patterns');
      }

      // Step 4: Enrich with context
      if (userContext) {
        if (DEBUG_MODE) console.log('4️⃣ Enriching with user context...');
        result = this.enrichWithContext(result, userContext);
      }

      if (DEBUG_MODE) {
        console.log('─'.repeat(50));
        console.log(`✅ Final result:`);
        console.log(`   Title: "${result.title}"`);
        console.log(`   Date: ${result.date ? result.date.toLocaleDateString('fr-FR') : 'None'}`);
        console.log(`   Time flexibility: ${result.hasSpecificTime ? 'Strict' : 'Flexible'}`);
        console.log(`   Intent: ${result.intent || 'None'}`);
        console.log(`   Category: ${result.category || 'None'}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log('');
      }

      return result;

    } catch (error) {
      console.error('❌ Error parsing task:', error);

      // Fallback to basic parsing
      return {
        title: input,
        originalInput: input,
        confidence: 0.3,
        hasSpecificTime: false,
        priority: 'medium'
      };
    }
  }

  /**
   * Enrich result with user context (habits, location, etc.)
   */
  private enrichWithContext(result: ParsedResult, context: UserContext): ParsedResult {
    // If no date but we have user habits, suggest based on patterns
    if (!result.date && context.userHabits?.preferredDays && result.category) {
      const preferredDay = context.userHabits.preferredDays[0];
      if (preferredDay !== undefined && DEBUG_MODE) {
        console.log(`   ✓ Suggesting day based on habits: ${preferredDay}`);
      }
    }

    // If no time slot but we have habits
    if (!result.suggestedTimeSlot && context.userHabits?.preferredHours) {
      const hours = context.userHabits.preferredHours;
      if (hours.length > 0) {
        result.suggestedTimeSlot = {
          start: Math.min(...hours),
          end: Math.max(...hours)
        };
        if (DEBUG_MODE) console.log(`   ✓ Suggested time slot: ${result.suggestedTimeSlot.start}h-${result.suggestedTimeSlot.end}h`);
      }
    }

    // If no location but we have common locations
    if (!result.location && context.userHabits?.commonLocations) {
      const locationForCategory = context.userHabits.commonLocations
        .filter(loc => loc.frequency > 3)
        .sort((a, b) => b.frequency - a.frequency)[0];

      if (locationForCategory && DEBUG_MODE) {
        console.log(`   ✓ Suggested location: ${locationForCategory.name}`);
      }
    }

    return result;
  }

  /**
   * Record user correction to improve AI
   */
  async recordCorrection(correction: UserCorrection): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n📚 Learning from correction...`);
    await learningSystem.recordCorrection(correction);
    console.log('✅ AI has learned from your feedback!\n');
  }

  /**
   * Get accuracy metrics
   */
  getMetrics(): AccuracyMetrics {
    return learningSystem.getAccuracyMetrics();
  }

  /**
   * Get full analytics data
   */
  getAnalytics(): AnalyticsData {
    return learningSystem.getAnalyticsData();
  }

  /**
   * Get all learned patterns
   */
  getLearnedPatterns() {
    return learningSystem.getAllLearnedPatterns();
  }

  /**
   * Delete a learned pattern
   */
  async deleteLearnedPattern(key: string): Promise<void> {
    await learningSystem.deletePattern(key);
  }

  /**
   * Retrain intent classifier with additional examples
   */
  async retrain(): Promise<void> {
    console.log('🔄 Retraining AI with user corrections...');

    const trainingExamples = learningSystem.getTrainingExamplesFromCorrections();

    if (trainingExamples.length === 0) {
      console.log('ℹ️ No corrections available for retraining');
      return;
    }

    await intentClassifier.retrain(trainingExamples);
    console.log(`✅ Retrained with ${trainingExamples.length} additional examples`);
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    await learningSystem.cleanupOldCorrections();
  }

  /**
   * Reset all AI data (for debugging)
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting AI Engine...');
    await Promise.all([
      intentClassifier.reset(),
      learningSystem.reset()
    ]);
    this.isInitialized = false;
    console.log('✅ AI Engine reset complete');
  }

  /**
   * Check if AI is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const aiEngine = new AIEngine();

// Export types
export * from './types';

// Export individual components for advanced usage
export {
  patternEngine,
  intentClassifier,
  learningSystem
};
