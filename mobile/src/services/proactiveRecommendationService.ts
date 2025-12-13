/**
 * Service de recommandations proactives
 * Analyse les tâches et suggère des améliorations
 */

import { Task } from '../types';
import {
  ProactiveRecommendation,
  RecommendationAction,
  TaskTemplate,
} from '../types/optimization';
import habitLearningService from './habitLearningService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECOMMENDATIONS_KEY = 'proactive_recommendations';
const DISMISSED_KEY = 'dismissed_recommendations';
const RECOMMENDATION_EXPIRY = 259200000; // 3 jours

/**
 * Templates de tâches prédéfinis
 */
const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'grocery_list',
    name: 'Liste de courses',
    category: 'courses',
    description: 'Liste détaillée pour ne rien oublier',
    suggestedSubtasks: [
      'Fruits et légumes',
      'Produits laitiers',
      'Viande et poisson',
      'Pain et viennoiseries',
      'Produits d\'entretien',
      'Hygiène et cosmétiques',
    ],
    defaultDuration: 45,
    defaultReminder: 15,
    tags: ['magasin', 'alimentation'],
  },
  {
    id: 'gym_routine',
    name: 'Séance de sport',
    category: 'sport',
    description: 'Routine d\'entraînement',
    suggestedSubtasks: [
      'Échauffement (10 min)',
      'Cardio (20 min)',
      'Renforcement musculaire (20 min)',
      'Étirements (10 min)',
    ],
    defaultDuration: 60,
    defaultReminder: 30,
    tags: ['fitness', 'santé'],
  },
  {
    id: 'house_cleaning',
    name: 'Ménage complet',
    category: 'ménage',
    description: 'Checklist de nettoyage',
    suggestedSubtasks: [
      'Aspirateur',
      'Serpillère',
      'Poussière',
      'Salle de bain',
      'Cuisine',
      'Vitres',
    ],
    defaultDuration: 90,
    tags: ['maison', 'nettoyage'],
  },
  {
    id: 'work_project',
    name: 'Projet professionnel',
    category: 'travail',
    description: 'Gestion de projet',
    suggestedSubtasks: [
      'Planification',
      'Recherche',
      'Développement/Exécution',
      'Tests/Révision',
      'Documentation',
      'Présentation',
    ],
    defaultDuration: 120,
    tags: ['professionnel', 'projet'],
  },
];

class ProactiveRecommendationService {
  private recommendations: ProactiveRecommendation[] = [];
  private dismissedIds: Set<string> = new Set();

