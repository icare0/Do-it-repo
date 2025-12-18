/**
 * Learning System
 * Continuous learning from user feedback and corrections
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserCorrection,
  LearnedPattern,
  AccuracyMetrics,
  AnalyticsData,
  ParsedResult,
  TrainingExample
} from './types';
import { intentClassifier } from './intentClassifier';

const CORRECTIONS_STORAGE_KEY = '@ai_corrections';
const PATTERNS_STORAGE_KEY = '@ai_learned_patterns';
const METRICS_STORAGE_KEY = '@ai_metrics';

export class LearningSystem {
  private corrections: Map<string, UserCorrection> = new Map();
  private learnedPatterns: Map<string, LearnedPattern> = new Map();
  private accuracyHistory: Array<{ date: Date; accuracy: number }> = [];
  private isInitialized = false;

  /**
   * Initialize learning system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📚 Initializing Learning System...');

    try {
      await this.loadCorrections();
      await this.loadLearnedPatterns();
      await this.loadMetrics();

      this.isInitialized = true;
      console.log('✅ Learning System initialized');
      console.log(`  Corrections: ${this.corrections.size}`);
      console.log(`  Learned patterns: ${this.learnedPatterns.size}`);
    } catch (error) {
      console.error('Error initializing learning system:', error);
    }
  }

  /**
   * Record a correction from the user
   */
  async recordCorrection(correction: UserCorrection): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`📝 Recording correction for: "${correction.originalInput}"`);

    // Save correction
    const key = `${correction.taskId}_${Date.now()}`;
    this.corrections.set(key, correction);

    // Extract patterns from correction
    const patterns = this.extractPatternsFromCorrection(correction);
    for (const pattern of patterns) {
      await this.addLearnedPattern(pattern);
    }

    // Update intent classifier if intent was corrected
    if (correction.correctIntent && correction.correctIntent !== correction.parsedResult.intent) {
      await intentClassifier.learnFromFeedback(
        correction.originalInput,
        correction.correctIntent
      );
    }

    // Update accuracy metrics
    await this.updateMetrics(correction);

    // Save to storage
    await this.saveCorrections();
    await this.saveLearnedPatterns();
    await this.saveMetrics();

    console.log('✅ Correction recorded and learned');
  }

  /**
   * Extract learnable patterns from a correction
   */
  private extractPatternsFromCorrection(correction: UserCorrection): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const input = correction.originalInput.toLowerCase();

    // 1. Location pattern
    if (correction.correctLocation && correction.correctLocation !== correction.parsedResult.location) {
      // Check if there's a generic term we can learn
      const genericTerms = ['salle', 'gym', 'magasin', 'supermarché', 'resto', 'restaurant', 'bar', 'café'];

      for (const term of genericTerms) {
        if (input.includes(term)) {
          patterns.push({
            key: term,
            type: 'location',
            replacement: correction.correctLocation,
            confidence: 1.0,
            usageCount: 1,
            lastUsed: new Date(),
            userId: correction.parsedResult.originalInput
          });
          console.log(`🎓 Learned: "${term}" → "${correction.correctLocation.name}"`);
        }
      }
    }

    // 2. Time flexibility pattern
    if (correction.correctHasSpecificTime !== undefined &&
        correction.correctHasSpecificTime !== correction.parsedResult.hasSpecificTime) {

      const timeKeywords = ['matin', 'soir', 'après-midi', 'aprèm'];
      for (const keyword of timeKeywords) {
        if (input.includes(keyword)) {
          patterns.push({
            key: `time_${keyword}`,
            type: 'temporal',
            hasSpecificTime: correction.correctHasSpecificTime,
            suggestedTimeSlot: correction.correctSuggestedTimeSlot,
            confidence: 1.0,
            usageCount: 1,
            lastUsed: new Date()
          });
          console.log(`🎓 Learned time flexibility for: "${keyword}"`);
        }
      }
    }

    // 3. Category pattern
    if (correction.correctCategory && correction.correctCategory !== correction.parsedResult.category) {
      // Extract keywords from input that might indicate category
      const words = input.split(/\s+/).filter(w => w.length > 3);

      for (const word of words) {
        // Create a pattern for this word → category mapping
        patterns.push({
          key: `category_${word}`,
          type: 'category',
          replacement: correction.correctCategory,
          confidence: 0.8, // Lower confidence as it might be context-dependent
          usageCount: 1,
          lastUsed: new Date()
        });
      }
    }

    // 4. Priority pattern
    if (correction.correctPriority && correction.correctPriority !== correction.parsedResult.priority) {
      const words = input.split(/\s+/);

      for (const word of words) {
        if (word.length > 3) {
          patterns.push({
            key: `priority_${word}`,
            type: 'priority',
            replacement: correction.correctPriority,
            confidence: 0.7,
            usageCount: 1,
            lastUsed: new Date()
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Add or update a learned pattern
   */
  private async addLearnedPattern(pattern: LearnedPattern): Promise<void> {
    const existing = this.learnedPatterns.get(pattern.key);

    if (existing) {
      // Update existing pattern
      existing.usageCount++;
      existing.lastUsed = new Date();
      existing.confidence = Math.min(1.0, existing.confidence + 0.1); // Increase confidence

      // Merge replacement data
      if (pattern.replacement) existing.replacement = pattern.replacement;
      if (pattern.hasSpecificTime !== undefined) existing.hasSpecificTime = pattern.hasSpecificTime;
      if (pattern.suggestedTimeSlot) existing.suggestedTimeSlot = pattern.suggestedTimeSlot;
    } else {
      // Add new pattern
      this.learnedPatterns.set(pattern.key, pattern);
    }
  }

  /**
   * Get learned pattern by key
   */
  getLearnedPattern(key: string): LearnedPattern | undefined {
    return this.learnedPatterns.get(key);
  }

  /**
   * Get all learned patterns
   */
  getAllLearnedPatterns(): LearnedPattern[] {
    return Array.from(this.learnedPatterns.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Apply learned patterns to parsed result
   */
  applyLearnedPatterns(input: string, parsedResult: ParsedResult): ParsedResult {
    const lowerInput = input.toLowerCase();
    let modified = false;

    // Apply location patterns
    for (const [key, pattern] of this.learnedPatterns) {
      if (pattern.type === 'location' && lowerInput.includes(key)) {
        if (pattern.replacement && !parsedResult.location) {
          parsedResult.location = pattern.replacement as any;
          pattern.usageCount++;
          pattern.lastUsed = new Date();
          modified = true;
          console.log(`🎯 Applied learned pattern: "${key}" → location`);
        }
      }

      // Apply temporal patterns
      if (pattern.type === 'temporal' && lowerInput.includes(key.replace('time_', ''))) {
        if (pattern.hasSpecificTime !== undefined) {
          parsedResult.hasSpecificTime = pattern.hasSpecificTime;
          if (pattern.suggestedTimeSlot) {
            parsedResult.suggestedTimeSlot = pattern.suggestedTimeSlot;
          }
          pattern.usageCount++;
          pattern.lastUsed = new Date();
          modified = true;
          console.log(`🎯 Applied learned pattern: "${key}" → time flexibility`);
        }
      }

      // Apply category patterns
      if (pattern.type === 'category' && lowerInput.includes(key.replace('category_', ''))) {
        if (pattern.replacement && !parsedResult.category && pattern.usageCount >= 2) {
          // Only apply if seen at least twice (more confident)
          parsedResult.category = pattern.replacement as string;
          pattern.usageCount++;
          pattern.lastUsed = new Date();
          modified = true;
        }
      }

      // Apply priority patterns
      if (pattern.type === 'priority' && lowerInput.includes(key.replace('priority_', ''))) {
        if (pattern.replacement && pattern.usageCount >= 3) {
          // Only apply if seen at least 3 times
          parsedResult.priority = pattern.replacement as any;
          pattern.usageCount++;
          pattern.lastUsed = new Date();
          modified = true;
        }
      }
    }

    if (modified) {
      // Increase confidence slightly when learned patterns are applied
      parsedResult.confidence = Math.min(1.0, parsedResult.confidence + 0.05);
    }

    return parsedResult;
  }

  /**
   * Delete a learned pattern
   */
  async deletePattern(key: string): Promise<void> {
    this.learnedPatterns.delete(key);
    await this.saveLearnedPatterns();
    console.log(`🗑️ Deleted learned pattern: ${key}`);
  }

  /**
   * Update accuracy metrics
   */
  private async updateMetrics(correction: UserCorrection): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have metrics for today
    const todayMetrics = this.accuracyHistory.find(
      m => m.date.getTime() === today.getTime()
    );

    if (todayMetrics) {
      // Recalculate accuracy
      const accuracy = this.calculateCurrentAccuracy();
      todayMetrics.accuracy = accuracy;
    } else {
      // Add new entry
      const accuracy = this.calculateCurrentAccuracy();
      this.accuracyHistory.push({
        date: today,
        accuracy
      });
    }

    // Keep only last 30 days
    if (this.accuracyHistory.length > 30) {
      this.accuracyHistory = this.accuracyHistory.slice(-30);
    }
  }

  /**
   * Calculate current accuracy metrics
   */
  private calculateCurrentAccuracy(): number {
    if (this.corrections.size === 0) return 0;

    let correct = 0;
    let total = 0;

    this.corrections.forEach(correction => {
      total++;

      // Count as correct if user didn't make changes
      if (!correction.changed) {
        correct++;
      }
    });

    return total > 0 ? correct / total : 0;
  }

  /**
   * Get detailed accuracy metrics
   */
  getAccuracyMetrics(): AccuracyMetrics {
    if (this.corrections.size === 0) {
      return {
        overallAccuracy: 0,
        intentAccuracy: 0,
        temporalAccuracy: 0,
        locationAccuracy: 0,
        categoryAccuracy: 0,
        priorityAccuracy: 0,
        totalPredictions: 0,
        totalCorrections: 0,
        learningRate: 0
      };
    }

    let totalCorrect = 0;
    let intentCorrect = 0;
    let temporalCorrect = 0;
    let locationCorrect = 0;
    let categoryCorrect = 0;
    let priorityCorrect = 0;
    let total = 0;
    let totalChanged = 0;

    this.corrections.forEach(correction => {
      total++;

      if (correction.changed) {
        totalChanged++;
      } else {
        totalCorrect++;
      }

      if (correction.intentCorrect !== false) intentCorrect++;
      if (correction.temporalCorrect !== false) temporalCorrect++;
      if (correction.locationCorrect !== false) locationCorrect++;

      // Assume category and priority are correct if not explicitly wrong
      categoryCorrect++;
      priorityCorrect++;
    });

    // Calculate learning rate (improvement over time)
    const learningRate = this.calculateLearningRate();

    return {
      overallAccuracy: total > 0 ? totalCorrect / total : 0,
      intentAccuracy: total > 0 ? intentCorrect / total : 0,
      temporalAccuracy: total > 0 ? temporalCorrect / total : 0,
      locationAccuracy: total > 0 ? locationCorrect / total : 0,
      categoryAccuracy: total > 0 ? categoryCorrect / total : 0,
      priorityAccuracy: total > 0 ? priorityCorrect / total : 0,
      totalPredictions: total,
      totalCorrections: totalChanged,
      learningRate
    };
  }

  /**
   * Calculate learning rate (how fast the AI improves)
   */
  private calculateLearningRate(): number {
    if (this.accuracyHistory.length < 2) return 0;

    // Compare first week vs last week
    const recent = this.accuracyHistory.slice(-7);
    const old = this.accuracyHistory.slice(0, 7);

    const recentAvg = recent.reduce((sum, m) => sum + m.accuracy, 0) / recent.length;
    const oldAvg = old.reduce((sum, m) => sum + m.accuracy, 0) / old.length;

    return recentAvg - oldAvg; // Positive = improving, Negative = getting worse
  }

  /**
   * Get analytics data
   */
  getAnalyticsData(): AnalyticsData {
    const recentPredictions = Array.from(this.corrections.values())
      .slice(-50) // Last 50
      .map(correction => ({
        input: correction.originalInput,
        prediction: correction.parsedResult,
        wasCorrect: !correction.changed,
        timestamp: correction.timestamp
      }));

    return {
      metrics: this.getAccuracyMetrics(),
      recentPredictions,
      learnedPatterns: this.getAllLearnedPatterns(),
      improvementOverTime: this.accuracyHistory.map(h => ({
        date: h.date,
        accuracy: h.accuracy
      }))
    };
  }

  /**
   * Get training examples from corrections
   */
  getTrainingExamplesFromCorrections(): TrainingExample[] {
    const examples: TrainingExample[] = [];

    this.corrections.forEach(correction => {
      if (correction.correctIntent) {
        examples.push({
          text: correction.originalInput,
          intent: correction.correctIntent,
          category: correction.correctCategory,
          priority: correction.correctPriority,
          hasSpecificTime: correction.correctHasSpecificTime
        });
      }
    });

    return examples;
  }

  /**
   * Clear old corrections (older than 90 days)
   */
  async cleanupOldCorrections(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let removed = 0;

    this.corrections.forEach((correction, key) => {
      if (correction.timestamp < ninetyDaysAgo) {
        this.corrections.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      await this.saveCorrections();
      console.log(`🧹 Cleaned up ${removed} old corrections`);
    }
  }

  // ==========================================
  // STORAGE METHODS
  // ==========================================

  private async loadCorrections(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CORRECTIONS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.corrections = new Map(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            { ...v, timestamp: new Date(v.timestamp) }
          ])
        );
      }
    } catch (error) {
      console.error('Error loading corrections:', error);
    }
  }

  private async saveCorrections(): Promise<void> {
    try {
      const data = Object.fromEntries(this.corrections);
      await AsyncStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving corrections:', error);
    }
  }

  private async loadLearnedPatterns(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PATTERNS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.learnedPatterns = new Map(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            { ...v, lastUsed: new Date(v.lastUsed) }
          ])
        );
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
  }

  private async saveLearnedPatterns(): Promise<void> {
    try {
      const data = Object.fromEntries(this.learnedPatterns);
      await AsyncStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving patterns:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.accuracyHistory = data.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }));
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(this.accuracyHistory));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  /**
   * Reset all learning data
   */
  async reset(): Promise<void> {
    this.corrections.clear();
    this.learnedPatterns.clear();
    this.accuracyHistory = [];

    await AsyncStorage.removeItem(CORRECTIONS_STORAGE_KEY);
    await AsyncStorage.removeItem(PATTERNS_STORAGE_KEY);
    await AsyncStorage.removeItem(METRICS_STORAGE_KEY);

    console.log('🔄 Learning System reset');
  }
}

// Singleton instance
export const learningSystem = new LearningSystem();
