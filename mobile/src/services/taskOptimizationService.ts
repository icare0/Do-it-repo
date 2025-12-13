/**
 * Service d'optimisation intelligente de tâches
 * Utilise des algorithmes de scoring multi-critères pour optimiser le planning
 */

import { Task, Location } from '../types';
import {
  OptimizationContext,
  OptimizationSuggestion,
  TimeSlot,
  Conflict,
  ScoringCriteria,
  TaskGroup,
} from '../types/optimization';

/**
 * Poids par défaut pour les critères de scoring
 */
const DEFAULT_SCORING_WEIGHTS: ScoringCriteria = {
  weather: 0.15,
  energy: 0.20,
  location: 0.25,
  calendar: 0.20,
  habits: 0.10,
  traffic: 0.05,
  priority: 0.05,
};

class TaskOptimizationService {
  private scoringWeights: ScoringCriteria = DEFAULT_SCORING_WEIGHTS;

  /**
   * Point d'entrée principal: Optimise le planning journalier
   */
  async optimizeDailySchedule(
    tasks: Task[],
    context: OptimizationContext
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Détecter les conflits
    const conflicts = this.detectConflicts(tasks, context);
    for (const conflict of conflicts) {
      if (conflict.suggestedResolution) {
        suggestions.push(conflict.suggestedResolution);
      }
    }

    // 2. Optimiser l'ordre des tâches par localisation
    const routeOptimization = this.suggestRouteOptimization(tasks, context);
    if (routeOptimization) {
      suggestions.push(routeOptimization);
    }

    // 3. Suggérer le regroupement de tâches
    const groups = this.suggestGrouping(tasks, context);
    for (const group of groups) {
      if (group.taskIds.length >= 2) {
        suggestions.push(this.createGroupingSuggestion(group, tasks));
      }
    }

    // 4. Suggérer des déplacements basés sur la météo
    const weatherSuggestions = this.suggestWeatherOptimizations(tasks, context);
    suggestions.push(...weatherSuggestions);

    // 5. Suggérer des déplacements basés sur l'énergie
    const energySuggestions = this.suggestEnergyOptimizations(tasks, context);
    suggestions.push(...energySuggestions);

    // Trier par priorité et confiance
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Détecte les conflits dans le planning
   */
  detectConflicts(tasks: Task[], context: OptimizationContext): Conflict[] {
    const conflicts: Conflict[] = [];
    const sortedTasks = [...tasks]
      .filter((t) => !t.completed && t.startDate)
      .sort((a, b) => (a.startDate!.getTime() - b.startDate!.getTime()));

    // Conflit 1: Chevauchement temporel
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const task1 = sortedTasks[i];
      const task2 = sortedTasks[i + 1];

      if (!task1.startDate || !task2.startDate) continue;

      const task1End = new Date(
        task1.startDate.getTime() + (task1.duration || 30) * 60000
      );

      if (task2.startDate < task1End) {
        const overlapMinutes = Math.floor(
          (task1End.getTime() - task2.startDate.getTime()) / 60000
        );

        conflicts.push({
          id: `conflict-${task1.id}-${task2.id}`,
          type: 'time_overlap',
          severity: overlapMinutes > 30 ? 'high' : 'medium',
          involvedTasks: [task1.id, task2.id],
          description: `"${task1.title}" et "${task2.title}" se chevauchent de ${overlapMinutes} minutes`,
          suggestedResolution: this.createRescheduleSuggestion(
            task2,
            task1End,
            'Conflit de temps',
            context
          ),
        });
      }
    }

    // Conflit 2: Chevauchement avec événements du calendrier
    for (const task of sortedTasks) {
      if (!task.startDate) continue;

      const taskEnd = new Date(
        task.startDate.getTime() + (task.duration || 30) * 60000
      );

      for (const event of context.calendarEvents) {
        if (
          (task.startDate >= event.startTime && task.startDate < event.endTime) ||
          (taskEnd > event.startTime && taskEnd <= event.endTime)
        ) {
          conflicts.push({
            id: `conflict-${task.id}-${event.id}`,
            type: 'time_overlap',
            severity: 'high',
            involvedTasks: [task.id],
            involvedEvents: [event.id],
            description: `"${task.title}" chevauche l'événement "${event.title}"`,
            suggestedResolution: this.createRescheduleSuggestion(
              task,
              event.endTime,
              'Conflit avec événement du calendrier',
              context
            ),
          });
        }
      }
    }

    // Conflit 3: Déplacement impossible (temps de trajet trop court)
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const task1 = sortedTasks[i];
      const task2 = sortedTasks[i + 1];

      if (
        !task1.location ||
        !task2.location ||
        !task1.startDate ||
        !task2.startDate
      )
        continue;

      const distance = this.calculateDistance(task1.location, task2.location);
      const travelTime = this.estimateTravelTime(distance); // minutes

      const task1End = new Date(
        task1.startDate.getTime() + (task1.duration || 30) * 60000
      );
      const availableTime = Math.floor(
        (task2.startDate.getTime() - task1End.getTime()) / 60000
      );

      if (availableTime < travelTime) {
        conflicts.push({
          id: `conflict-travel-${task1.id}-${task2.id}`,
          type: 'impossible_travel',
          severity: 'critical',
          involvedTasks: [task1.id, task2.id],
          description: `Impossible de se déplacer de "${task1.location.name}" à "${task2.location.name}" en ${availableTime} min (besoin de ${travelTime} min)`,
          suggestedResolution: this.createRescheduleSuggestion(
            task2,
            new Date(task1End.getTime() + travelTime * 60000),
            'Temps de trajet insuffisant',
            context
          ),
        });
      }
    }