  /**
   * Analyse les tâches et génère des recommandations
   */
  async analyzeAndRecommend(
    tasks: Task[],
    userLocation?: { latitude: number; longitude: number }
  ): Promise<ProactiveRecommendation[]> {
    await this.loadDismissedIds();

    const newRecommendations: ProactiveRecommendation[] = [];

    // Règle 1: Tâches sans détails (titre court sans description)
    const tasksWithoutDetails = tasks.filter(
      (t) =>
        !t.completed &&
        t.title.length < 15 &&
        (!t.description || t.description.length < 10)
    );

    for (const task of tasksWithoutDetails.slice(0, 3)) {
      // Max 3
      if (!this.isDismissed(`details-${task.id}`)) {
        newRecommendations.push({
          id: `details-${task.id}`,
          type: 'add_details',
          title: 'Ajouter plus de détails ?',
          message: `"${task.title}" pourrait bénéficier de plus d'informations`,
          priority: 'low',
          actions: [
            {
              type: 'dismiss',
              label: 'Ignorer',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + RECOMMENDATION_EXPIRY),
        });
      }
    }

    // Règle 2: Courses sans liste détaillée
    const groceryTasks = tasks.filter(
      (t) =>
        !t.completed &&
        t.category?.toLowerCase().includes('course') &&
        (!t.description || t.description.split('\n').length < 3)
    );

    for (const task of groceryTasks) {
      if (!this.isDismissed(`grocery-list-${task.id}`)) {
        newRecommendations.push({
          id: `grocery-list-${task.id}`,
          type: 'create_list',
          title: 'Créer une liste de courses ?',
          message: 'Une liste détaillée vous aidera à ne rien oublier',
          priority: 'medium',
          actions: [
            {
              type: 'use_template',
              label: 'Utiliser le template',
              taskId: task.id,
              templateId: 'grocery_list',
            },
            {
              type: 'dismiss',
              label: 'Non merci',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + RECOMMENDATION_EXPIRY),
        });
      }
    }

    // Règle 3: Tâches sans localisation qui devraient en avoir
    const tasksNeedingLocation = this.detectTasksNeedingLocation(tasks);

    for (const task of tasksNeedingLocation.slice(0, 2)) {
      if (!this.isDismissed(`location-${task.id}`)) {
        const suggestedLocation =
          habitLearningService.getSuggestedLocation(task.category || '');

        newRecommendations.push({
          id: `location-${task.id}`,
          type: 'add_location',
          title: 'Ajouter une localisation ?',
          message: suggestedLocation
            ? `Vous allez généralement à "${suggestedLocation.name}" pour cette catégorie`
            : 'Cette tâche pourrait bénéficier d\'une localisation',
          priority: 'medium',
          actions: [
            {
              type: 'add_location',
              label: 'Ajouter',
              taskId: task.id,
              data: suggestedLocation,
            },
            {
              type: 'dismiss',
              label: 'Ignorer',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
        });
      }
    }

    // Règle 4: Tâches sans rappel
    const tasksWithoutReminder = tasks.filter(
      (t) =>
        !t.completed &&
        t.startDate &&
        !t.reminder &&
        t.priority !== 'low'
    );

    for (const task of tasksWithoutReminder.slice(0, 2)) {
      if (!this.isDismissed(`reminder-${task.id}`)) {
        newRecommendations.push({
          id: `reminder-${task.id}`,
          type: 'set_reminder',
          title: 'Ajouter un rappel ?',
          message: `Ne pas oublier "${task.title}"`,
          priority: task.priority === 'high' ? 'high' : 'medium',
          actions: [
            {
              type: 'set_reminder',
              label: '15 min avant',
              taskId: task.id,
              data: { minutes: 15 },
            },
            {
              type: 'set_reminder',
              label: '30 min avant',
              taskId: task.id,
              data: { minutes: 30 },
            },
            {
              type: 'dismiss',
              label: 'Non',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
        });
      }
    }

    // Règle 5: Tâches similaires pouvant être groupées
    const taskGroups = this.detectSimilarTasks(tasks);

    for (const group of taskGroups.slice(0, 2)) {
      const groupId = `group-${group.map((t) => t.id).join('-')}`;
      if (!this.isDismissed(groupId)) {
        newRecommendations.push({
          id: groupId,
          type: 'group_tasks',
          title: 'Grouper des tâches similaires ?',
          message: `${group.length} tâches de "${group[0].category}" peuvent être faites ensemble`,
          priority: 'medium',
          actions: [
            {
              type: 'group_tasks',
              label: 'Grouper',
              data: { taskIds: group.map((t) => t.id) },
            },
            {
              type: 'dismiss',
              label: 'Non',
            },
          ],
          dismissable: true,
          taskIds: group.map((t) => t.id),
          createdAt: new Date(),
        });
      }
    }

    // Règle 6: Tâches qui ne correspondent pas aux habitudes
    for (const task of tasks.filter((t) => !t.completed && t.category)) {
      const habitMatch = habitLearningService.matchesUserHabits(task);

      if (
        !habitMatch.matches &&
        habitMatch.confidence < 30 &&
        habitMatch.suggestions.length > 0 &&
        !this.isDismissed(`habits-${task.id}`)
      ) {
        newRecommendations.push({
          id: `habits-${task.id}`,
          type: 'reschedule',
          title: 'Optimiser selon vos habitudes ?',
          message: habitMatch.suggestions[0],
          priority: 'low',
          actions: [
            {
              type: 'auto_reschedule',
              label: 'Optimiser',
              taskId: task.id,
            },
            {
              type: 'dismiss',
              label: 'Garder tel quel',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
        });
      }
    }

    // Règle 7: Suggérer des templates pour nouvelles tâches
    const recentTasks = tasks.filter(
      (t) =>
        !t.completed &&
        new Date(t.createdAt).getTime() > Date.now() - 3600000 // 1h
    );

    for (const task of recentTasks) {
      const matchingTemplate = this.findMatchingTemplate(task);

      if (matchingTemplate && !this.isDismissed(`template-${task.id}`)) {
        newRecommendations.push({
          id: `template-${task.id}`,
          type: 'use_template',
          title: `Utiliser le template "${matchingTemplate.name}" ?`,
          message: 'Cela vous aidera à mieux organiser cette tâche',
          priority: 'medium',
          actions: [
            {
              type: 'use_template',
              label: 'Utiliser',
              taskId: task.id,
              templateId: matchingTemplate.id,
            },
            {
              type: 'dismiss',
              label: 'Non merci',
            },
          ],
          dismissable: true,
          taskIds: [task.id],
          createdAt: new Date(),
        });
      }
    }

    // Nettoyer les recommandations expirées
    this.recommendations = this.recommendations.filter(
      (r) => !r.expiresAt || r.expiresAt > new Date()
    );

    // Ajouter les nouvelles recommandations
    this.recommendations.push(...newRecommendations);

    // Sauvegarder
    await this.saveRecommendations();

    // Trier par priorité
    return this.recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Marque une recommandation comme vue
   */
  async markAsViewed(recommendationId: string): Promise<void> {
    const recommendation = this.recommendations.find(
      (r) => r.id === recommendationId
    );

    if (recommendation && !recommendation.viewedAt) {
      recommendation.viewedAt = new Date();
      await this.saveRecommendations();
    }
  }

  /**
   * Marque une recommandation comme actionnée
   */
  async markAsActed(recommendationId: string): Promise<void> {
    const recommendation = this.recommendations.find(
      (r) => r.id === recommendationId
    );

    if (recommendation) {
      recommendation.actedAt = new Date();
      await this.saveRecommendations();
    }
  }

  /**
   * Rejette/ignore une recommandation
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    this.dismissedIds.add(recommendationId);
    this.recommendations = this.recommendations.filter(
      (r) => r.id !== recommendationId
    );

    await this.saveDismissedIds();
    await this.saveRecommendations();
  }

  /**
   * Obtient toutes les recommandations actives
   */
  getRecommendations(): ProactiveRecommendation[] {
    return this.recommendations.filter(
      (r) => !r.expiresAt || r.expiresAt > new Date()
    );
  }

  /**
   * Obtient les recommandations non vues
   */
  getUnviewedRecommendations(): ProactiveRecommendation[] {
    return this.recommendations.filter((r) => !r.viewedAt);
  }

  /**
   * Obtient un template par ID
   */
  getTemplate(templateId: string): TaskTemplate | null {
    return TASK_TEMPLATES.find((t) => t.id === templateId) || null;
  }

  /**
   * Obtient tous les templates
   */
  getTemplates(): TaskTemplate[] {
    return TASK_TEMPLATES;
  }

  // ===== DÉTECTION =====

  /**
   * Détecte les tâches qui ont besoin d'une localisation
   */
  private detectTasksNeedingLocation(tasks: Task[]): Task[] {
    const locationKeywords = [
      'course',
      'magasin',
      'rdv',
      'rendez-vous',
      'médecin',
      'dentiste',
      'restaurant',
      'cinéma',
      'sport',
      'salle',
      'bureau',
      'travail',
    ];

    return tasks.filter((task) => {
      if (task.completed || task.location) return false;

      const text = (task.title + ' ' + (task.description || '')).toLowerCase();

      return locationKeywords.some((keyword) => text.includes(keyword));
    });
  }

  /**
   * Détecte les tâches similaires
   */
  private detectSimilarTasks(tasks: Task[]): Task[][] {
    const groups: Task[][] = [];
    const incompleteTasks = tasks.filter((t) => !t.completed);

    // Grouper par catégorie
    const byCategory: { [key: string]: Task[] } = {};

    incompleteTasks.forEach((task) => {
      const category = task.category || 'aucune';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(task);
    });

    // Ne garder que les groupes de 2+ tâches
    for (const [, tasks] of Object.entries(byCategory)) {
      if (tasks.length >= 2) {
        groups.push(tasks);
      }
    }

    return groups;
  }

  /**
   * Trouve un template correspondant à une tâche
   */
  private findMatchingTemplate(task: Task): TaskTemplate | null {
    for (const template of TASK_TEMPLATES) {
      // Correspondance par catégorie
      if (
        task.category &&
        template.category.toLowerCase() === task.category.toLowerCase()
      ) {
        return template;
      }

      // Correspondance par mots-clés dans le titre
      const text = task.title.toLowerCase();
      const templateKeywords = template.tags || [];

      if (templateKeywords.some((keyword) => text.includes(keyword))) {
        return template;
      }
    }

    return null;
  }

  /**
   * Vérifie si une recommandation a été rejetée
   */
  private isDismissed(id: string): boolean {
    return this.dismissedIds.has(id);
  }

  // ===== PERSISTANCE =====

  /**
   * Charge les recommandations
   */
  private async loadRecommendations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(RECOMMENDATIONS_KEY);
      if (stored) {
        this.recommendations = JSON.parse(stored, (key, value) => {
          // Convertir les dates
          if (
            key === 'createdAt' ||
            key === 'expiresAt' ||
            key === 'viewedAt' ||
            key === 'actedAt'
          ) {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }

  /**
   * Sauvegarde les recommandations
   */
  private async saveRecommendations(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        RECOMMENDATIONS_KEY,
        JSON.stringify(this.recommendations)
      );
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  /**
   * Charge les IDs rejetés
   */
  private async loadDismissedIds(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(DISMISSED_KEY);
      if (stored) {
        this.dismissedIds = new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading dismissed IDs:', error);
    }
  }

  /**
   * Sauvegarde les IDs rejetés
   */
  private async saveDismissedIds(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(Array.from(this.dismissedIds))
      );
    } catch (error) {
      console.error('Error saving dismissed IDs:', error);
    }
  }

  /**
   * Nettoie toutes les données
   */
  async clearAll(): Promise<void> {
    this.recommendations = [];
    this.dismissedIds.clear();
    await AsyncStorage.multiRemove([RECOMMENDATIONS_KEY, DISMISSED_KEY]);
  }
}

export default new ProactiveRecommendationService();
