import * as chrono from 'chrono-node';
import nlp from 'compromise';
import moment from 'moment-timezone';
import logger from '../config/logger';

/**
 * Service de traitement du langage naturel (NLP)
 * Parse les tâches écrites en langage naturel pour extraire :
 * - Dates et heures
 * - Récurrence
 * - Priorité
 * - Lieu
 * - Catégorie
 */

export interface ParsedTaskData {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  location?: {
    name: string;
  };
}

class NLPService {
  private priorityKeywords = {
    high: ['urgent', 'important', 'prioritaire', 'critique', 'asap', 'immédiat'],
    low: ['plus tard', 'quand possible', 'si temps', 'optionnel'],
  };

  private categoryKeywords = {
    travail: ['travail', 'bureau', 'projet', 'réunion', 'meeting', 'call', 'présentation'],
    personnel: ['personnel', 'perso', 'maison', 'famille'],
    courses: ['courses', 'acheter', 'shopping', 'supermarché', 'magasin'],
    santé: ['santé', 'médecin', 'docteur', 'pharmacie', 'sport', 'gym'],
    finance: ['banque', 'payer', 'facture', 'argent', 'budget'],
  };

  private locationKeywords = ['à', 'au', 'chez', 'dans', 'vers', 'près de'];

  /**
   * Parse une tâche en langage naturel
   * @param input - Texte en langage naturel
   * @param userTimezone - Fuseau horaire de l'utilisateur
   * @returns Données structurées de la tâche
   */
  public parseTask(input: string, userTimezone: string = 'Europe/Paris'): ParsedTaskData {
    try {
      logger.info(`🧠 NLP parsing: "${input}"`);

      const result: ParsedTaskData = {
        title: input,
      };

      // 1. Extraire les dates et heures avec chrono-node
      const dateResults = this.extractDates(input, userTimezone);
      if (dateResults.startDate) {
        result.startDate = dateResults.startDate;
        result.endDate = dateResults.endDate;
        result.duration = dateResults.duration;

        // Nettoyer le titre en retirant les expressions de date
        result.title = this.removeDateExpressions(input, dateResults.rawText);
      }

      // 2. Détecter la récurrence
      const recurringPattern = this.extractRecurringPattern(input);
      if (recurringPattern) {
        result.recurringPattern = recurringPattern;
        result.title = this.removeRecurringExpressions(result.title);
      }

      // 3. Extraire la priorité
      result.priority = this.extractPriority(input);

      // 4. Extraire la catégorie
      result.category = this.extractCategory(input);

      // 5. Extraire les tags
      result.tags = this.extractTags(input);

      // 6. Extraire le lieu
      const location = this.extractLocation(input);
      if (location) {
        result.location = location;
        result.title = this.removeLocationExpressions(result.title, location.name);
      }

      // 7. Nettoyer le titre final
      result.title = this.cleanTitle(result.title);

      logger.info(`✅ NLP parsed result:`, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      logger.error('❌ NLP parsing error:', error);
      return { title: input };
    }
  }

  /**
   * Extrait les dates et heures du texte
   */
  private extractDates(
    text: string,
    timezone: string
  ): {
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    rawText?: string;
  } {
    const results = chrono.parse(text, new Date(), { forwardDate: true });

    if (results.length === 0) {
      return {};
    }

    const firstResult = results[0];
    const startDate = firstResult.start.date();
    let endDate: Date | undefined;
    let duration: number | undefined;

    // Si une date de fin est détectée
    if (firstResult.end) {
      endDate = firstResult.end.date();
      duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60); // en minutes
    }

    return {
      startDate,
      endDate,
      duration,
      rawText: firstResult.text,
    };
  }

  /**
   * Extrait le pattern de récurrence
   */
  private extractRecurringPattern(text: string): ParsedTaskData['recurringPattern'] | null {
    const lowerText = text.toLowerCase();

    // Patterns de récurrence quotidienne
    if (/tous les jours|quotidien|chaque jour|daily/i.test(lowerText)) {
      return { frequency: 'daily', interval: 1 };
    }

    // Patterns de récurrence hebdomadaire
    const weeklyMatch = lowerText.match(
      /tous les (lundis?|mardis?|mercredis?|jeudis?|vendredis?|samedis?|dimanches?)/i
    );
    if (weeklyMatch) {
      const dayName = weeklyMatch[1];
      const dayOfWeek = this.getDayOfWeekNumber(dayName);
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [dayOfWeek],
      };
    }

    // Pattern "toutes les semaines"
    if (/toutes les semaines|hebdomadaire|chaque semaine|weekly/i.test(lowerText)) {
      return { frequency: 'weekly', interval: 1 };
    }

    // Pattern "tous les X jours"
    const daysIntervalMatch = lowerText.match(/tous les (\d+) jours/i);
    if (daysIntervalMatch) {
      const interval = parseInt(daysIntervalMatch[1], 10);
      return { frequency: 'daily', interval };
    }

