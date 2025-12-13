/**
 * Service d'apprentissage des habitudes utilisateur
 * Utilise des statistiques simples pour détecter les patterns
 */

import { Task } from '../types';
import { UserPattern, TaskCompletion } from '../types/optimization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PATTERNS_CACHE_KEY = 'user_patterns_cache';
const CACHE_DURATION = 86400000; // 24 heures
const MIN_SAMPLE_SIZE = 3; // Minimum de tâches pour détecter un pattern

interface PatternCache {
  patterns: UserPattern[];
  timestamp: number;
}

class HabitLearningService {
  private patterns: UserPattern[] = [];
  private lastUpdate: Date | null = null;

  /**
   * Analyse l'historique des tâches et met à jour les patterns
   */
  async analyzeUserPatterns(completedTasks: Task[]): Promise<UserPattern[]> {
    // Vérifier le cache
    const cached = await this.getCachedPatterns();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      this.patterns = cached.patterns;
      return this.patterns;
    }

    // Convertir les tâches en TaskCompletion
    const completions: TaskCompletion[] = completedTasks
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

    // Grouper par catégorie
    const byCategory = this.groupBy(completions, 'category');

    const patterns: UserPattern[] = [];

    for (const [category, tasks] of Object.entries(byCategory)) {
      if (tasks.length < MIN_SAMPLE_SIZE) continue;

      const pattern = this.analyzeCategory(category, tasks);
      patterns.push(pattern);
    }

    this.patterns = patterns;
    this.lastUpdate = new Date();

    // Mettre en cache
    await this.cachePatterns(patterns);