    return conflicts;
  }

  /**
   * Trouve le meilleur créneau pour une tâche
   */
  findOptimalTimeSlot(task: Task, context: OptimizationContext): Date | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const slots: TimeSlot[] = [];
    const duration = task.duration || 30;

    // Générer des slots de 30 minutes
    for (let time = new Date(today); time < endOfDay; time.setMinutes(time.getMinutes() + 30)) {
      const slotEnd = new Date(time.getTime() + duration * 60000);

      // Vérifier si le slot est disponible (pas de conflit)
      const hasConflict = context.calendarEvents.some(
        (event) => time < event.endTime && slotEnd > event.startTime
      );

      if (!hasConflict) {
        const score = this.calculateSlotScore(task, { start: time, end: slotEnd, duration, isAvailable: true, conflicts: [] }, context);
        slots.push({
          start: new Date(time),
          end: slotEnd,
          duration,
          score,
          isAvailable: true,
          conflicts: [],
        });
      }
    }

    // Retourner le slot avec le meilleur score
    if (slots.length === 0) return null;
    const bestSlot = slots.reduce((best, current) =>
      (current.score || 0) > (best.score || 0) ? current : best
    );

    return bestSlot.start;
  }

  /**
   * Calcule le score d'un créneau horaire pour une tâche
   */
  calculateSlotScore(
    task: Task,
    slot: TimeSlot,
    context: OptimizationContext
  ): number {
    let score = 0;

    // 1. MÉTÉO (si tâche extérieure - on déduit de la catégorie)
    const outdoorCategories = ['sport', 'courses', 'extérieur', 'jardinage'];
    const isOutdoor = outdoorCategories.some((cat) =>
      task.category?.toLowerCase().includes(cat)
    );

    if (isOutdoor) {
      if (context.weather.condition === 'clear') {
        score += 20 * this.scoringWeights.weather;
      } else if (context.weather.condition === 'rain') {
        score -= 30 * this.scoringWeights.weather;
      } else if (context.weather.condition === 'storm') {
        score -= 50 * this.scoringWeights.weather;
      }

      // Température
      if (context.weather.temperature > 10 && context.weather.temperature < 25) {
        score += 10 * this.scoringWeights.weather;
      }
    }

    // 2. ÉNERGIE (tâches difficiles le matin quand énergie haute)
    const hour = slot.start.getHours();
    const taskDifficulty = task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low';

    if (taskDifficulty === 'high') {
      if (hour >= 8 && hour <= 11 && context.userEnergy === 'high') {
        score += 25 * this.scoringWeights.energy;
      } else if (hour >= 14 && hour <= 16 && context.userEnergy === 'medium') {
        score += 10 * this.scoringWeights.energy;
      } else if (hour >= 18 && context.userEnergy === 'low') {
        score -= 20 * this.scoringWeights.energy;
      }
    } else if (taskDifficulty === 'low') {
      if (hour >= 18 && context.userEnergy === 'low') {
        score += 15 * this.scoringWeights.energy;
      }
    }

    // 3. LOCALISATION (proximité avec position actuelle)
    if (task.location) {
      const distance = this.calculateDistance(
        context.userLocation,
        task.location
      );

      if (distance < 1000) {
        // < 1 km
        score += 15 * this.scoringWeights.location;
      } else if (distance < 5000) {
        // < 5 km
        score += 5 * this.scoringWeights.location;
      } else if (distance > 20000) {
        // > 20 km
        score -= 10 * this.scoringWeights.location;
      }
    }

    // 4. HABITUDES (patterns historiques)
    if (context.taskHistory.length > 0) {
      const categoryHistory = context.taskHistory.filter(
        (h) => h.category === task.category
      );

      if (categoryHistory.length >= 3) {
        const preferredHours = this.findMostFrequent(
          categoryHistory.map((h) => h.timeOfDay),
          3
        );

        if (preferredHours.includes(hour)) {
          score += 10 * this.scoringWeights.habits;
        }
      }
    }

    // 5. HEURES DE POINTE (éviter 8-9h et 17-19h pour déplacements)
    if (task.location) {
      const isRushHour =
        (hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 19);
      if (isRushHour) {
        score -= 15 * this.scoringWeights.traffic;
      }
    }

    // 6. PRIORITÉ
    const priorityBonus = {
      high: 20,
      medium: 10,
      low: 0,
    };
    score += priorityBonus[task.priority] * this.scoringWeights.priority;

    // 7. GROUPING (tâches proches dans le temps)
    const nearbyTasks = this.findTasksNearSlot(slot, context.tasks, 120); // 2h
    if (nearbyTasks.length > 0 && task.location) {
      const nearbyWithLocation = nearbyTasks.filter(
        (t) =>
          t.location &&
          this.calculateDistance(t.location, task.location!) < 2000
      );
      score += nearbyWithLocation.length * 5 * this.scoringWeights.location;
    }

    return score;
  }

  /**
   * Suggère une optimisation de route pour les tâches avec localisation
   */
  suggestRouteOptimization(
    tasks: Task[],
    context: OptimizationContext
  ): OptimizationSuggestion | null {
    const tasksWithLocation = tasks.filter(
      (t) => !t.completed && t.location && t.startDate
    );

    if (tasksWithLocation.length < 2) return null;

    // Calculer la distance totale actuelle
    const currentDistance = this.calculateTotalDistance(
      tasksWithLocation.map((t) => t.location!)
    );

    // Optimiser avec algorithme du plus proche voisin (Nearest Neighbor)
    const optimizedOrder = this.optimizeRouteNearestNeighbor(
      tasksWithLocation,
      context.userLocation
    );

    const optimizedDistance = this.calculateTotalDistance(
      optimizedOrder.map((t) => t.location!)
    );

    const distanceSaved = currentDistance - optimizedDistance;

    // Suggérer uniquement si gain significatif (> 1km)
    if (distanceSaved < 1000) return null;

    return {
      id: `route-opt-${Date.now()}`,
      type: 'reorder',
      taskIds: optimizedOrder.map((t) => t.id),
      title: 'Optimiser votre itinéraire',
      reason: `En réorganisant vos tâches, vous pouvez économiser ${(
        distanceSaved / 1000
      ).toFixed(1)} km de trajet`,
      confidence: 85,
      priority: 'medium',
      proposedChanges: {
        newOrder: 0, // Will be set for each task individually
      },
      impact: {
        distanceSaved,
        timeSaved: Math.floor(distanceSaved / 500), // ~30km/h en ville
      },
    };
  }

  /**
   * Suggère le regroupement de tâches
   */
  suggestGrouping(tasks: Task[], context: OptimizationContext): TaskGroup[] {
    const groups: TaskGroup[] = [];

    // Grouper par localisation (rayon de 2 km)
    const tasksWithLocation = tasks.filter((t) => !t.completed && t.location);

    for (let i = 0; i < tasksWithLocation.length; i++) {
      const task1 = tasksWithLocation[i];
      const nearbyTasks: Task[] = [];

      for (let j = i + 1; j < tasksWithLocation.length; j++) {
        const task2 = tasksWithLocation[j];
        const distance = this.calculateDistance(
          task1.location!,
          task2.location!
        );

        if (distance <= 2000) {
          nearbyTasks.push(task2);
        }
      }

      if (nearbyTasks.length > 0) {
        const allTasks = [task1, ...nearbyTasks];
        const totalDistance = this.calculateTotalDistance(
          allTasks.map((t) => t.location!)
        );

        groups.push({
          id: `group-location-${task1.id}`,
          type: 'location',
          taskIds: allTasks.map((t) => t.id),
          name: `Tâches près de ${task1.location!.name}`,
          location: {
            ...task1.location!,
            radius: 2000,
          },
          score: nearbyTasks.length * 10,
          distanceSaved: nearbyTasks.length * 500, // Estimation
        });
      }
    }

    // Grouper par catégorie (même jour)
    const byCategory: { [key: string]: Task[] } = {};
    tasks.filter((t) => !t.completed && t.category).forEach((task) => {
      if (!byCategory[task.category!]) {
        byCategory[task.category!] = [];
      }
      byCategory[task.category!].push(task);
    });

    for (const [category, categoryTasks] of Object.entries(byCategory)) {
      if (categoryTasks.length >= 3) {
        groups.push({
          id: `group-category-${category}`,
          type: 'category',
          taskIds: categoryTasks.map((t) => t.id),
          name: `Tâches de catégorie "${category}"`,
          score: categoryTasks.length * 5,
        });
      }
    }

    return groups;
  }

  /**
   * Suggère des optimisations basées sur la météo
   */
  suggestWeatherOptimizations(
    tasks: Task[],
    context: OptimizationContext
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const outdoorCategories = ['sport', 'courses', 'extérieur', 'jardinage'];

    for (const task of tasks) {
      if (task.completed || !task.startDate) continue;

      const isOutdoor = outdoorCategories.some((cat) =>
        task.category?.toLowerCase().includes(cat)
      );

      if (!isOutdoor) continue;

      // Mauvais temps pendant la tâche
      if (
        context.weather.condition === 'rain' ||
        context.weather.condition === 'storm'
      ) {
        const newSlot = this.findOptimalTimeSlot(task, context);
        if (newSlot && newSlot.getTime() !== task.startDate.getTime()) {
          suggestions.push({
            id: `weather-${task.id}`,
            type: 'reschedule',
            taskIds: [task.id],
            title: `Reporter "${task.title}" à cause de la pluie`,
            reason: `Il va pleuvoir pendant cette tâche extérieure. Je suggère de la déplacer à ${this.formatTime(
              newSlot
            )}`,
            confidence: 90,
            priority: 'high',
            proposedChanges: {
              newStartTime: newSlot,
            },
            impact: {
              stressReduced: 30,
            },
          });
        }
      }

      // Température extrême
      if (context.weather.temperature < 0 || context.weather.temperature > 35) {
        suggestions.push({
          id: `temp-${task.id}`,
          type: 'reschedule',
          taskIds: [task.id],
          title: `Conditions météo difficiles pour "${task.title}"`,
          reason: `La température sera de ${context.weather.temperature}°C. Envisagez de reporter cette tâche.`,
          confidence: 70,
          priority: 'medium',
          proposedChanges: {},
          impact: {
            stressReduced: 20,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggère des optimisations basées sur le niveau d'énergie
   */
  suggestEnergyOptimizations(
    tasks: Task[],
    context: OptimizationContext
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const now = context.currentTime;
    const hour = now.getHours();

    for (const task of tasks) {
      if (task.completed || !task.startDate) continue;

      const taskHour = task.startDate.getHours();
      const isHighPriority = task.priority === 'high';

      // Tâche difficile en fin de journée avec énergie basse
      if (
        isHighPriority &&
        taskHour >= 18 &&
        context.userEnergy === 'low'
      ) {
        const morningSlot = this.findMorningSlot(task, context);
        if (morningSlot) {
          suggestions.push({
            id: `energy-${task.id}`,
            type: 'reschedule',
            taskIds: [task.id],
            title: `Déplacer "${task.title}" au matin`,
            reason: `Cette tâche importante serait mieux réalisée le matin quand vous avez plus d'énergie`,
            confidence: 75,
            priority: 'medium',
            proposedChanges: {
              newStartTime: morningSlot,
            },
            impact: {
              energySaved: 30,
            },
          });
        }
      }
    }

    return suggestions;
  }

  // ===== UTILITAIRES =====

  /**
   * Calcule la distance entre deux points (formule Haversine)
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }

  /**
   * Calcule la distance totale d'un itinéraire
   */
  private calculateTotalDistance(locations: Location[]): number {
    let total = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      total += this.calculateDistance(locations[i], locations[i + 1]);
    }
    return total;
  }

  /**
   * Estime le temps de trajet en minutes basé sur la distance
   */
  private estimateTravelTime(distanceMeters: number): number {
    // Vitesse moyenne en ville: ~20 km/h
    const speedKmh = 20;
    const distanceKm = distanceMeters / 1000;
    return Math.ceil((distanceKm / speedKmh) * 60);
  }

  /**
   * Optimise la route avec l'algorithme du plus proche voisin
   */
  private optimizeRouteNearestNeighbor(
    tasks: Task[],
    startLocation: { latitude: number; longitude: number }
  ): Task[] {
    const remaining = [...tasks];
    const optimized: Task[] = [];
    let currentLocation = startLocation;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          currentLocation,
          remaining[i].location!
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearestTask = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearestTask);
      currentLocation = nearestTask.location!;
    }

    return optimized;
  }

  /**
   * Trouve les tâches proches d'un créneau horaire
   */
  private findTasksNearSlot(
    slot: TimeSlot,
    tasks: Task[],
    windowMinutes: number
  ): Task[] {
    return tasks.filter((task) => {
      if (!task.startDate) return false;
      const diff = Math.abs(task.startDate.getTime() - slot.start.getTime());
      return diff <= windowMinutes * 60000;
    });
  }

  /**
   * Trouve les éléments les plus fréquents dans un tableau
   */
  private findMostFrequent(arr: number[], count: number): number[] {
    const frequency: { [key: number]: number } = {};
    arr.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([key]) => parseInt(key));
  }

  /**
   * Crée une suggestion de re-planification
   */
  private createRescheduleSuggestion(
    task: Task,
    newTime: Date,
    reason: string,
    context: OptimizationContext
  ): OptimizationSuggestion {
    return {
      id: `reschedule-${task.id}-${Date.now()}`,
      type: 'reschedule',
      taskIds: [task.id],
      title: `Déplacer "${task.title}"`,
      reason,
      confidence: 85,
      priority: 'high',
      proposedChanges: {
        newStartTime: newTime,
      },
      impact: {},
    };
  }

  /**
   * Crée une suggestion de regroupement
   */
  private createGroupingSuggestion(
    group: TaskGroup,
    tasks: Task[]
  ): OptimizationSuggestion {
    const groupTasks = tasks.filter((t) => group.taskIds.includes(t.id));

    return {
      id: `group-${group.id}`,
      type: 'group',
      taskIds: group.taskIds,
      title: group.name,
      reason: `${group.taskIds.length} tâches peuvent être faites ensemble`,
      confidence: 80,
      priority: 'medium',
      proposedChanges: {
        groupWith: group.taskIds,
      },
      impact: {
        timeSaved: group.timeSaved,
        distanceSaved: group.distanceSaved,
      },
    };
  }

  /**
   * Trouve un créneau le matin
   */
  private findMorningSlot(
    task: Task,
    context: OptimizationContext
  ): Date | null {
    const tomorrow = new Date(context.currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Vérifier si disponible
    const duration = task.duration || 30;
    const slotEnd = new Date(tomorrow.getTime() + duration * 60000);

    const hasConflict = context.calendarEvents.some(
      (event) => tomorrow < event.endTime && slotEnd > event.startTime
    );

    return hasConflict ? null : tomorrow;
  }

  /**
   * Formate une heure
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Met à jour les poids de scoring
   */
  updateScoringWeights(weights: Partial<ScoringCriteria>): void {
    this.scoringWeights = { ...this.scoringWeights, ...weights };
  }
}

export default new TaskOptimizationService();