    // Patterns de récurrence mensuelle
    if (/tous les mois|mensuel|chaque mois|monthly/i.test(lowerText)) {
      return { frequency: 'monthly', interval: 1 };
    }

    // Patterns de récurrence annuelle
    if (/tous les ans|annuel|chaque année|yearly/i.test(lowerText)) {
      return { frequency: 'yearly', interval: 1 };
    }

    return null;
  }

  /**
   * Extrait la priorité du texte
   */
  private extractPriority(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();

    for (const keyword of this.priorityKeywords.high) {
      if (lowerText.includes(keyword)) {
        return 'high';
      }
    }

    for (const keyword of this.priorityKeywords.low) {
      if (lowerText.includes(keyword)) {
        return 'low';
      }
    }

    return 'medium';
  }

  /**
   * Extrait la catégorie du texte
   */
  private extractCategory(text: string): string | undefined {
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return undefined;
  }

  /**
   * Extrait les tags (mots-clés avec #)
   */
  private extractTags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.matchAll(hashtagRegex);
    const tags: string[] = [];

    for (const match of matches) {
      tags.push(match[1]);
    }

    return tags.length > 0 ? tags : [];
  }

  /**
   * Extrait le lieu du texte
   */
  private extractLocation(text: string): { name: string } | null {
    const doc = nlp(text);

    // Chercher les lieux avec les prépositions
    for (const keyword of this.locationKeywords) {
      const regex = new RegExp(`${keyword}\\s+([\\w\\s]+?)(?=\\s+(le|la|les|à|au|pour|,|\\.|$))`, 'i');
      const match = text.match(regex);

      if (match) {
        const locationName = match[1].trim();
        // Vérifier que ce n'est pas juste un mot de temps
        if (locationName.length > 2 && !this.isTimeWord(locationName)) {
          return { name: locationName };
        }
      }
    }

    // Chercher les lieux explicites (noms propres après préposition)
    const places = doc.places().out('array');
    if (places.length > 0) {
      return { name: places[0] };
    }

    return null;
  }

  /**
   * Convertit un nom de jour en numéro (0 = Dimanche, 1 = Lundi, etc.)
   */
  private getDayOfWeekNumber(dayName: string): number {
    const days: { [key: string]: number } = {
      dimanche: 0,
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
    };

    const normalized = dayName.toLowerCase().replace(/s$/, '');
    return days[normalized] || 0;
  }

  /**
   * Vérifie si un mot est lié au temps
   */
  private isTimeWord(word: string): boolean {
    const timeWords = [
      'matin',
      'soir',
      'midi',
      'minuit',
      'heure',
      'minute',
      'jour',
      'semaine',
      'mois',
      'année',
    ];
    return timeWords.some((tw) => word.toLowerCase().includes(tw));
  }

  /**
   * Retire les expressions de date du titre
   */
  private removeDateExpressions(text: string, dateText?: string): string {
    if (!dateText) return text;

    let cleaned = text.replace(dateText, '').trim();

    // Retirer les prépositions orphelines
    cleaned = cleaned.replace(/\s+(à|le|la|les|pour|de|du)\s*$/i, '').trim();

    return cleaned;
  }

  /**
   * Retire les expressions de récurrence du titre
   */
  private removeRecurringExpressions(text: string): string {
    const patterns = [
      /tous les jours/gi,
      /quotidien/gi,
      /chaque jour/gi,
      /tous les (lundis?|mardis?|mercredis?|jeudis?|vendredis?|samedis?|dimanches?)/gi,
      /toutes les semaines/gi,
      /hebdomadaire/gi,
      /chaque semaine/gi,
      /tous les \d+ jours/gi,
      /tous les mois/gi,
      /mensuel/gi,
      /chaque mois/gi,
      /tous les ans/gi,
      /annuel/gi,
      /chaque année/gi,
    ];

    let cleaned = text;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    return cleaned;
  }

  /**
   * Retire les expressions de lieu du titre
   */
  private removeLocationExpressions(text: string, locationName: string): string {
    const regex = new RegExp(`(à|au|chez|dans|vers|près de)\\s+${locationName}`, 'gi');
    return text.replace(regex, '').trim();
  }

  /**
   * Nettoie le titre final
   */
  private cleanTitle(title: string): string {
    // Retirer les priorités
    title = title.replace(
      /(urgent|important|prioritaire|critique|asap|immédiat|plus tard|quand possible|si temps|optionnel)/gi,
      ''
    );

    // Retirer les hashtags
    title = title.replace(/#\w+/g, '');

    // Retirer les espaces multiples et trim
    title = title.replace(/\s+/g, ' ').trim();

    // Retirer les ponctuations orphelines
    title = title.replace(/^[,.\-:;]\s*/, '').replace(/\s*[,.\-:;]$/, '');

    return title || 'Nouvelle tâche';
  }
}

export default new NLPService();
