/**
 * Store Zustand pour l'optimisation de tâches
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OptimizationSuggestion,
  ProactiveRecommendation,
  OptimizationStats,
  UserPattern,
} from '../types/optimization';

interface OptimizationStore {
  // Suggestions d'optimisation
  suggestions: OptimizationSuggestion[];
  setSuggestions: (suggestions: OptimizationSuggestion[]) => void;
  addSuggestion: (suggestion: OptimizationSuggestion) => void;
  removeSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;

  // Recommandations proactives
  recommendations: ProactiveRecommendation[];
  setRecommendations: (recommendations: ProactiveRecommendation[]) => void;
  addRecommendation: (recommendation: ProactiveRecommendation) => void;
  removeRecommendation: (id: string) => void;
  markRecommendationAsViewed: (id: string) => void;
  markRecommendationAsActed: (id: string) => void;

  // Patterns utilisateur
  userPatterns: UserPattern[];
  setUserPatterns: (patterns: UserPattern[]) => void;

  // Statistiques
  stats: OptimizationStats;
  updateStats: (stats: Partial<OptimizationStats>) => void;
  incrementAccepted: () => void;
  incrementRejected: () => void;
  addTimeSaved: (minutes: number) => void;
  addDistanceSaved: (meters: number) => void;

  // Paramètres
  optimizationEnabled: boolean;
  setOptimizationEnabled: (enabled: boolean) => void;
  autoApplyHighConfidence: boolean;
  setAutoApplyHighConfidence: (auto: boolean) => void;
  minimumConfidence: number;
  setMinimumConfidence: (confidence: number) => void;

  // Actions
  clearAll: () => void;
  clearSuggestions: () => void;
  clearRecommendations: () => void;
}

const defaultStats: OptimizationStats = {
  totalSuggestions: 0,
  acceptedSuggestions: 0,
  rejectedSuggestions: 0,
  totalTimeSaved: 0,
  totalDistanceSaved: 0,
  acceptanceRate: 0,
  averageConfidence: 0,
};

export const useOptimizationStore = create<OptimizationStore>()(
  persist(
    (set, get) => ({
      // État initial
      suggestions: [],
      recommendations: [],
      userPatterns: [],
      stats: defaultStats,
      optimizationEnabled: true,
      autoApplyHighConfidence: false,
      minimumConfidence: 50,

      // === SUGGESTIONS ===

      setSuggestions: (suggestions) => set({ suggestions }),

      addSuggestion: (suggestion) =>
        set((state) => ({
          suggestions: [...state.suggestions, suggestion],
          stats: {
            ...state.stats,
            totalSuggestions: state.stats.totalSuggestions + 1,
          },
        })),

      removeSuggestion: (id) =>
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.id !== id),
        })),

      acceptSuggestion: (id) =>
        set((state) => {
          const suggestion = state.suggestions.find((s) => s.id === id);
          if (!suggestion) return state;

          const updatedSuggestions = state.suggestions.map((s) =>
            s.id === id ? { ...s, acceptedAt: new Date() } : s
          );

          const newStats = {
            ...state.stats,
            acceptedSuggestions: state.stats.acceptedSuggestions + 1,
            acceptanceRate:
              (state.stats.acceptedSuggestions + 1) /
              (state.stats.acceptedSuggestions +
                state.stats.rejectedSuggestions +
                1),
            totalTimeSaved:
              state.stats.totalTimeSaved + (suggestion.impact.timeSaved || 0),
            totalDistanceSaved:
              state.stats.totalDistanceSaved +
              (suggestion.impact.distanceSaved || 0),
          };

          return {
            suggestions: updatedSuggestions,
            stats: newStats,
          };
        }),

      rejectSuggestion: (id) =>
        set((state) => {
          const updatedSuggestions = state.suggestions.map((s) =>
            s.id === id ? { ...s, rejectedAt: new Date() } : s
          );

          const newStats = {
            ...state.stats,
            rejectedSuggestions: state.stats.rejectedSuggestions + 1,
            acceptanceRate:
              state.stats.acceptedSuggestions /
              (state.stats.acceptedSuggestions +
                state.stats.rejectedSuggestions +
                1),
          };

          return {
            suggestions: updatedSuggestions,
            stats: newStats,
          };
        }),

      // === RECOMMANDATIONS ===

      setRecommendations: (recommendations) => set({ recommendations }),

      addRecommendation: (recommendation) =>
        set((state) => ({
          recommendations: [...state.recommendations, recommendation],
        })),

      removeRecommendation: (id) =>
        set((state) => ({
          recommendations: state.recommendations.filter((r) => r.id !== id),
        })),

      markRecommendationAsViewed: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, viewedAt: new Date() } : r
          ),
        })),

      markRecommendationAsActed: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, actedAt: new Date() } : r
          ),
        })),

      // === PATTERNS ===

      setUserPatterns: (patterns) => set({ userPatterns: patterns }),

      // === STATISTIQUES ===

      updateStats: (stats) =>
        set((state) => ({
          stats: { ...state.stats, ...stats },
        })),

      incrementAccepted: () =>
        set((state) => ({
          stats: {
            ...state.stats,
            acceptedSuggestions: state.stats.acceptedSuggestions + 1,
            acceptanceRate:
              (state.stats.acceptedSuggestions + 1) /
              (state.stats.acceptedSuggestions +
                state.stats.rejectedSuggestions +
                1),
          },
        })),

      incrementRejected: () =>
        set((state) => ({
          stats: {
            ...state.stats,
            rejectedSuggestions: state.stats.rejectedSuggestions + 1,
            acceptanceRate:
              state.stats.acceptedSuggestions /
              (state.stats.acceptedSuggestions +
                state.stats.rejectedSuggestions +
                1),
          },
        })),

      addTimeSaved: (minutes) =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalTimeSaved: state.stats.totalTimeSaved + minutes,
          },
        })),

      addDistanceSaved: (meters) =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalDistanceSaved: state.stats.totalDistanceSaved + meters,
          },
        })),

      // === PARAMÈTRES ===

      setOptimizationEnabled: (enabled) => set({ optimizationEnabled: enabled }),

      setAutoApplyHighConfidence: (auto) =>
        set({ autoApplyHighConfidence: auto }),

      setMinimumConfidence: (confidence) =>
        set({ minimumConfidence: confidence }),

      // === ACTIONS ===

      clearAll: () =>
        set({
          suggestions: [],
          recommendations: [],
          userPatterns: [],
          stats: defaultStats,
        }),

      clearSuggestions: () => set({ suggestions: [] }),

      clearRecommendations: () => set({ recommendations: [] }),
    }),
    {
      name: 'optimization-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Ne pas persister les suggestions (elles sont recalculées)
      partialize: (state) => ({
        userPatterns: state.userPatterns,
        stats: state.stats,
        optimizationEnabled: state.optimizationEnabled,
        autoApplyHighConfidence: state.autoApplyHighConfidence,
        minimumConfidence: state.minimumConfidence,
      }),
    }
  )
);
