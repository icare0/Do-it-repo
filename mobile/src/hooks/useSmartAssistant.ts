/**
 * Hook React personnalisé pour le Smart Assistant
 * Simplifie l'utilisation dans les composants
 */

import { useEffect, useState, useCallback } from 'react';
import { useOptimizationStore } from '../store/optimizationStore';
import { useTaskStore } from '../store/taskStore';
import smartTaskOrchestrator from '../services/smartTaskOrchestrator';
import mlDurationService from '../services/mlDurationService';
import {
  OptimizationSuggestion,
  ProactiveRecommendation,
  UserPattern,
} from '../types/optimization';
import { Task } from '../types';

interface UseSmartAssistantOptions {
  autoAnalyze?: boolean; // Analyser automatiquement au changement de tâches
  analyzeInterval?: number; // Intervalle d'analyse auto (ms), 0 = désactivé
  enableML?: boolean; // Activer ML pour prédiction de durée
}

interface UseSmartAssistantReturn {
  // État
  suggestions: OptimizationSuggestion[];
  recommendations: ProactiveRecommendation[];
  patterns: UserPattern[];
  unviewedCount: number;
  isAnalyzing: boolean;
  isInitialized: boolean;

  // Statistiques
  stats: {
    totalSuggestions: number;
    acceptedSuggestions: number;
    totalTimeSaved: number;
    totalDistanceSaved: number;
    acceptanceRate: number;
  };

  // Actions
  analyze: () => Promise<void>;
  acceptSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => void;
  dismissRecommendation: (id: string) => Promise<void>;
  optimizeRoutes: () => Promise<Task[]>;
  predictDuration: (task: Task) => Promise<number | null>;
  refresh: () => Promise<void>;

  // Paramètres
  optimizationEnabled: boolean;
  toggleOptimization: () => void;
}

