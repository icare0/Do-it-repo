import { Task } from '@/types';
import { format, getDay, getHours, isSameDay } from 'date-fns';

interface SuggestionPattern {
  title: string;
  category?: string;
  dayOfWeek?: number; // 0-6
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  frequency: number; // Combien de fois cette tâche a été créée
  lastCreated: Date;
}

/**
 * Service de suggestions prédictives
 * Apprend des habitudes de l'utilisateur pour suggérer des tâches
 */
class PredictiveSuggestionsService {
  private patterns: Map<string, SuggestionPattern> = new Map();

  /**
   * Analyse l'historique des tâches pour détecter les patterns
   */
  analyzeTaskHistory(tasks: Task[]) {
    const patternMap = new Map<string, SuggestionPattern>();

    for (const task of tasks) {
      if (!task.startDate) continue;

      const key = this.normalizeTaskTitle(task.title);
      const dayOfWeek = getDay(task.startDate);
      const hour = getHours(task.startDate);
      const timeOfDay = this.getTimeOfDay(hour);

      if (patternMap.has(key)) {
        const existing = patternMap.get(key)!;
        existing.frequency++;
        existing.lastCreated = task.createdAt;
      } else {
        patternMap.set(key, {
          title: task.title,
          category: task.category,
          dayOfWeek,
          timeOfDay,
          frequency: 1,
          lastCreated: task.createdAt,
        });
      }
    }

    this.patterns = patternMap;
  }

  /**
   * Obtient des suggestions pour le contexte actuel
   */
  getSuggestions(
    currentDate: Date = new Date(),
    existingTodayTasks: Task[] = []
  ): string[] {
    const suggestions: Array<{ title: string; score: number }> = [];
    const currentDayOfWeek = getDay(currentDate);
    const currentHour = getHours(currentDate);
    const currentTimeOfDay = this.getTimeOfDay(currentHour);

    // Titres des tâches déjà créées aujourd'hui (pour éviter les duplicatas)
    const todayTitles = existingTodayTasks.map(t => this.normalizeTaskTitle(t.title));

    for (const [key, pattern] of this.patterns.entries()) {
      // Skip si déjà créé aujourd'hui
      if (todayTitles.includes(key)) {
        continue;
      }

      let score = pattern.frequency * 10; // Score de base basé sur la fréquence

      // Bonus si même jour de la semaine
      if (pattern.dayOfWeek === currentDayOfWeek) {
        score += 50;
      }

      // Bonus si même moment de la journée
      if (pattern.timeOfDay === currentTimeOfDay) {
        score += 30;
      }

      // Pénalité si tâche trop récente (< 7 jours)
      const daysSinceLastCreated = Math.floor(
        (currentDate.getTime() - pattern.lastCreated.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastCreated < 7) {
        score -= 20;
      }

      suggestions.push({ title: pattern.title, score });
    }

    // Trier par score décroissant et retourner top 5
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.title);
  }

