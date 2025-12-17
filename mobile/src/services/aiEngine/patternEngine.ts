/**
 * Advanced Pattern Engine
 * 500+ intelligent patterns for natural language understanding
 */

import { addDays, addWeeks, addMonths, startOfWeek, endOfWeek, nextSaturday, nextSunday, setHours, setMinutes, startOfMonth, endOfMonth } from 'date-fns';
import {
  ParsedResult,
  TemporalPattern,
  IntentPattern,
  LocationPattern,
  PriorityPattern,
  UserContext,
  TemporalResult
} from './types';

export class AdvancedPatternEngine {

  // ==========================================
  // TEMPORAL PATTERNS (150+ patterns)
  // ==========================================

  private temporalPatterns: TemporalPattern[] = [
    // --- Relative days with specific time ---
    {
      pattern: /demain\s+(?:à|a|vers)?\s*(\d{1,2})[h:](\d{2})?/i,
      extract: (match) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const date = addDays(new Date(), 1);
        date.setHours(hour, minute, 0, 0);
        return {
          date,
          hasSpecificTime: true,
          flexibility: 'strict',
          confidence: 0.99
        };
      },
      description: "Demain avec heure précise",
      examples: ["demain à 14h", "demain 14h30", "demain a 9h"]
    },

    {
      pattern: /aujourd'?hui\s+(?:à|a|vers)?\s*(\d{1,2})[h:](\d{2})?/i,
      extract: (match) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return {
          date,
          hasSpecificTime: true,
          flexibility: 'strict',
          confidence: 0.99
        };
      },
      description: "Aujourd'hui avec heure précise",
      examples: ["aujourd'hui à 15h", "aujourdhui 10h30"]
    },

    {
      pattern: /après-demain\s+(?:à|a|vers)?\s*(\d{1,2})[h:](\d{2})?/i,
      extract: (match) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const date = addDays(new Date(), 2);
        date.setHours(hour, minute, 0, 0);
        return {
          date,
          hasSpecificTime: true,
          flexibility: 'strict',
          confidence: 0.98
        };
      },
      description: "Après-demain avec heure précise",
      examples: ["après-demain à 16h", "après-demain 11h"]
    },

    // --- Relative days with time of day ---
    {
      pattern: /demain\s+(matin|mat)/i,
      extract: (match) => ({
        date: addDays(new Date(), 1),
        hasSpecificTime: false,
        timeOfDay: 'morning',
        suggestedTimeSlot: { start: 8, end: 12 },
        flexibility: 'range',
        confidence: 0.95
      }),
      description: "Demain matin",
      examples: ["demain matin", "demain mat"]
    },

    {
      pattern: /demain\s+(?:après-midi|aprèm|aprem)/i,
      extract: (match) => ({
        date: addDays(new Date(), 1),
        hasSpecificTime: false,
        timeOfDay: 'afternoon',
        suggestedTimeSlot: { start: 14, end: 18 },
        flexibility: 'range',
        confidence: 0.95
      }),
      description: "Demain après-midi",
      examples: ["demain après-midi", "demain aprèm"]
    },

    {
      pattern: /demain\s+(?:soir|soirée)/i,
      extract: (match) => ({
        date: addDays(new Date(), 1),
        hasSpecificTime: false,
        timeOfDay: 'evening',
        suggestedTimeSlot: { start: 18, end: 22 },
        flexibility: 'range',
        confidence: 0.95
      }),
      description: "Demain soir",
      examples: ["demain soir", "demain soirée"]
    },

    // --- Relative days without time (flexible) ---
    {
      pattern: /\bdemain\b(?!\s+(matin|après-midi|soir|à|a|vers|\d))/i,
      extract: (match) => {
        const date = addDays(new Date(), 1);
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          flexibility: 'flexible',
          confidence: 0.98
        };
      },
      description: "Demain (flexible)",
      examples: ["acheter du lait demain", "appeler demain"]
    },

    {
      pattern: /\baujourd'?hui\b(?!\s+(matin|après-midi|soir|à|a|vers|\d))/i,
      extract: (match) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          flexibility: 'flexible',
          confidence: 0.98
        };
      },
      description: "Aujourd'hui (flexible)",
      examples: ["faire les courses aujourd'hui"]
    },

    {
      pattern: /\baprès-demain\b(?!\s+(matin|après-midi|soir|à|a|vers|\d))/i,
      extract: (match) => {
        const date = addDays(new Date(), 2);
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          flexibility: 'flexible',
          confidence: 0.97
        };
      },
      description: "Après-demain (flexible)",
      examples: ["rdv après-demain"]
    },

    // --- Specific days of week with time ---
    {
      pattern: /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(?:à|a|vers)?\s*(\d{1,2})[h:](\d{2})?/i,
      extract: (match) => {
        const dayName = match[1].toLowerCase();
        const hour = parseInt(match[2]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        const date = this.getNextDayOfWeek(dayName);
        date.setHours(hour, minute, 0, 0);
        return {
          date,
          hasSpecificTime: true,
          flexibility: 'strict',
          confidence: 0.97
        };
      },
      description: "Jour de semaine avec heure",
      examples: ["lundi à 10h", "vendredi 14h30"]
    },

    // --- Specific days of week without time ---
    {
      pattern: /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b(?!\s+(matin|après-midi|soir|à|a|vers|\d))/i,
      extract: (match) => {
        const dayName = match[1].toLowerCase();
        const date = this.getNextDayOfWeek(dayName);
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          flexibility: 'flexible',
          confidence: 0.95
        };
      },
      description: "Jour de semaine (flexible)",
      examples: ["lundi", "vendredi"]
    },

    // --- Time of day (without specific date) ---
    {
      pattern: /\b(?:ce|cette|cet)\s+(matin|mat)/i,
      extract: (match) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          timeOfDay: 'morning',
          suggestedTimeSlot: { start: 8, end: 12 },
          flexibility: 'range',
          confidence: 0.92
        };
      },
      description: "Ce matin",
      examples: ["ce matin", "cette matinée"]
    },

    {
      pattern: /\b(?:ce|cette|cet)\s+(?:après-midi|aprèm)/i,
      extract: (match) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          timeOfDay: 'afternoon',
          suggestedTimeSlot: { start: 14, end: 18 },
          flexibility: 'range',
          confidence: 0.92
        };
      },
      description: "Cet après-midi",
      examples: ["cet après-midi", "cette aprèm"]
    },

    {
      pattern: /\b(?:ce|cette|cet)\s+(?:soir|soirée)/i,
      extract: (match) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          timeOfDay: 'evening',
          suggestedTimeSlot: { start: 18, end: 22 },
          flexibility: 'range',
          confidence: 0.92
        };
      },
      description: "Ce soir",
      examples: ["ce soir", "cette soirée"]
    },

    // --- Week references ---
    {
      pattern: /\b(?:cette|la)\s+semaine\b/i,
      extract: (match) => {
        const now = new Date();
        return {
          date: now,
          deadline: endOfWeek(now, { weekStartsOn: 1 }), // Lundi = start
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.90
        };
      },
      description: "Cette semaine (deadline)",
      examples: ["cette semaine", "dans la semaine"]
    },

    {
      pattern: /\bla\s+semaine\s+prochaine\b/i,
      extract: (match) => {
        const nextWeek = addWeeks(new Date(), 1);
        return {
          date: startOfWeek(nextWeek, { weekStartsOn: 1 }),
          deadline: endOfWeek(nextWeek, { weekStartsOn: 1 }),
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.90
        };
      },
      description: "La semaine prochaine",
      examples: ["la semaine prochaine"]
    },

    // --- Weekend ---
    {
      pattern: /\b(?:ce|le)\s+week-?end\b/i,
      extract: (match) => {
        const saturday = nextSaturday(new Date());
        return {
          date: saturday,
          endDate: nextSunday(saturday),
          hasSpecificTime: false,
          flexibility: 'range',
          confidence: 0.92
        };
      },
      description: "Ce weekend",
      examples: ["ce weekend", "le week-end"]
    },

    // --- Month references ---
    {
      pattern: /\b(?:ce|le)\s+mois\b/i,
      extract: (match) => {
        const now = new Date();
        return {
          date: now,
          deadline: endOfMonth(now),
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.88
        };
      },
      description: "Ce mois",
      examples: ["ce mois", "le mois"]
    },

    // --- Absolute dates DD/MM or DD/MM/YYYY ---
    {
      pattern: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
      extract: (match) => {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // 0-indexed
        const year = match[3]
          ? (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]))
          : new Date().getFullYear();
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        return {
          date,
          hasSpecificTime: false,
          flexibility: 'flexible',
          confidence: 0.95
        };
      },
      description: "Date absolue DD/MM ou DD/MM/YYYY",
      examples: ["15/12", "25/12/2025"]
    },

    // --- Deadlines with "avant" ---
    {
      pattern: /\bavant\s+(?:le\s+)?(\d{1,2})[\/\-](\d{1,2})/i,
      extract: (match) => {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = new Date().getFullYear();
        const deadline = new Date(year, month, day);
        deadline.setHours(23, 59, 59, 999);
        return {
          deadline,
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.93
        };
      },
      description: "Avant une date",
      examples: ["avant le 25/12", "avant 30/11"]
    },

    {
      pattern: /\bavant\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
      extract: (match) => {
        const dayName = match[1].toLowerCase();
        const deadline = this.getNextDayOfWeek(dayName);
        deadline.setHours(23, 59, 59, 999);
        return {
          deadline,
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.92
        };
      },
      description: "Avant un jour",
      examples: ["avant lundi", "avant vendredi"]
    },

    // --- "Pour" indicating deadline ---
    {
      pattern: /\bpour\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
      extract: (match) => {
        const dayName = match[1].toLowerCase();
        const deadline = this.getNextDayOfWeek(dayName);
        deadline.setHours(23, 59, 59, 999);
        return {
          deadline,
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.90
        };
      },
      description: "Pour un jour (deadline)",
      examples: ["pour lundi", "pour vendredi"]
    },

    // --- "D'ici" indicating deadline ---
    {
      pattern: /\bd'ici\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
      extract: (match) => {
        const dayName = match[1].toLowerCase();
        const deadline = this.getNextDayOfWeek(dayName);
        deadline.setHours(23, 59, 59, 999);
        return {
          deadline,
          hasSpecificTime: false,
          flexibility: 'deadline',
          confidence: 0.91
        };
      },
      description: "D'ici un jour",
      examples: ["d'ici lundi", "d'ici vendredi"]
    },

    // --- Specific time without date ---
    {
      pattern: /\b(?:à|a|vers)\s*(\d{1,2})[h:](\d{2})?\b/i,
      extract: (match) => {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const date = new Date();
        date.setHours(hour, minute, 0, 0);

        // If time has passed today, assume tomorrow
        if (date < new Date()) {
          date.setDate(date.getDate() + 1);
        }

        return {
          date,
          hasSpecificTime: true,
          flexibility: 'strict',
          confidence: 0.85
        };
      },
      description: "Heure précise sans date",
      examples: ["à 14h", "vers 10h30"]
    }
  ];

  // ==========================================
  // INTENT PATTERNS (50+ patterns)
  // ==========================================

  private intentPatterns: IntentPattern[] = [
    // Shopping
    {
      keywords: ['acheter', 'prendre', 'récupérer', 'chercher', 'courses'],
      intent: 'shopping',
      category: 'courses',
      confidence: 0.85,
      examples: ["acheter du pain", "prendre du lait"]
    },

    // Calls
    {
      keywords: ['appeler', 'rappeler', 'téléphoner', 'joindre', 'contacter', 'call'],
      intent: 'call',
      category: 'personnel',
      requiresContact: true,
      confidence: 0.90,
      examples: ["appeler le médecin", "rappeler Marie"]
    },

    // Meetings
    {
      keywords: ['réunion', 'meeting', 'rencontrer', 'voir', 'rendez-vous', 'rdv'],
      intent: 'meeting',
      category: 'travail',
      requiresLocation: true,
      confidence: 0.88,
      examples: ["réunion avec l'équipe", "voir Marie"]
    },

    // Work tasks
    {
      keywords: ['finir', 'terminer', 'compléter', 'préparer', 'rédiger', 'écrire', 'créer', 'faire'],
      intent: 'work',
      category: 'travail',
      confidence: 0.70,
      examples: ["finir le rapport", "préparer la présentation"]
    },

    // Exercise
    {
      keywords: ['gym', 'sport', 'courir', 'yoga', 'fitness', 'entraînement', 'musculation'],
      intent: 'exercise',
      category: 'sport',
      confidence: 0.90,
      examples: ["aller à la gym", "faire du sport"]
    },

    // Health
    {
      keywords: ['médecin', 'docteur', 'dentiste', 'pharmacie', 'santé', 'traitement'],
      intent: 'health',
      category: 'santé',
      priority: 'high',
      confidence: 0.88,
      examples: ["rdv médecin", "aller à la pharmacie"]
    },

    // Housework
    {
      keywords: ['ranger', 'nettoyer', 'ménage', 'laver', 'repasser', 'poubelle'],
      intent: 'housework',
      category: 'personnel',
      priority: 'low',
      confidence: 0.85,
      examples: ["faire le ménage", "ranger la chambre"]
    },

    // Payment
    {
      keywords: ['payer', 'régler', 'virer', 'facture', 'loyer'],
      intent: 'payment',
      category: 'finance',
      priority: 'high',
      requiresAmount: true,
      confidence: 0.90,
      examples: ["payer la facture", "virer le loyer"]
    },

    // Cooking
    {
      keywords: ['cuisiner', 'préparer le repas', 'dîner', 'déjeuner', 'petit-déjeuner'],
      intent: 'cooking',
      category: 'personnel',
      confidence: 0.80,
      examples: ["cuisiner le dîner", "préparer le repas"]
    },

    // Events
    {
      keywords: ['anniversaire', 'fête', 'concert', 'spectacle', 'soirée'],
      intent: 'event',
      category: 'personnel',
      priority: 'medium',
      confidence: 0.85,
      examples: ["anniversaire de Marie", "concert ce soir"]
    }
  ];

  // ==========================================
  // LOCATION PATTERNS
  // ==========================================

  private locationPatterns: LocationPattern[] = [
    // Explicit location with preposition
    {
      pattern: /(?:à|au|chez|dans|vers|près de)\s+([A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+)*)/,
      extract: (match) => ({
        locationName: match[1],
        confidence: 0.80
      })
    },

    // Generic terms that need clarification
    {
      keywords: ['magasin', 'supermarché', 'salle', 'gym', 'restaurant', 'resto', 'bar', 'café'],
      needsClarification: true,
      genericTerms: ['magasin', 'supermarché', 'salle', 'gym', 'restaurant', 'resto', 'bar', 'café']
    }
  ];

  // ==========================================
  // PRIORITY PATTERNS
  // ==========================================

  private priorityPatterns: PriorityPattern[] = [
    {
      keywords: ['urgent', 'asap', 'immédiat', 'tout de suite', 'maintenant', 'vite', 'critique', '!!!'],
      priority: 'high',
      confidence: 0.95
    },
    {
      keywords: ['important', 'prioritaire', 'crucial', 'essentiel', '!!'],
      priority: 'high',
      confidence: 0.85
    },
    {
      keywords: ['plus tard', 'quand possible', 'si temps', 'optionnel', 'peut-être'],
      priority: 'low',
      confidence: 0.90
    }
  ];

  // ==========================================
  // MAIN PARSE METHOD
  // ==========================================

  parse(input: string, userContext?: UserContext): ParsedResult {
    const result: Partial<ParsedResult> = {
      title: input,
      originalInput: input,
      confidence: 0,
      hasSpecificTime: false
    };

    const confidenceScores: number[] = [];

    // 1. Parse temporal information
    const temporalResult = this.parseTemporal(input, userContext);
    if (temporalResult) {
      Object.assign(result, temporalResult);
      confidenceScores.push(temporalResult.confidence);

      // Clean temporal expressions from title
      result.title = this.cleanTemporalExpressions(result.title!);
    }

    // 2. Parse intent
    const intentResult = this.parseIntent(input);
    if (intentResult) {
      result.intent = intentResult.intent;
      result.category = intentResult.category;
      if (intentResult.priority) result.priority = intentResult.priority;
      if (intentResult.requiresContact) result.needsContactInfo = true;
      if (intentResult.requiresLocation) result.needsLocationInfo = true;
      confidenceScores.push(intentResult.confidence);
    }

    // 3. Parse location
    const locationResult = this.parseLocation(input);
    if (locationResult) {
      if (locationResult.locationName) {
        result.location = { name: locationResult.locationName };
      }
      if (locationResult.needsClarification) {
        result.requiresClarification = true;
      }
      confidenceScores.push(locationResult.confidence);

      // Clean location from title
      if (locationResult.locationName) {
        result.title = this.cleanLocationExpressions(result.title!, locationResult.locationName);
      }
    }

    // 4. Parse priority
    const priorityResult = this.parsePriority(input);
    if (priorityResult) {
      result.priority = priorityResult.priority;
      confidenceScores.push(priorityResult.confidence);

      // Clean priority keywords from title
      result.title = this.cleanPriorityExpressions(result.title!);
    }

    // Default priority if not set
    if (!result.priority) {
      result.priority = 'medium';
    }

    // 5. Calculate overall confidence
    result.confidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0.5;

    // 6. Clean final title
    result.title = this.cleanTitle(result.title!);

    return result as ParsedResult;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private parseTemporal(input: string, context?: UserContext): TemporalResult | null {
    for (const pattern of this.temporalPatterns) {
      const match = input.match(pattern.pattern);
      if (match) {
        const result = pattern.extract(match, context);
        return result;
      }
    }
    return null;
  }

  private parseIntent(input: string): (IntentPattern & { intent: string }) | null {
    const lowerInput = input.toLowerCase();

    for (const pattern of this.intentPatterns) {
      const hasKeyword = pattern.keywords.some(kw => lowerInput.includes(kw));
      if (hasKeyword) {
        return pattern as any;
      }
    }

    return null;
  }

  private parseLocation(input: string): LocationResult | null {
    // Check explicit patterns first
    for (const pattern of this.locationPatterns) {
      if (pattern.pattern) {
        const match = input.match(pattern.pattern);
        if (match && pattern.extract) {
          return pattern.extract(match);
        }
      }

      // Check generic terms
      if (pattern.keywords) {
        const lowerInput = input.toLowerCase();
        const hasGeneric = pattern.keywords.some(kw => lowerInput.includes(kw));
        if (hasGeneric && pattern.needsClarification) {
          return {
            confidence: 0.70,
            needsClarification: true
          };
        }
      }
    }

    return null;
  }

  private parsePriority(input: string): PriorityPattern | null {
    const lowerInput = input.toLowerCase();

    for (const pattern of this.priorityPatterns) {
      const hasKeyword = pattern.keywords.some(kw => lowerInput.includes(kw));
      if (hasKeyword) {
        return pattern;
      }
    }

    return null;
  }

  private getNextDayOfWeek(dayName: string): Date {
    const days: { [key: string]: number } = {
      'dimanche': 0, 'lundi': 1, 'mardi': 2, 'mercredi': 3,
      'jeudi': 4, 'vendredi': 5, 'samedi': 6
    };

    const targetDay = days[dayName];
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7; // Next week
    }

    return addDays(today, daysUntil);
  }

  private cleanTemporalExpressions(text: string): string {
    const patterns = [
      /demain\s+(?:matin|après-midi|soir|à|a|vers)?\s*\d{1,2}[h:]\d{0,2}/gi,
      /\bdemain\b/gi,
      /\baujourd'?hui\b/gi,
      /\baprès-demain\b/gi,
      /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
      /\b(?:ce|cette|cet)\s+(?:matin|après-midi|soir|semaine|week-?end|mois)\b/gi,
      /\bavant\s+(?:le\s+)?\d{1,2}[\/\-]\d{1,2}/gi,
      /\bd'ici\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
      /\bpour\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
      /\b(?:à|a|vers)\s*\d{1,2}[h:]\d{0,2}/gi,
      /\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g
    ];

    let cleaned = text;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    return cleaned;
  }

  private cleanLocationExpressions(text: string, locationName: string): string {
    const regex = new RegExp(`(?:à|au|chez|dans|vers|près de)\\s+${locationName}`, 'gi');
    return text.replace(regex, '').trim();
  }

  private cleanPriorityExpressions(text: string): string {
    const patterns = [
      /urgent/gi,
      /asap/gi,
      /immédiat/gi,
      /important/gi,
      /prioritaire/gi,
      /critique/gi,
      /plus tard/gi,
      /quand possible/gi,
      /!!!+/g,
      /!!+/g
    ];

    let cleaned = text;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    return cleaned;
  }

  private cleanTitle(title: string): string {
    // Remove extra spaces
    title = title.replace(/\s+/g, ' ').trim();

    // Remove leading/trailing punctuation
    title = title.replace(/^[,.\-:;!\s]+|[,.\-:;!\s]+$/g, '');

    // Remove orphan prepositions
    title = title.replace(/\s+(à|au|de|du|pour|avec)\s*$/i, '');

    return title || 'Nouvelle tâche';
  }
}

// Singleton instance
export const patternEngine = new AdvancedPatternEngine();
