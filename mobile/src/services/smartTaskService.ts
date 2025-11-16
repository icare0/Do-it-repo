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
  frequency: number;
}

interface ContextualEnrichment {
  keyword: string; // ex: "salle", "magasin", "restaurant"
  specificValue: string; // ex: "Basic Fit", "Carrefour", "Le Petit Bistrot"
  location?: Location;
  usageCount: number;
  lastUsed: Date;
}

interface SmartPrompt {
  question: string;
  placeholder: string;
  icon: string;
  suggestions: string[];
  contextKey: string; // The keyword to enrich (e.g., "salle")
}

class SmartTaskService {
  private contextCache: Map<string, TaskContext> = new Map();
  private userPreferences: Map<string, UserPreference> = new Map();
  private enrichments: Map<string, ContextualEnrichment> = new Map();
  private readonly STORAGE_KEY = 'smart_task_preferences';
  private readonly ENRICHMENTS_KEY = 'contextual_enrichments';
  private readonly MIN_SIMILARITY_SCORE = 0.6;

  // Patterns that need clarification
  private readonly ambiguousPatterns = [
    {
      keywords: ['salle', 'gym', 'fitness'],
      question: 'À quelle salle de sport allez-vous ?',
      placeholder: 'Ex: Basic Fit, Fitness Park...',
      icon: 'fitness',
      suggestions: ['Basic Fit', 'Fitness Park', 'Keep Cool', 'L\'Orange Bleue'],
    },
    {
      keywords: ['magasin', 'supermarché', 'courses'],
      question: 'Dans quel magasin préférez-vous faire vos courses ?',
      placeholder: 'Ex: Carrefour, Auchan...',
      icon: 'cart',
      suggestions: ['Carrefour', 'Auchan', 'Leclerc', 'Monoprix', 'Lidl'],
    },
    {
      keywords: ['restaurant', 'resto', 'manger'],
      question: 'Quel est le nom du restaurant ?',
      placeholder: 'Ex: Le Petit Bistrot...',
      icon: 'restaurant',
      suggestions: [],
    },
    {
      keywords: ['médecin', 'docteur'],
      question: 'Quel est le nom de votre médecin ?',
      placeholder: 'Ex: Dr. Martin...',
      icon: 'medical',
      suggestions: [],
    },
    {
      keywords: ['coiffeur', 'coiffeuse'],
      question: 'Quel est le nom de votre salon de coiffure ?',
      placeholder: 'Ex: Jean Louis David...',
      icon: 'cut',
      suggestions: ['Jean Louis David', 'Franck Provost', 'Dessange'],
    },
    {
      keywords: ['gare', 'train'],
      question: 'À quelle gare ?',
      placeholder: 'Ex: Gare du Nord...',
      icon: 'train',
      suggestions: [],
    },
    {
      keywords: ['aéroport', 'avion', 'vol'],
      question: 'Quel aéroport ?',
      placeholder: 'Ex: Charles de Gaulle...',
      icon: 'airplane',
      suggestions: ['Charles de Gaulle', 'Orly', 'Beauvais'],
    },
  ];

  async initialize() {
    await this.loadPreferences();
    await this.loadEnrichments();
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

  private async loadEnrichments() {
    try {
      const stored = await AsyncStorage.getItem(this.ENRICHMENTS_KEY);
      if (stored) {
        const enrichments = JSON.parse(stored);
        this.enrichments = new Map(
          Object.entries(enrichments).map(([k, v]: [string, any]) => [
            k,
            { ...v, lastUsed: new Date(v.lastUsed) },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading enrichments:', error);
    }
  }

  private async saveEnrichments() {
    try {
      const enrichments = Object.fromEntries(this.enrichments);
      await AsyncStorage.setItem(this.ENRICHMENTS_KEY, JSON.stringify(enrichments));
    } catch (error) {
      console.error('Error saving enrichments:', error);
    }
  }

  /**
   * Detect if a task needs contextual clarification
   */
  detectSmartPrompt(taskTitle: string): SmartPrompt | null {
    const lowerTitle = taskTitle.toLowerCase();

    for (const pattern of this.ambiguousPatterns) {
      for (const keyword of pattern.keywords) {
        if (lowerTitle.includes(keyword)) {
          // Check if we already have this enrichment
          const existingEnrichment = this.enrichments.get(keyword);
          if (existingEnrichment) {
            // Don't ask again, we already know
            return null;
          }

          return {
            question: pattern.question,
            placeholder: pattern.placeholder,
            icon: pattern.icon as any,
            suggestions: pattern.suggestions,
            contextKey: keyword,
          };
        }
      }
    }

    return null;
  }

  /**
   * Save a contextual enrichment from user's answer
   */
  async saveEnrichment(contextKey: string, specificValue: string, location?: Location) {
    const enrichment: ContextualEnrichment = {
      keyword: contextKey,
      specificValue,
      location,
      usageCount: 1,
      lastUsed: new Date(),
    };

    this.enrichments.set(contextKey, enrichment);
    await this.saveEnrichments();
  }

  /**
   * Enrich a task title with learned context
   */
  enrichTaskTitle(taskTitle: string): {
    enrichedTitle: string;
    location?: Location;
    wasEnriched: boolean;
  } {
    const lowerTitle = taskTitle.toLowerCase();
    let enrichedTitle = taskTitle;
    let location: Location | undefined;
    let wasEnriched = false;

    for (const [keyword, enrichment] of this.enrichments) {
      if (lowerTitle.includes(keyword)) {
        // Replace generic keyword with specific value
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        enrichedTitle = enrichedTitle.replace(regex, enrichment.specificValue);

        if (enrichment.location) {
          location = enrichment.location;
        }

        // Update usage
        enrichment.usageCount++;
        enrichment.lastUsed = new Date();
        wasEnriched = true;
      }
    }

    if (wasEnriched) {
      this.saveEnrichments();
    }

    return { enrichedTitle, location, wasEnriched };
  }

  /**
   * Get all learned enrichments for display
   */
  getLearnedContexts(): ContextualEnrichment[] {
    return Array.from(this.enrichments.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Delete a learned context
   */
  async deleteEnrichment(keyword: string) {
    this.enrichments.delete(keyword);
    await this.saveEnrichments();
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

    // Check enrichments first
    for (const [keyword, enrichment] of this.enrichments) {
      if (input.toLowerCase().includes(keyword)) {
        if (enrichment.location) {
          suggestions.location = enrichment.location;
        }
      }
    }

    // Check preferences
    for (const keyword of keywords) {
      const pref = this.userPreferences.get(keyword);
      if (pref) {
        if (pref.defaultLocation && !suggestions.location) {
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

      if (distance < 0.5) {
        score += 0.3;
      } else if (distance < 2) {
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

    const tasksWithDistance = tasksWithLocation.map(task => {
      const distance = locationService.calculateDistance(
        currentLocation!.latitude,
        currentLocation!.longitude,
        task.location!.latitude,
        task.location!.longitude
      );

      return { task, distance };
    });

    return tasksWithDistance
      .filter(t => t.distance < 5)
      .sort((a, b) => a.distance - b.distance)
      .map(t => t.task);
  }

  /**
   * Check if user has been at a task location for a while and suggest completion
   */
  async checkTaskCompletion(tasks: Task[], currentLocation: { latitude: number; longitude: number }): Promise<Task | null> {
    const PROXIMITY_THRESHOLD = 0.1;

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
      .slice(0, 5);
  }
}

export const smartTaskService = new SmartTaskService();