  /**
   * Suggestions contextuelles selon l'heure et le jour
   */
  getContextualSuggestions(currentDate: Date = new Date()): string[] {
    const dayOfWeek = getDay(currentDate);
    const hour = getHours(currentDate);
    const suggestions: string[] = [];

    // Lundi matin
    if (dayOfWeek === 1 && hour >= 8 && hour <= 10) {
      suggestions.push('☕ Planifier la semaine', '📋 Préparer réunions', '📧 Répondre emails');
    }

    // Vendredi après-midi/soir
    if (dayOfWeek === 5 && hour >= 16) {
      suggestions.push('📋 Préparer le weekend', '🧹 Ranger bureau', '✅ Clôturer dossiers');
    }

    // Weekend (samedi/dimanche)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      suggestions.push(
        '🛒 Faire les courses',
        '🏃 Sport / Activité physique',
        '👨‍👩‍👧‍👦 Temps en famille',
        '📚 Lecture / Apprentissage'
      );
    }

    // Dimanche soir
    if (dayOfWeek === 0 && hour >= 18) {
      suggestions.push('📅 Préparer semaine prochaine', '🧺 Lessive', '🍱 Meal prep');
    }

    // Midi (tous les jours)
    if (hour >= 11 && hour <= 13) {
      suggestions.push('🍽️ Préparer déjeuner');
    }

    // Soir (tous les jours)
    if (hour >= 18 && hour <= 20) {
      suggestions.push('🍽️ Préparer dîner', '📖 Lecture', '🧘 Méditation');
    }

    // Tard le soir
    if (hour >= 21) {
      suggestions.push('😴 Préparer demain', '📱 Éteindre appareils', '🛏️ Routine du soir');
    }

    return suggestions;
  }

  /**
   * Détecte si une tâche est récurrente et suggère de la rendre automatique
   */
  detectRecurringTask(
    taskTitle: string,
    historicalTasks: Task[]
  ): { isRecurring: boolean; pattern?: 'daily' | 'weekly' | 'monthly'; suggestion?: string } {
    const normalized = this.normalizeTaskTitle(taskTitle);
    const matchingTasks = historicalTasks.filter(
      t => this.normalizeTaskTitle(t.title) === normalized && t.startDate
    );

    if (matchingTasks.length < 3) {
      return { isRecurring: false };
    }

    // Analyser les intervalles entre les tâches
    const sortedTasks = matchingTasks.sort((a, b) =>
      a.startDate!.getTime() - b.startDate!.getTime()
    );

    const intervals: number[] = [];
    for (let i = 1; i < sortedTasks.length; i++) {
      const daysDiff = Math.floor(
        (sortedTasks[i].startDate!.getTime() - sortedTasks[i - 1].startDate!.getTime()) /
        (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Quotidien (±1 jour de tolérance)
    if (avgInterval >= 0.5 && avgInterval <= 1.5) {
      return {
        isRecurring: true,
        pattern: 'daily',
        suggestion: `Cette tâche semble quotidienne. Voulez-vous la rendre récurrente ?`,
      };
    }

    // Hebdomadaire (±2 jours de tolérance)
    if (avgInterval >= 5 && avgInterval <= 9) {
      return {
        isRecurring: true,
        pattern: 'weekly',
        suggestion: `Cette tâche semble hebdomadaire. Voulez-vous la rendre récurrente ?`,
      };
    }

    // Mensuel (±5 jours de tolérance)
    if (avgInterval >= 25 && avgInterval <= 35) {
      return {
        isRecurring: true,
        pattern: 'monthly',
        suggestion: `Cette tâche semble mensuelle. Voulez-vous la rendre récurrente ?`,
      };
    }

    return { isRecurring: false };
  }

  /**
   * Suggère des tâches manquantes basées sur les habitudes
   */
  suggestMissingTasks(
    todayTasks: Task[],
    historicalTasks: Task[]
  ): Array<{ title: string; reason: string }> {
    const suggestions: Array<{ title: string; reason: string }> = [];
    const today = new Date();
    const dayOfWeek = getDay(today);

    // Analyser les tâches habituelles pour ce jour
    const usualTasksForThisDay = historicalTasks.filter(t => {
      if (!t.startDate) return false;
      return getDay(t.startDate) === dayOfWeek && t.completed;
    });

    const taskTitles = new Map<string, number>();
    for (const task of usualTasksForThisDay) {
      const key = this.normalizeTaskTitle(task.title);
      taskTitles.set(key, (taskTitles.get(key) || 0) + 1);
    }

    // Tâches déjà planifiées aujourd'hui
    const todayTitles = todayTasks.map(t => this.normalizeTaskTitle(t.title));

    // Suggérer les tâches manquantes
    for (const [title, frequency] of taskTitles.entries()) {
      if (frequency >= 3 && !todayTitles.includes(title)) {
        suggestions.push({
          title: this.patterns.get(title)?.title || title,
          reason: `Vous faites habituellement cette tâche le ${this.getDayName(dayOfWeek)}`,
        });
      }
    }

    return suggestions.slice(0, 3); // Top 3
  }

  /**
   * Normalise un titre de tâche pour la comparaison
   */
  private normalizeTaskTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Détermine le moment de la journée selon l'heure
   */
  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Retourne le nom du jour
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[dayOfWeek];
  }
}

export const predictiveSuggestionsService = new PredictiveSuggestionsService();
