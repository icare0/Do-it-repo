/**
 * Orchestrateur intelligent de tâches
 * Coordonne tous les services d'optimisation, d'apprentissage et de recommandations
 */

import { Task } from '../types';
import {
  OptimizationContext,
  OptimizationSuggestion,
  ProactiveRecommendation,
  UserPattern,
} from '../types/optimization';
import taskOptimizationService from './taskOptimizationService';
import habitLearningService from './habitLearningService';
import proactiveRecommendationService from './proactiveRecommendationService';
import routeService from './routeService';
import weatherService from './weatherService';
import { notificationService } from './notificationService';
import * as Location from 'expo-location';

class SmartTaskOrchestrator {
  private isInitialized = false;
  private currentLocation: { latitude: number; longitude: number } | null = null;

  /**
   * Initialise l'orchestrateur
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[SmartTaskOrchestrator] Initializing...');

      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Obtenir la position actuelle
        const location = await Location.getCurrentPositionAsync({});
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }

      this.isInitialized = true;
      console.log('[SmartTaskOrchestrator] Initialized successfully');
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Initialization error:', error);
    }
  }

  /**
   * Analyse complète et génère toutes les suggestions/recommandations
   */
  async analyzeAndOptimize(
    tasks: Task[],
    options: {
      includeHabitAnalysis?: boolean;
      includeWeatherOptimization?: boolean;
      includeRouteOptimization?: boolean;
    } = {}
  ): Promise<{
    suggestions: OptimizationSuggestion[];
    recommendations: ProactiveRecommendation[];
    patterns: UserPattern[];
  }> {
    const {
      includeHabitAnalysis = true,
      includeWeatherOptimization = true,
      includeRouteOptimization = true,
    } = options;

    try {
      console.log('[SmartTaskOrchestrator] Starting analysis...');

      // 1. Analyser les habitudes
      let patterns: UserPattern[] = [];
      if (includeHabitAnalysis) {
        const completedTasks = tasks.filter((t) => t.completed);
        patterns = await habitLearningService.analyzeUserPatterns(completedTasks);
        console.log(`[SmartTaskOrchestrator] Found ${patterns.length} patterns`);
      }

      // 2. Créer le contexte d'optimisation
      const context = await this.buildOptimizationContext(tasks);

      // 3. Générer les suggestions d'optimisation
      let suggestions: OptimizationSuggestion[] = [];

      if (context) {
        suggestions = await taskOptimizationService.optimizeDailySchedule(
          tasks.filter((t) => !t.completed),
          context
        );
        console.log(`[SmartTaskOrchestrator] Generated ${suggestions.length} suggestions`);
      }

      // 4. Générer les recommandations proactives
      const recommendations = await proactiveRecommendationService.analyzeAndRecommend(
        tasks,
        this.currentLocation || undefined
      );
      console.log(`[SmartTaskOrchestrator] Generated ${recommendations.length} recommendations`);

      return { suggestions, recommendations, patterns };
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Analysis error:', error);
      return { suggestions: [], recommendations: [], patterns: [] };
    }
  }

  /**
   * Optimise spécifiquement les routes
   */
  async optimizeRoutes(tasks: Task[]): Promise<Task[]> {
    const tasksWithLocation = tasks.filter(
      (t) => !t.completed && t.location && t.startDate
    );

    if (tasksWithLocation.length < 2) {
      return tasks;
    }

    try {
      // Utiliser l'algorithme nearest neighbor du service d'optimisation
      const context = await this.buildOptimizationContext(tasks);
      if (!context) return tasks;

      const suggestion = taskOptimizationService.suggestRouteOptimization(
        tasksWithLocation,
        context
      );

      if (suggestion) {
        console.log('[SmartTaskOrchestrator] Route optimized');
        // Retourner les tâches dans l'ordre optimisé
        const optimizedOrder = suggestion.taskIds;
        const reordered = optimizedOrder
          .map((id) => tasks.find((t) => t.id === id))
          .filter((t): t is Task => t !== undefined);

        const remaining = tasks.filter((t) => !optimizedOrder.includes(t.id));

        return [...reordered, ...remaining];
      }

      return tasks;
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Route optimization error:', error);
      return tasks;
    }
  }

  /**
   * Trouve le meilleur moment pour une tâche
   */
  async findBestTimeSlot(task: Task, tasks: Task[]): Promise<Date | null> {
    try {
      const context = await this.buildOptimizationContext(tasks);
      if (!context) return null;

      return taskOptimizationService.findOptimalTimeSlot(task, context);
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Find best time error:', error);
      return null;
    }
  }

