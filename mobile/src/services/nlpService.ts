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

      // Vérifier si l'heure est déjà passée aujourd'hui
      const now = new Date();
      const proposedTime = new Date();
      proposedTime.setHours(hour, 0, 0, 0);

      // Si l'heure proposée est dans le passé, ajouter 1h à l'heure actuelle au lieu du lendemain
      if (proposedTime <= now) {
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        parsed.date.setHours(oneHourLater.getHours(), 0, 0, 0);
        parsed.time = `${oneHourLater.getHours().toString().padStart(2, '0')}:00`;
      } else {
        parsed.date.setHours(hour, 0, 0, 0);
        parsed.time = `${hour.toString().padStart(2, '0')}:00`;
      }

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

      // Si aucune heure n'est définie et c'est demain/après-demain, mettre 9h par défaut
      if (!parsed.time && daysToAdd > 0) {
        const defaultHour = 9;
        parsed.date.setHours(defaultHour, 0, 0, 0);
        parsed.time = `${defaultHour.toString().padStart(2, '0')}:00`;
      }

      cleanedInput = cleanedInput.replace(relativeDateMatch[0], '').trim();
    }

    // Parse specific days (Lundi, Mardi, etc.)
    const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const dayPattern = new RegExp(`\\b(${daysOfWeek.join('|')})\\b`, 'i');
    const dayMatch = input.match(dayPattern);
    if (dayMatch) {
      const dayName = dayMatch[1].toLowerCase();
      const targetDay = this.dayKeywords[dayName]; // 1=Lundi ... 6=Samedi, 0=Dimanche

      if (targetDay !== undefined) {
        const date = parsed.date || new Date();
        const currentDay = date.getDay();

        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) {
          // If the day is today or passed earlier in week, assume next week
          // Unless user explicitly said "ce" Monday? But we don't catch that yet.
          // Defaulting to next occurence (upcoming strict).
          // If today is Monday(1) and input is Monday, daysUntil=0 -> Next Monday (+7).
          daysUntil += 7;
        }

        date.setDate(date.getDate() + daysUntil);
        parsed.date = date;
        cleanedInput = cleanedInput.replace(dayMatch[0], '').trim();
      }
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

    // Parse time ranges first (entre 14h et 16h, de 9h à 11h)
    const timeRangePattern = /(?:entre|de)\s+(\d{1,2})[h:]?(?:(\d{2}))?\s+(?:et|à|a)\s+(\d{1,2})[h:]?(?:(\d{2}))?/i;
    const timeRangeMatch = input.match(timeRangePattern);
    if (timeRangeMatch) {
      const startHour = parseInt(timeRangeMatch[1]);
      const startMinute = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
      const endHour = parseInt(timeRangeMatch[3]);
      const endMinute = timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) : 0;

      // Définir l'heure de début
      parsed.time = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

      if (!parsed.date) {
        parsed.date = new Date();
      }
      parsed.date.setHours(startHour, startMinute, 0, 0);

      // Calculer la durée en minutes
      const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      if (durationMinutes > 0) {
        parsed.duration = durationMinutes;
      }

      cleanedInput = cleanedInput.replace(timeRangeMatch[0], '').trim();
    }
    // Parse single time (14h30, 14:30, 14h, à 14h30, a 14h30) - only if no range was found
    else {
      const timePattern = /(?:\b(?:à|a|vers|pour)\s+)?(\d{1,2})[h:](\d{2})?/i;
      const timeMatch = input.match(timePattern);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        parsed.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Update the date object with the extracted time
        if (!parsed.date) {
          parsed.date = new Date();
        }

        // Vérifier si l'heure est dans le passé aujourd'hui (seulement si la date n'a pas été explicitement définie)
        const now = new Date();
        const proposedTime = new Date(parsed.date);
        proposedTime.setHours(hour, minute, 0, 0);

        // Si c'est aujourd'hui et l'heure est passée, avancer au lendemain
        if (parsed.date.toDateString() === now.toDateString() && proposedTime <= now) {
          parsed.date.setDate(parsed.date.getDate() + 1);
        }

        parsed.date.setHours(hour, minute, 0, 0);

        cleanedInput = cleanedInput.replace(timeMatch[0], '').trim();
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

    // Parse duration (e.g. 1h30, 1h 30min, 1h, 30min)
    // Regex for:
    // 1. "1h30", "1h 30", "1h 30min" -> Group 1 (hours), Group 2 (minutes)
    // 2. "30min", "30 min" -> Group 3 (minutes)
    const durationMatch = cleanedInput.match(/(\d+)\s*(?:h|heure|heures)(?:\s*(\d+)\s*(?:m|min|minutes?)?)?|(\d+)\s*(?:m|min|minutes?)/i);

    if (durationMatch) {
      let totalMinutes = 0;

      // Case 1: Hours defined (and optional minutes)
      if (durationMatch[1]) {
        const hours = parseInt(durationMatch[1]);
        totalMinutes = hours * 60;
        if (durationMatch[2]) {
          totalMinutes += parseInt(durationMatch[2]);
        }
      }
      // Case 2: Only minutes
      else if (durationMatch[3]) {
        totalMinutes = parseInt(durationMatch[3]);
      }

      parsed.duration = totalMinutes;
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
