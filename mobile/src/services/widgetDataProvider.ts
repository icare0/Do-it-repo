/**
 * Service de fourniture de données pour les widgets iOS et Android
 * Expose les données de l'app aux widgets natifs via UserDefaults (iOS) et SharedPreferences (Android)
 */

import { Task } from '../types';
import { OptimizationSuggestion } from '../types/optimization';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

// App Group ID pour iOS (doit matcher celui dans Xcode)
const APP_GROUP_ID = 'group.com.doit.app';

// SharedPreferences name pour Android
const SHARED_PREFS_NAME = 'DoItWidgetData';

/**
 * Types de données pour les widgets
 */

export interface WidgetTaskData {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  startDate?: string; // ISO string
  duration?: number;
  location?: {
    name: string;
  };
}

export interface WidgetTodayData {
  tasks: WidgetTaskData[];
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  nextTask?: WidgetTaskData;
  lastUpdated: string; // ISO string
}

export interface WidgetStatsData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  todayTotal: number;
  weeklyProgress: number[]; // 7 days
  lastUpdated: string;
}

export interface WidgetSuggestionData {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  impact?: {
    timeSaved?: number;
    distanceSaved?: number;
  };
}

export interface WidgetSuggestionsData {
  suggestions: WidgetSuggestionData[];
  unviewedCount: number;
  lastUpdated: string;
}

/**
 * Clés de stockage
 */
const WIDGET_KEYS = {
  TODAY: 'widget_today_data',
  NEXT_TASK: 'widget_next_task_data',
  STATS: 'widget_stats_data',
  SUGGESTIONS: 'widget_suggestions_data',
  LAST_UPDATE: 'widget_last_update',
};

class WidgetDataProviderService {
  private isInitialized = false;

  /**
   * Initialise le service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[WidgetDataProvider] Initializing...');

      // Vérifier que le module natif est disponible
      if (Platform.OS === 'ios') {
        // Vérifier l'App Group sur iOS
        try {
          await SharedGroupPreferences.setItem(
            'test',
            'test',
            APP_GROUP_ID
          );
          console.log('[WidgetDataProvider] iOS App Group verified');
        } catch (error) {
          console.error('[WidgetDataProvider] iOS App Group not configured:', error);
        }
      }

      this.isInitialized = true;
      console.log('[WidgetDataProvider] Initialized successfully');
    } catch (error) {
      console.error('[WidgetDataProvider] Initialization error:', error);
    }
  }

  /**
   * Met à jour les données du widget "Today"
   */
  async updateTodayWidget(tasks: Task[]): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filtrer les tâches d'aujourd'hui
      const todayTasks = tasks.filter((task) => {
        if (!task.startDate) return false;
        const taskDate = new Date(task.startDate);
        return taskDate >= today && taskDate < tomorrow;
      });