  /**
   * Vérifie si une tâche correspond aux habitudes
   */
  async checkTaskAgainstHabits(
    task: Task,
    completedTasks: Task[]
  ): Promise<{
    matches: boolean;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      // S'assurer que les patterns sont à jour
      await habitLearningService.analyzeUserPatterns(completedTasks);

      return habitLearningService.matchesUserHabits(task);
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Habit check error:', error);
      return { matches: false, confidence: 0, suggestions: [] };
    }
  }

  /**
   * Envoie une notification intelligente basée sur le contexte
   */
  async sendSmartNotification(
    task: Task,
    nearbyTasks?: Task[]
  ): Promise<void> {
    try {
      if (!task.location) {
        // Notification simple
        await notificationService.scheduleTaskNotification({
          id: task.id,
          title: task.title,
          startDate: task.startDate || new Date(),
          description: task.description,
          // @ts-ignore - subtasks might not be in the base Task type
          subtasks: task.subtasks,
        });
      } else {
        // Notification géolocalisée avec liste
        await notificationService.sendLocationNotification(
          {
            id: task.id,
            title: task.title,
            location: task.location,
            description: task.description,
            // @ts-ignore
            subtasks: task.subtasks,
          },
          nearbyTasks?.map((t) => ({
            id: t.id,
            title: t.title,
            location: t.location!,
          }))
        );
      }
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Smart notification error:', error);
    }
  }

  /**
   * Groupe les tâches proches géographiquement
   */
  async groupTasksByLocation(tasks: Task[]): Promise<Task[][]> {
    const context = await this.buildOptimizationContext(tasks);
    if (!context) return [];

    const groups = taskOptimizationService.suggestGrouping(
      tasks.filter((t) => !t.completed),
      context
    );

    return groups.map((group) =>
      tasks.filter((t) => group.taskIds.includes(t.id))
    );
  }

  /**
   * Construit le contexte d'optimisation
   */
  private async buildOptimizationContext(
    tasks: Task[]
  ): Promise<OptimizationContext | null> {
    try {
      // Localisation
      let userLocation = this.currentLocation;
      if (!userLocation) {
        try {
          const location = await Location.getCurrentPositionAsync({});
          userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          this.currentLocation = userLocation;
        } catch {
          // Utiliser une position par défaut si échec
          userLocation = { latitude: 0, longitude: 0 };
        }
      }

      // Météo
      let weather = {
        temperature: 20,
        condition: 'clear' as const,
        precipitation: 0,
        windSpeed: 0,
        humidity: 50,
      };

      try {
        const weatherData = await weatherService.getCurrentWeather(
          userLocation.latitude,
          userLocation.longitude
        );
        if (weatherData) {
          weather = {
            temperature: weatherData.temperature,
            condition: this.mapWeatherCondition(weatherData.weatherCode),
            precipitation: weatherData.precipitation || 0,
            windSpeed: weatherData.windSpeed || 0,
            humidity: weatherData.humidity || 50,
          };
        }
      } catch {
        // Utiliser les valeurs par défaut
      }

      // Niveau d'énergie basé sur l'heure
      const hour = new Date().getHours();
      let userEnergy: 'high' | 'medium' | 'low' = 'medium';
      if (hour >= 8 && hour <= 11) {
        userEnergy = 'high';
      } else if (hour >= 18 || hour <= 6) {
        userEnergy = 'low';
      }

      // Historique des tâches complétées
      const taskHistory = tasks
        .filter((t) => t.completed && t.updatedAt)
        .map((t) => ({
          taskId: t.id,
          category: t.category || 'aucune',
          completedAt: new Date(t.updatedAt),
          duration: t.duration || 30,
          location: t.location
            ? {
                latitude: t.location.latitude,
                longitude: t.location.longitude,
              }
            : undefined,
          timeOfDay: new Date(t.updatedAt).getHours(),
          dayOfWeek: new Date(t.updatedAt).getDay(),
        }));

      return {
        currentTime: new Date(),
        userLocation,
        weather,
        calendarEvents: [], // TODO: Intégrer avec le service calendar
        userEnergy,
        taskHistory,
        tasks: tasks.filter((t) => !t.completed),
      };
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Context building error:', error);
      return null;
    }
  }

  /**
   * Convertit un code météo en condition simplifiée
   */
  private mapWeatherCondition(
    code: number
  ): 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3) return 'cloudy';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 95) return 'storm';
    return 'clear';
  }

  /**
   * Met à jour la position actuelle
   */
  async updateCurrentLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({});
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[SmartTaskOrchestrator] Location update error:', error);
    }
  }
}

export default new SmartTaskOrchestrator();