    return patterns;
  }

  /**
   * Analyse une catégorie spécifique
   */
  private analyzeCategory(
    category: string,
    completions: TaskCompletion[]
  ): UserPattern {
    // 1. Jours préférés
    const days = completions.map((c) => c.dayOfWeek);
    const preferredDays = this.findMostFrequent(days, 2);

    // 2. Heures préférées
    const hours = completions.map((c) => c.timeOfDay);
    const preferredHours = this.findMostFrequent(hours, 3);

    // 3. Durée moyenne
    const durations = completions.map((c) => c.duration);
    const averageDuration = this.average(durations);

    // 4. Lieux fréquents
    const frequentLocations = this.findFrequentLocations(completions);

    // 5. Taux de complétion
    const completionRate = 1.0; // Toutes sont complétées par définition

    // 6. Niveau d'énergie moyen
    const energyLevel = this.determineEnergyLevel(preferredHours);

    return {
      category,
      preferredDays,
      preferredHours,
      averageDuration,
      frequentLocations,
      completionRate,
      energyLevel,
      sampleSize: completions.length,
    };
  }

  /**
   * Suggère le meilleur moment pour une catégorie
   */
  getSuggestedTimeSlot(category: string): {
    day: number;
    hour: number;
  } | null {
    const pattern = this.patterns.find((p) => p.category === category);

    if (!pattern || pattern.sampleSize < MIN_SAMPLE_SIZE) {
      return null;
    }

    return {
      day: pattern.preferredDays[0] || new Date().getDay(),
      hour: pattern.preferredHours[0] || 9,
    };
  }

  /**
   * Suggère une durée pour une catégorie
   */
  getSuggestedDuration(category: string): number | null {
    const pattern = this.patterns.find((p) => p.category === category);
    return pattern ? Math.round(pattern.averageDuration) : null;
  }

  /**
   * Suggère une localisation fréquente pour une catégorie
   */
  getSuggestedLocation(
    category: string
  ): { name: string; latitude: number; longitude: number } | null {
    const pattern = this.patterns.find((p) => p.category === category);

    if (!pattern || pattern.frequentLocations.length === 0) {
      return null;
    }

    return pattern.frequentLocations[0];
  }

  /**
   * Prédit le niveau d'énergie pour une heure donnée
   */
  predictEnergyLevel(hour: number): 'high' | 'medium' | 'low' {
    if (hour >= 8 && hour <= 11) {
      return 'high'; // Matin
    } else if (hour >= 14 && hour <= 17) {
      return 'medium'; // Après-midi
    } else {
      return 'low'; // Soir/nuit
    }
  }

  /**
   * Détecte si une tâche correspond aux habitudes
   */
  matchesUserHabits(task: Task): {
    matches: boolean;
    confidence: number;
    suggestions: string[];
  } {
    if (!task.category) {
      return { matches: false, confidence: 0, suggestions: [] };
    }

    const pattern = this.patterns.find((p) => p.category === task.category);

    if (!pattern || pattern.sampleSize < MIN_SAMPLE_SIZE) {
      return {
        matches: false,
        confidence: 0,
        suggestions: ['Pas assez de données pour cette catégorie'],
      };
    }

    const suggestions: string[] = [];
    let matchScore = 0;
    const totalChecks = 4;

    // Vérifier le jour
    if (task.startDate) {
      const taskDay = task.startDate.getDay();
      if (pattern.preferredDays.includes(taskDay)) {
        matchScore++;
      } else {
        suggestions.push(
          `Vous faites généralement cette catégorie le ${this.getDayName(
            pattern.preferredDays[0]
          )}`
        );
      }
    }

    // Vérifier l'heure
    if (task.startDate) {
      const taskHour = task.startDate.getHours();
      if (pattern.preferredHours.includes(taskHour)) {
        matchScore++;
      } else {
        suggestions.push(
          `Vous préférez généralement cette catégorie vers ${pattern.preferredHours[0]}h`
        );
      }
    }

    // Vérifier la durée
    if (task.duration) {
      const durationDiff = Math.abs(task.duration - pattern.averageDuration);
      if (durationDiff <= 15) {
        // Tolérance de 15 minutes
        matchScore++;
      } else {
        suggestions.push(
          `Durée habituelle: ${Math.round(pattern.averageDuration)} minutes`
        );
      }
    }

    // Vérifier la localisation
    if (task.location && pattern.frequentLocations.length > 0) {
      const isFrequentLocation = pattern.frequentLocations.some((loc) => {
        const distance = this.calculateDistance(
          { latitude: loc.latitude, longitude: loc.longitude },
          { latitude: task.location!.latitude, longitude: task.location!.longitude }
        );
        return distance < 500; // 500 mètres de tolérance
      });

      if (isFrequentLocation) {
        matchScore++;
      } else {
        suggestions.push(
          `Lieu habituel: ${pattern.frequentLocations[0].name}`
        );
      }
    }

    const confidence = (matchScore / totalChecks) * 100;
    const matches = confidence >= 50;

    return { matches, confidence, suggestions };
  }

  /**
   * Obtient tous les patterns
   */
  getPatterns(): UserPattern[] {
    return this.patterns;
  }

  /**
   * Obtient un pattern spécifique
   */
  getPattern(category: string): UserPattern | null {
    return this.patterns.find((p) => p.category === category) || null;
  }

  // ===== ANALYSE DES LOCALISATIONS =====

  /**
   * Trouve les localisations fréquentes
   */
  private findFrequentLocations(
    completions: TaskCompletion[]
  ): Array<{
    name: string;
    latitude: number;
    longitude: number;
    frequency: number;
  }> {
    const locationsWithName = completions.filter((c) => c.location);

    if (locationsWithName.length === 0) return [];

    // Grouper les localisations proches (< 200m)
    const clusters: Array<{
      locations: TaskCompletion[];
      centroid: { latitude: number; longitude: number };
    }> = [];

    for (const completion of locationsWithName) {
      if (!completion.location) continue;

      let addedToCluster = false;

      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          completion.location,
          cluster.centroid
        );

        if (distance < 200) {
          // 200 mètres
          cluster.locations.push(completion);
          // Recalculer le centroid
          cluster.centroid = this.calculateCentroid(
            cluster.locations.map((l) => l.location!)
          );
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          locations: [completion],
          centroid: completion.location,
        });
      }
    }

    // Trier par fréquence
    const sorted = clusters.sort(
      (a, b) => b.locations.length - a.locations.length
    );

    // Retourner les top 3
    return sorted.slice(0, 3).map((cluster, index) => ({
      name: `Lieu fréquent ${index + 1}`,
      latitude: cluster.centroid.latitude,
      longitude: cluster.centroid.longitude,
      frequency: cluster.locations.length,
    }));
  }

  /**
   * Calcule le centroid d'un groupe de points
   */
  private calculateCentroid(
    points: Array<{ latitude: number; longitude: number }>
  ): { latitude: number; longitude: number } {
    const sum = points.reduce(
      (acc, p) => ({
        latitude: acc.latitude + p.latitude,
        longitude: acc.longitude + p.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length,
    };
  }

  // ===== UTILITAIRES =====

  /**
   * Groupe un tableau par propriété
   */
  private groupBy<T>(
    array: T[],
    key: keyof T
  ): { [key: string]: T[] } {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as { [key: string]: T[] });
  }

  /**
   * Trouve les N éléments les plus fréquents
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
   * Calcule la moyenne
   */
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Détermine le niveau d'énergie basé sur les heures préférées
   */
  private determineEnergyLevel(
    preferredHours: number[]
  ): 'high' | 'medium' | 'low' {
    if (preferredHours.length === 0) return 'medium';

    const avgHour =
      preferredHours.reduce((sum, h) => sum + h, 0) / preferredHours.length;

    if (avgHour >= 8 && avgHour <= 11) {
      return 'high';
    } else if (avgHour >= 14 && avgHour <= 17) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Obtient le nom du jour
   */
  private getDayName(day: number): string {
    const days = [
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
    ];
    return days[day] || '';
  }

  /**
   * Calcule la distance entre deux points
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3;
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ===== CACHE =====

  /**
   * Récupère les patterns du cache
   */
  private async getCachedPatterns(): Promise<PatternCache | null> {
    try {
      const cached = await AsyncStorage.getItem(PATTERNS_CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error reading patterns cache:', error);
      return null;
    }
  }

  /**
   * Met en cache les patterns
   */
  private async cachePatterns(patterns: UserPattern[]): Promise<void> {
    try {
      const cache: PatternCache = {
        patterns,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(PATTERNS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching patterns:', error);
    }
  }

  /**
   * Nettoie le cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PATTERNS_CACHE_KEY);
      this.patterns = [];
      this.lastUpdate = null;
    } catch (error) {
      console.error('Error clearing patterns cache:', error);
    }
  }
}

export default new HabitLearningService();