export function useSmartAssistant(
  options: UseSmartAssistantOptions = {}
): UseSmartAssistantReturn {
  const {
    autoAnalyze = true,
    analyzeInterval = 0,
    enableML = true,
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    suggestions,
    recommendations,
    userPatterns,
    stats,
    optimizationEnabled,
    setSuggestions,
    setRecommendations,
    setUserPatterns,
    acceptSuggestion: storeAcceptSuggestion,
    rejectSuggestion: storeRejectSuggestion,
    removeSuggestion,
    removeRecommendation,
    setOptimizationEnabled,
  } = useOptimizationStore();

  const { tasks } = useTaskStore();

  // Initialisation
  useEffect(() => {
    init();
  }, []);

  // Auto-analyse quand les tâches changent
  useEffect(() => {
    if (autoAnalyze && isInitialized && optimizationEnabled) {
      analyze();
    }
  }, [tasks.length, autoAnalyze, isInitialized, optimizationEnabled]);

  // Analyse périodique
  useEffect(() => {
    if (analyzeInterval > 0 && optimizationEnabled) {
      const interval = setInterval(() => {
        analyze();
      }, analyzeInterval);

      return () => clearInterval(interval);
    }
  }, [analyzeInterval, optimizationEnabled]);

  /**
   * Initialisation des services
   */
  const init = async () => {
    try {
      await smartTaskOrchestrator.initialize();

      if (enableML) {
        await mlDurationService.initialize();

        // Entraîner le modèle avec l'historique
        const completedTasks = tasks.filter((t) => t.completed);
        if (completedTasks.length >= 20) {
          console.log('[useSmartAssistant] Training ML model...');
          await mlDurationService.trainWithHistory(completedTasks);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('[useSmartAssistant] Initialization error:', error);
    }
  };

  /**
   * Analyse complète
   */
  const analyze = useCallback(async () => {
    if (isAnalyzing || !optimizationEnabled) return;

    setIsAnalyzing(true);

    try {
      const result = await smartTaskOrchestrator.analyzeAndOptimize(tasks, {
        includeHabitAnalysis: true,
        includeWeatherOptimization: true,
        includeRouteOptimization: true,
      });

      setSuggestions(result.suggestions);
      setRecommendations(result.recommendations);
      setUserPatterns(result.patterns);

      console.log(
        `[useSmartAssistant] Analysis complete: ${result.suggestions.length} suggestions, ${result.recommendations.length} recommendations`
      );
    } catch (error) {
      console.error('[useSmartAssistant] Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isAnalyzing,
    optimizationEnabled,
    tasks,
    setSuggestions,
    setRecommendations,
    setUserPatterns,
  ]);

  /**
   * Accepte une suggestion et l'applique
   */
  const acceptSuggestion = useCallback(
    async (id: string) => {
      const suggestion = suggestions.find((s) => s.id === id);
      if (!suggestion) return;

      storeAcceptSuggestion(id);

      // TODO: Appliquer les changements proposés aux tâches
      // Pour l'instant, on supprime juste après un délai
      setTimeout(() => {
        removeSuggestion(id);
      }, 2000);
    },
    [suggestions, storeAcceptSuggestion, removeSuggestion]
  );

  /**
   * Rejette une suggestion
   */
  const rejectSuggestion = useCallback(
    (id: string) => {
      storeRejectSuggestion(id);

      setTimeout(() => {
        removeSuggestion(id);
      }, 1000);
    },
    [storeRejectSuggestion, removeSuggestion]
  );

  /**
   * Rejette une recommandation
   */
  const dismissRecommendation = useCallback(
    async (id: string) => {
      const proactiveService = (
        await import('../services/proactiveRecommendationService')
      ).default;
      await proactiveService.dismissRecommendation(id);
      removeRecommendation(id);
    },
    [removeRecommendation]
  );

  /**
   * Optimise les routes des tâches
   */
  const optimizeRoutes = useCallback(async (): Promise<Task[]> => {
    try {
      const optimized = await smartTaskOrchestrator.optimizeRoutes(tasks);
      console.log('[useSmartAssistant] Routes optimized');
      return optimized;
    } catch (error) {
      console.error('[useSmartAssistant] Route optimization error:', error);
      return tasks;
    }
  }, [tasks]);

  /**
   * Prédit la durée d'une tâche avec ML
   */
  const predictDuration = useCallback(
    async (task: Task): Promise<number | null> => {
      if (!enableML) return null;

      try {
        const result = await mlDurationService.suggestDuration(
          task,
          tasks.filter((t) => t.completed)
        );

        console.log(
          `[useSmartAssistant] Duration prediction: ${result.duration} min (${result.method}, confidence: ${result.confidence})`
        );

        return result.duration;
      } catch (error) {
        console.error('[useSmartAssistant] Duration prediction error:', error);
        return null;
      }
    },
    [enableML, tasks]
  );

  /**
   * Rafraîchit l'analyse
   */
  const refresh = useCallback(async () => {
    await analyze();
  }, [analyze]);

  /**
   * Toggle l'optimisation
   */
  const toggleOptimization = useCallback(() => {
    setOptimizationEnabled(!optimizationEnabled);
  }, [optimizationEnabled, setOptimizationEnabled]);

  /**
   * Compte des recommandations non vues
   */
  const unviewedCount = recommendations.filter((r) => !r.viewedAt).length;

  return {
    // État
    suggestions: suggestions.filter((s) => !s.acceptedAt && !s.rejectedAt),
    recommendations: recommendations.filter(
      (r) => !r.actedAt && (!r.expiresAt || r.expiresAt > new Date())
    ),
    patterns: userPatterns,
    unviewedCount,
    isAnalyzing,
    isInitialized,

    // Statistiques
    stats: {
      totalSuggestions: stats.totalSuggestions,
      acceptedSuggestions: stats.acceptedSuggestions,
      totalTimeSaved: stats.totalTimeSaved,
      totalDistanceSaved: stats.totalDistanceSaved,
      acceptanceRate: stats.acceptanceRate,
    },

    // Actions
    analyze,
    acceptSuggestion,
    rejectSuggestion,
    dismissRecommendation,
    optimizeRoutes,
    predictDuration,
    refresh,

    // Paramètres
    optimizationEnabled,
    toggleOptimization,
  };
}
