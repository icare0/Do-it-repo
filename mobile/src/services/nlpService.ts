import * as chrono from 'chrono-node';

interface ParsedTask {
  title: string;
  date?: Date;
  time?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
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

  parseQuickAdd(input: string): ParsedTask {
    const parsed: ParsedTask = {
      title: input,
    };

    // Parse date and time using chrono
    const chronoResult = chrono.parse(input, new Date(), { forwardDate: true });
    if (chronoResult.length > 0) {
      const result = chronoResult[0];
      parsed.date = result.start.date();

      // Extract time if available
      if (result.start.get('hour') !== undefined) {
        const hour = result.start.get('hour') || 0;
        const minute = result.start.get('minute') || 0;
        parsed.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }

      // Remove date/time from title
      parsed.title = input.replace(result.text, '').trim();
    }

    // Parse duration
    const durationMatch = input.match(/(\d+)\s*(h|heure|heures|min|minutes?)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      parsed.duration = unit.startsWith('h') ? value * 60 : value;
      parsed.title = parsed.title.replace(durationMatch[0], '').trim();
    }

    // Detect category
    const lowerInput = input.toLowerCase();
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        parsed.category = category;
        break;
      }
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
