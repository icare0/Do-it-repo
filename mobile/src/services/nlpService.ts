import { RecurringPattern } from '@/types';

interface ParsedTask {
  title: string;
  date?: Date;
  time?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  recurringPattern?: RecurringPattern;
}

class NLPService {
  private categoryKeywords = {
    travail: ['réunion', 'meeting', 'call', 'appel', 'projet', 'rapport', 'présentation'],
    personnel: ['anniversaire', 'rendez-vous', 'médecin', 'dentiste', 'coiffeur'],
    courses: ['acheter', 'courses', 'supermarché', 'carrefour', 'magasin'],
    sport: ['gym', 'sport', 'course', 'yoga', 'fitness', 'entraînement'],
  };

  private priorityKeywords = {
    high: ['urgent', 'important', 'asap', 'critique', 'prioritaire'],
    low: ['peut-être', 'si possible', 'quand tu peux'],
  };

  private dayKeywords: { [key: string]: number } = {
    'aujourd\'hui': 0,
    'aujourdhui': 0,
    'demain': 1,
    'après-demain': 2,
    'lundi': 1,
    'mardi': 2,
    'mercredi': 3,
    'jeudi': 4,
    'vendredi': 5,
    'samedi': 6,
    'dimanche': 0,
  };

  private timeOfDayKeywords: { [key: string]: number } = {
    'matin': 9,
    'midi': 12,
    'après-midi': 15,
    'soir': 20,
    'nuit': 22,
  };

  private recurringKeywords = {
    daily: ['tous les jours', 'chaque jour', 'quotidien', 'quotidiennement'],
    weekly: ['toutes les semaines', 'chaque semaine', 'hebdomadaire', 'hebdomadairement'],
    monthly: ['tous les mois', 'chaque mois', 'mensuel', 'mensuellement'],
    yearly: ['tous les ans', 'chaque année', 'annuel', 'annuellement'],
  };

  parseQuickAdd(input: string): ParsedTask {
    const parsed: ParsedTask = {
      title: input,
    };

    let cleanedInput = input;

    // Parse recurring patterns first
    const lowerInput = input.toLowerCase();
    for (const [frequency, keywords] of Object.entries(this.recurringKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        parsed.recurringPattern = {
          frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
          interval: 1,
        };
        // Remove recurring keyword from input
        keywords.forEach(keyword => {
          cleanedInput = cleanedInput.replace(new RegExp(keyword, 'gi'), '').trim();
        });
        break;
      }
    }

    // Parse time of day keywords (ce matin, ce soir, cette nuit, etc.)
    const timeOfDayPattern = /(ce|cette|cet)?\s*(matin|midi|après-midi|soir|nuit)/i;
    const timeOfDayMatch = input.match(timeOfDayPattern);
    if (timeOfDayMatch) {
      const timeOfDay = timeOfDayMatch[2].toLowerCase();
      const hour = this.timeOfDayKeywords[timeOfDay] || 12;

      if (!parsed.date) {
        parsed.date = new Date();
      }
      parsed.date.setHours(hour, 0, 0, 0);
      parsed.time = `${hour.toString().padStart(2, '0')}:00`;
      cleanedInput = cleanedInput.replace(timeOfDayMatch[0], '').trim();
    }

    // Parse relative dates (aujourd'hui, demain, après-demain)
    const relativeDatePattern = /(aujourd'?hui|demain|après-demain)/i;
    const relativeDateMatch = input.match(relativeDatePattern);
    if (relativeDateMatch) {
      const keyword = relativeDateMatch[1].toLowerCase().replace("'", '');
      const daysToAdd = keyword === 'aujourdhui' || keyword === 'aujourdhui' ? 0 :
                        keyword === 'demain' ? 1 : 2;
      const date = parsed.date || new Date();
      date.setDate(date.getDate() + daysToAdd);
      parsed.date = date;
      cleanedInput = cleanedInput.replace(relativeDateMatch[0], '').trim();
    }

    // Parse absolute dates (DD/MM, DD/MM/YYYY)
    const absoluteDatePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
    const absoluteDateMatch = input.match(absoluteDatePattern);
    if (absoluteDateMatch && !parsed.date) {
      const day = parseInt(absoluteDateMatch[1]);
      const month = parseInt(absoluteDateMatch[2]) - 1; // JS months are 0-indexed
      const year = absoluteDateMatch[3] ?
        (absoluteDateMatch[3].length === 2 ? 2000 + parseInt(absoluteDateMatch[3]) : parseInt(absoluteDateMatch[3])) :
        new Date().getFullYear();
      parsed.date = new Date(year, month, day);
      cleanedInput = cleanedInput.replace(absoluteDateMatch[0], '').trim();
    }

    // Parse time (14h30, 14:30, 14h, à 14h30)
    const timePattern = /(?:à\s+)?(\d{1,2})[h:](\d{2})?/i;
    const timeMatch = input.match(timePattern);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      parsed.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      cleanedInput = cleanedInput.replace(timeMatch[0], '').trim();

      // If we have a time but no date, assume today
      if (!parsed.date) {
        parsed.date = new Date();
      }
    }

    // Detect category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        parsed.category = category;
        break;
      }
    }

    parsed.title = cleanedInput;

    // Parse duration
    const durationMatch = input.match(/(\d+)\s*(h|heure|heures|min|minutes?)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      parsed.duration = unit.startsWith('h') ? value * 60 : value;
      parsed.title = parsed.title.replace(durationMatch[0], '').trim();
    }

    // Detect priority
    const lowerTitle = parsed.title.toLowerCase();
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        parsed.priority = priority as 'low' | 'high';
        // Remove priority keywords from title
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          parsed.title = parsed.title.replace(regex, '').trim();
        });
        break;
      }
    }

    // Default priority
    if (!parsed.priority) {
      parsed.priority = 'medium';
    }

    // Clean up title
    parsed.title = parsed.title
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/^[-,;:\s]+|[-,;:\s]+$/g, '') // Remove leading/trailing punctuation
      .trim();

    return parsed;
  }

  extractLocation(input: string): { name: string; query: string } | null {
    // Look for location keywords
    const locationPattern = /(?:à|chez|au|dans)\s+([^,\.]+)/i;
    const match = input.match(locationPattern);

    if (match) {
      return {
        name: match[1].trim(),
        query: match[1].trim(),
      };
    }

    return null;
  }

  suggestCompletions(input: string): string[] {
    const suggestions: string[] = [];
    const lowerInput = input.toLowerCase();

    // Common task templates
    const templates = [
      'Appeler {name}',
      'Réunion avec {name}',
      'Acheter {item}',
      'Rendez-vous {where}',
      'Envoyer email à {name}',
      'Préparer {what}',
    ];

    // Add matching templates
    templates.forEach(template => {
      if (template.toLowerCase().startsWith(lowerInput)) {
        suggestions.push(template);
      }
    });

    return suggestions.slice(0, 5);
  }

  extractTags(input: string): string[] {
    const hashtagPattern = /#(\w+)/g;
    const matches = input.matchAll(hashtagPattern);
    return Array.from(matches, m => m[1]);
  }
}

export const nlpService = new NLPService();