      // Convertir en format widget
      const widgetTasks: WidgetTaskData[] = todayTasks.map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        category: task.category,
        startDate: task.startDate ? new Date(task.startDate).toISOString() : undefined,
        duration: task.duration,
        location: task.location ? { name: task.location.name } : undefined,
      }));

      // Calculer les stats
      const completedCount = widgetTasks.filter((t) => t.completed).length;
      const totalCount = widgetTasks.length;
      const progressPercentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Trouver la prochaine tâche
      const incompleteTasks = widgetTasks
        .filter((t) => !t.completed)
        .sort((a, b) => {
          // Trier par priorité puis par heure
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff =
            priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          if (a.startDate && b.startDate) {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          }
          return 0;
        });

      const nextTask = incompleteTasks[0];

      const data: WidgetTodayData = {
        tasks: widgetTasks.slice(0, 8), // Max 8 tâches pour le widget
        completedCount,
        totalCount,
        progressPercentage,
        nextTask,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveData(WIDGET_KEYS.TODAY, data);

      // Mettre à jour aussi le widget Next Task
      if (nextTask) {
        await this.saveData(WIDGET_KEYS.NEXT_TASK, {
          ...nextTask,
          lastUpdated: new Date().toISOString(),
        });
      }

      console.log(
        `[WidgetDataProvider] Today widget updated: ${totalCount} tasks, ${completedCount} completed`
      );
    } catch (error) {
      console.error('[WidgetDataProvider] Error updating today widget:', error);
    }
  }

  /**
   * Met à jour les données du widget "Stats"
   */
  async updateStatsWidget(stats: {
    currentStreak: number;
    longestStreak: number;
    completionHistory: Array<{ date: Date; count: number }>;
  }): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculer les tâches complétées aujourd'hui
      const todayEntry = stats.completionHistory.find((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });

      const todayCompleted = todayEntry ? todayEntry.count : 0;

      // Progression hebdomadaire (7 derniers jours)
      const weeklyProgress: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const entry = stats.completionHistory.find((e) => {
          const eDate = new Date(e.date);
          eDate.setHours(0, 0, 0, 0);
          return eDate.getTime() === date.getTime();
        });

        weeklyProgress.push(entry ? entry.count : 0);
      }

      const data: WidgetStatsData = {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        todayCompleted,
        todayTotal: 10, // TODO: Get from task count
        weeklyProgress,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveData(WIDGET_KEYS.STATS, data);

      console.log(
        `[WidgetDataProvider] Stats widget updated: ${stats.currentStreak} days streak`
      );
    } catch (error) {
      console.error('[WidgetDataProvider] Error updating stats widget:', error);
    }
  }

  /**
   * Met à jour les données du widget "Suggestions"
   */
  async updateSuggestionsWidget(
    suggestions: OptimizationSuggestion[]
  ): Promise<void> {
    try {
      // Filtrer les suggestions non acceptées/rejetées
      const activeSuggestions = suggestions.filter(
        (s) => !s.acceptedAt && !s.rejectedAt
      );

      // Convertir en format widget
      const widgetSuggestions: WidgetSuggestionData[] = activeSuggestions
        .slice(0, 3) // Max 3 suggestions
        .map((s) => ({
          id: s.id,
          title: s.title,
          message: s.reason,
          priority: s.priority,
          type: s.type,
          impact: s.impact,
        }));

      const data: WidgetSuggestionsData = {
        suggestions: widgetSuggestions,
        unviewedCount: activeSuggestions.length,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveData(WIDGET_KEYS.SUGGESTIONS, data);

      console.log(
        `[WidgetDataProvider] Suggestions widget updated: ${activeSuggestions.length} suggestions`
      );
    } catch (error) {
      console.error('[WidgetDataProvider] Error updating suggestions widget:', error);
    }
  }

  /**
   * Met à jour tous les widgets
   */
  async updateAllWidgets(data: {
    tasks: Task[];
    stats?: {
      currentStreak: number;
      longestStreak: number;
      completionHistory: Array<{ date: Date; count: number }>;
    };
    suggestions?: OptimizationSuggestion[];
  }): Promise<void> {
    console.log('[WidgetDataProvider] Updating all widgets...');

    await Promise.all([
      this.updateTodayWidget(data.tasks),
      data.stats ? this.updateStatsWidget(data.stats) : Promise.resolve(),
      data.suggestions
        ? this.updateSuggestionsWidget(data.suggestions)
        : Promise.resolve(),
    ]);

    // Marquer la dernière mise à jour
    await this.saveData(WIDGET_KEYS.LAST_UPDATE, new Date().toISOString());

    console.log('[WidgetDataProvider] All widgets updated');
  }

  /**
   * Force le rafraîchissement des widgets natifs
   */
  async refreshWidgets(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS: WidgetCenter.reloadAllTimelines()
        // Nécessite un module natif custom
        console.log('[WidgetDataProvider] iOS widget refresh requested');
      } else if (Platform.OS === 'android') {
        // Android: AppWidgetManager.notifyAppWidgetViewDataChanged()
        // Nécessite un module natif custom
        console.log('[WidgetDataProvider] Android widget refresh requested');
      }
    } catch (error) {
      console.error('[WidgetDataProvider] Error refreshing widgets:', error);
    }
  }

  // ===== HELPERS PRIVÉS =====

  /**
   * Sauvegarde des données dans le stockage partagé
   */
  private async saveData(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);

      if (Platform.OS === 'ios') {
        // iOS: UserDefaults avec App Group
        await SharedGroupPreferences.setItem(key, jsonData, APP_GROUP_ID);
      } else if (Platform.OS === 'android') {
        // Android: SharedPreferences
        await SharedGroupPreferences.setItem(
          key,
          jsonData,
          SHARED_PREFS_NAME
        );
      }
    } catch (error) {
      console.error(`[WidgetDataProvider] Error saving data for key ${key}:`, error);
    }
  }

  /**
   * Lecture des données depuis le stockage partagé
   */
  private async loadData<T>(key: string): Promise<T | null> {
    try {
      const groupId =
        Platform.OS === 'ios' ? APP_GROUP_ID : SHARED_PREFS_NAME;
      const jsonData = await SharedGroupPreferences.getItem(key, groupId);

      if (!jsonData) return null;

      return JSON.parse(jsonData) as T;
    } catch (error) {
      console.error(`[WidgetDataProvider] Error loading data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Obtient les données du widget Today (pour debug)
   */
  async getTodayWidgetData(): Promise<WidgetTodayData | null> {
    return this.loadData<WidgetTodayData>(WIDGET_KEYS.TODAY);
  }

  /**
   * Obtient les données du widget Stats (pour debug)
   */
  async getStatsWidgetData(): Promise<WidgetStatsData | null> {
    return this.loadData<WidgetStatsData>(WIDGET_KEYS.STATS);
  }

  /**
   * Obtient les données du widget Suggestions (pour debug)
   */
  async getSuggestionsWidgetData(): Promise<WidgetSuggestionsData | null> {
    return this.loadData<WidgetSuggestionsData>(WIDGET_KEYS.SUGGESTIONS);
  }
}

export default new WidgetDataProviderService();
