import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Location } from '@/types';
import { locationService } from './locationService';

interface TaskContext {
  keyword: string;
  location?: Location;
  category?: string;
  commonTimes?: string[];
  relatedTasks?: string[];
}

interface UserPreference {
  taskType: string;
  defaultLocation?: Location;
  defaultCategory?: string;
  defaultDuration?: number;
  frequency: number; // How many times user created this type of task
}

class SmartTaskService {
  private contextCache: Map<string, TaskContext> = new Map();
  private userPreferences: Map<string, UserPreference> = new Map();
  private readonly STORAGE_KEY = 'smart_task_preferences';
  private readonly MIN_SIMILARITY_SCORE = 0.6;

  async initialize() {
    await this.loadPreferences();
  }

  private async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        this.userPreferences = new Map(Object.entries(prefs));
      }
    } catch (error) {
      console.error('Error loading smart task preferences:', error);
    }
  }

  private async savePreferences() {
    try {
      const prefs = Object.fromEntries(this.userPreferences);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving smart task preferences:', error);
    }
  }

  /**
   * Learn from a task creation to improve future suggestions
   */
  async learnFromTask(task: Task) {
    const keywords = this.extractKeywords(task.title);

    for (const keyword of keywords) {
      const existing = this.userPreferences.get(keyword) || {
        taskType: keyword,
        frequency: 0,
      };

      existing.frequency++;

      if (task.location && !existing.defaultLocation) {
        existing.defaultLocation = task.location;
      }

      if (task.category && !existing.defaultCategory) {
        existing.defaultCategory = task.category;
      }

      if (task.duration && !existing.defaultDuration) {
        existing.defaultDuration = task.duration;
      }

      this.userPreferences.set(keyword, existing);
    }

    await this.savePreferences();
  }

  /**
   * Get contextual suggestions based on task input
   */
  async getSuggestions(input: string): Promise<{
    location?: Location;
    category?: string;
    duration?: number;
    relatedTasks?: Task[];
    questions?: string[];
  }> {
    const keywords = this.extractKeywords(input);
    const suggestions: any = {};
    const questions: string[] = [];

    for (const keyword of keywords) {
      const pref = this.userPreferences.get(keyword);
      if (pref) {
        if (pref.defaultLocation) {
          suggestions.location = pref.defaultLocation;
        }
        if (pref.defaultCategory && !suggestions.category) {
          suggestions.category = pref.defaultCategory;
        }
        if (pref.defaultDuration && !suggestions.duration) {
          suggestions.duration = pref.defaultDuration;
        }
      }
    }

    // Generate contextual questions
    if (input.toLowerCase().includes('sport') || input.toLowerCase().includes('salle')) {
      questions.push('À quelle salle de sport allez-vous ?');
    }

    if (input.toLowerCase().includes('acheter') && !input.toLowerCase().includes('où')) {
      questions.push('Dans quel magasin préférez-vous faire vos courses ?');
    }

    if (input.toLowerCase().includes('rdv') || input.toLowerCase().includes('rendez-vous')) {
      questions.push('Où se trouve le rendez-vous ?');
    }

    suggestions.questions = questions;
    return suggestions;
  }

  /**
   * Find similar tasks that could be grouped together
   */
  findSimilarTasks(newTask: Task, existingTasks: Task[]): {
    similarTasks: Task[];
    groupSuggestion?: string;
  } {
    const similarTasks: Task[] = [];
    const newKeywords = this.extractKeywords(newTask.title);

    for (const task of existingTasks) {
      if (task.completed) continue;

      const similarity = this.calculateSimilarity(newTask, task);

      if (similarity >= this.MIN_SIMILARITY_SCORE) {
        similarTasks.push(task);
      }
    }

    let groupSuggestion: string | undefined;

    if (similarTasks.length > 0) {
      const categories = ['acheter', 'courses', 'travail', 'sport'];
      for (const category of categories) {
        if (newTask.title.toLowerCase().includes(category)) {
          groupSuggestion = `J'ai trouvé ${similarTasks.length} tâche(s) similaire(s). Voulez-vous les regrouper ?`;
          break;
        }
      }
    }

    return { similarTasks, groupSuggestion };
  }

  /**
   * Calculate similarity score between two tasks
   */
  private calculateSimilarity(task1: Task, task2: Task): number {
    let score = 0;
    const keywords1 = new Set(this.extractKeywords(task1.title));
    const keywords2 = new Set(this.extractKeywords(task2.title));

    // Keyword overlap
    const commonKeywords = [...keywords1].filter(k => keywords2.has(k));
    const keywordScore = commonKeywords.length / Math.max(keywords1.size, keywords2.size);
    score += keywordScore * 0.4;

    // Category match
    if (task1.category && task2.category && task1.category === task2.category) {
      score += 0.3;
    }

    // Location proximity
    if (task1.location && task2.location) {
      const distance = locationService.calculateDistance(
        task1.location.latitude,
        task1.location.longitude,
        task2.location.latitude,
        task2.location.longitude
      );

      if (distance < 0.5) { // Within 500m
        score += 0.3;
      } else if (distance < 2) { // Within 2km
        score += 0.15;
      }
    }

    return score;
  }

  /**
   * Get nearby tasks based on current location
   */
  async getNearbyTasks(tasks: Task[], currentLocation?: { latitude: number; longitude: number }): Promise<Task[]> {
    if (!currentLocation) {
      const location = await locationService.getCurrentLocation();
      if (!location) return [];
      currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }

    const tasksWithLocation = tasks.filter(t => t.location && !t.completed);

    // Calculate distance and sort
    const tasksWithDistance = tasksWithLocation.map(task => {
      const distance = locationService.calculateDistance(
        currentLocation!.latitude,
        currentLocation!.longitude,
        task.location!.latitude,
        task.location!.longitude
      );

      return { task, distance };
    });

    // Sort by distance and return tasks within 5km
    return tasksWithDistance
      .filter(t => t.distance < 5)
      .sort((a, b) => a.distance - b.distance)
      .map(t => t.task);
  }

  /**
   * Extract meaningful keywords from task title
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux',
      'et', 'ou', 'pour', 'avec', 'dans', 'sur', 'ce', 'cette', 'ces',
      'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Take top 5 keywords
  }

  /**
   * Check if user has been at a task location for a while and suggest completion
   */
  async checkTaskCompletion(tasks: Task[], currentLocation: { latitude: number; longitude: number }): Promise<Task | null> {
    const PROXIMITY_THRESHOLD = 0.1; // 100 meters

    for (const task of tasks) {
      if (task.completed || !task.location) continue;

      const distance = locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        task.location.latitude,
        task.location.longitude
      );

      if (distance < PROXIMITY_THRESHOLD) {
        return task;
      }
    }

    return null;
  }

  /**
   * Generate smart notification based on context
   */
  async generateSmartNotification(task: Task, context: 'location' | 'time' | 'weather'): Promise<{
    title: string;
    body: string;
  } | null> {
    if (context === 'location' && task.location) {
      return {
        title: `Tâche à proximité`,
        body: `"${task.title}" - Vous êtes près de ${task.location.name}`,
      };
    }

    if (context === 'time' && task.startDate) {
      const now = new Date();
      const diff = task.startDate.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);

      if (minutes <= 15 && minutes > 0) {
        return {
          title: `Tâche imminente`,
          body: `"${task.title}" commence dans ${minutes} minutes`,
        };
      }
    }

    return null;
  }
}

export const smartTaskService = new SmartTaskService();
