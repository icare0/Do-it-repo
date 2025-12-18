/**
 * Types for Custom AI Engine
 * Intelligent task understanding without external APIs
 */

export interface ParsedResult {
  // Core fields
  title: string;
  originalInput: string;
  confidence: number;

  // Temporal information
  date?: Date;
  endDate?: Date;
  deadline?: Date;
  hasSpecificTime: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  suggestedTimeSlot?: {
    start: number; // 0-23
    end: number;
  };

  // Task metadata
  duration?: number; // minutes
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];

  // Location
  location?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  // Recurring
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };

  // AI metadata
  intent?: string; // 'shopping', 'call', 'meeting', 'work', etc.
  detectedEntities?: DetectedEntity[];
  requiresClarification?: boolean;
  clarificationQuestions?: string[];
  needsContactInfo?: boolean;
  needsLocationInfo?: boolean;

  // Learning
  alternatives?: AlternativeInterpretation[];
  userFeedback?: UserFeedback;
}

export interface DetectedEntity {
  type: 'person' | 'place' | 'thing' | 'time' | 'action';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface AlternativeInterpretation {
  description: string;
  confidence: number;
  changes: Partial<ParsedResult>;
}

export interface UserContext {
  userId: string;
  recentTasks?: any[];
  userHabits?: {
    preferredDays?: number[];
    preferredHours?: number[];
    commonCategories?: string[];
    commonLocations?: Array<{ name: string; frequency: number }>;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTime?: Date;
}

export interface TemporalPattern {
  pattern: RegExp;
  extract: (match: RegExpMatchArray, context?: UserContext) => TemporalResult;
  description: string;
  examples: string[];
}

export interface TemporalResult {
  date?: Date;
  endDate?: Date;
  deadline?: Date;
  hasSpecificTime: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  suggestedTimeSlot?: { start: number; end: number };
  confidence: number;
  flexibility?: 'strict' | 'flexible' | 'range' | 'deadline';
}

export interface IntentPattern {
  keywords: string[];
  intent: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  requiresContact?: boolean;
  requiresLocation?: boolean;
  requiresAmount?: boolean;
  confidence: number;
  examples: string[];
}

export interface LocationPattern {
  pattern?: RegExp;
  keywords?: string[];
  extract?: (match: RegExpMatchArray) => LocationResult;
  needsClarification?: boolean;
  genericTerms?: string[];
}

export interface LocationResult {
  locationName?: string;
  confidence: number;
  needsClarification?: boolean;
  suggestions?: string[];
}

export interface PriorityPattern {
  keywords: string[];
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface LearnedPattern {
  key: string;
  type: 'location' | 'temporal' | 'intent' | 'category' | 'priority';
  replacement?: any;
  hasSpecificTime?: boolean;
  suggestedTimeSlot?: { start: number; end: number };
  confidence: number;
  usageCount: number;
  lastUsed: Date;
  userId?: string;
}

export interface UserCorrection {
  taskId: string;
  originalInput: string;
  parsedResult: ParsedResult;

  // What was corrected
  correctTitle?: string;
  correctDate?: Date;
  correctHasSpecificTime?: boolean;
  correctTimeOfDay?: string;
  correctSuggestedTimeSlot?: { start: number; end: number };
  correctIntent?: string;
  correctCategory?: string;
  correctPriority?: 'low' | 'medium' | 'high';
  correctLocation?: { name: string; address?: string; latitude?: number; longitude?: number };
  correctDuration?: number;

  // Metadata
  changed: boolean;
  temporalCorrect?: boolean;
  intentCorrect?: boolean;
  locationCorrect?: boolean;
  timestamp: Date;
}

export interface UserFeedback {
  wasCorrect: boolean;
  corrections?: string[];
  rating?: number; // 1-5
  comment?: string;
}

export interface TrainingExample {
  text: string;
  intent: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  hasSpecificTime?: boolean;
  timeOfDay?: string;
}

export interface IntentPrediction {
  intent: string;
  confidence: number;
  probabilities: { [intent: string]: number };
  alternatives?: Array<{ intent: string; confidence: number }>;
}

export interface AccuracyMetrics {
  overallAccuracy: number;
  intentAccuracy: number;
  temporalAccuracy: number;
  locationAccuracy: number;
  categoryAccuracy: number;
  priorityAccuracy: number;
  totalPredictions: number;
  totalCorrections: number;
  learningRate: number; // How fast the AI improves
}

export interface AnalyticsData {
  metrics: AccuracyMetrics;
  recentPredictions: Array<{
    input: string;
    prediction: ParsedResult;
    wasCorrect: boolean;
    timestamp: Date;
  }>;
  learnedPatterns: LearnedPattern[];
  improvementOverTime: Array<{
    date: Date;
    accuracy: number;
  }>;
}
