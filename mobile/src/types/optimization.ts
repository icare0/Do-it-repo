/**
 * Types pour le système d'optimisation intelligente de tâches
 */

import { Task } from './index';

/**
 * Contexte d'optimisation - toutes les données nécessaires pour prendre des décisions
 */
export interface OptimizationContext {
  currentTime: Date;
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  weather: {
    temperature: number;
    condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
    precipitation: number;
    windSpeed: number;
    humidity: number;
  };
  calendarEvents: CalendarEvent[];
  userEnergy: 'high' | 'medium' | 'low';
  taskHistory: TaskCompletion[];
  tasks: Task[];
}

/**
 * Événement du calendrier
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  isAllDay: boolean;
}

/**
 * Historique de complétion de tâche
 */
export interface TaskCompletion {
  taskId: string;
  category: string;
  completedAt: Date;
  duration: number; // minutes
  location?: {
    latitude: number;
    longitude: number;
  };
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
}

/**
 * Suggestion d'optimisation
 */
export interface OptimizationSuggestion {
  id: string;
  type: 'reschedule' | 'reorder' | 'group' | 'skip' | 'split' | 'combine';
  taskIds: string[];
  title: string;
  reason: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  proposedChanges: {
    newStartTime?: Date;
    newEndTime?: Date;
    newLocation?: {
      name: string;
      latitude: number;
      longitude: number;
    };
    groupWith?: string[]; // Task IDs to group with
    newOrder?: number;
  };
  impact: {
    timeSaved?: number; // minutes
    distanceSaved?: number; // meters
    energySaved?: number; // 0-100
    stressReduced?: number; // 0-100
  };
  acceptedAt?: Date;
  rejectedAt?: Date;
}

/**
 * Conflit détecté entre tâches ou événements
 */
export interface Conflict {
  id: string;
  type: 'time_overlap' | 'location_conflict' | 'energy_overload' | 'impossible_travel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  involvedTasks: string[];
  involvedEvents?: string[];
  description: string;
  suggestedResolution?: OptimizationSuggestion;
}

/**
 * Slot de temps disponible
 */
export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  score?: number;
  isAvailable: boolean;
  conflicts: string[];
}

/**
 * Groupe de tâches
 */
export interface TaskGroup {
  id: string;
  type: 'location' | 'category' | 'time' | 'theme';
  taskIds: string[];
  name: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  score: number;
  timeSaved?: number;
  distanceSaved?: number;
}

/**
 * Pattern d'habitude utilisateur
 */
export interface UserPattern {
  category: string;
  preferredDays: number[]; // 0-6 (dimanche-samedi)
  preferredHours: number[]; // 0-23
  averageDuration: number; // minutes
  frequentLocations: Array<{
    name: string;
    latitude: number;
    longitude: number;
    frequency: number;
  }>;
  completionRate: number; // 0-1
  energyLevel: 'high' | 'medium' | 'low';
  sampleSize: number;
}

/**
 * Informations de route
 */
export interface RouteInfo {
  distance: number; // mètres
  duration: number; // secondes
  steps: RouteStep[];
  polyline?: string;
  geometry?: any;
}

/**
 * Étape d'une route
 */
export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Critères de scoring pour l'optimisation
 */
export interface ScoringCriteria {
  weather: number; // Poids 0-1
  energy: number;
  location: number;
  calendar: number;
  habits: number;
  traffic: number;
  priority: number;
}

/**
 * Recommandation proactive
 */
export interface ProactiveRecommendation {
  id: string;
  type:
    | 'create_list'
    | 'add_location'
    | 'set_reminder'
    | 'group_tasks'
    | 'reschedule'
    | 'add_details'
    | 'use_template';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actions: RecommendationAction[];
  dismissable: boolean;
  taskIds?: string[];
  createdAt: Date;
  expiresAt?: Date;
  viewedAt?: Date;
  actedAt?: Date;
}

/**
 * Action de recommandation
 */
export interface RecommendationAction {
  type:
    | 'create_subtasks'
    | 'use_template'
    | 'add_location'
    | 'set_reminder'
    | 'group_tasks'
    | 'auto_reschedule'
    | 'dismiss';
  label: string;
  taskId?: string;
  templateId?: string;
  data?: any;
}

/**
 * Template de tâche
 */
export interface TaskTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  suggestedSubtasks: string[];
  defaultDuration?: number;
  defaultReminder?: number;
  tags?: string[];
}

/**
 * Statistiques d'optimisation
 */
export interface OptimizationStats {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  totalTimeSaved: number; // minutes
  totalDistanceSaved: number; // meters
  acceptanceRate: number; // 0-1
  averageConfidence: number;
  lastOptimizedAt?: Date;
}
