import { RecurringPattern } from '@/types';
import { nlpService } from './nlpService';

interface ParsedTask {
  title: string;
  description?: string;
  date?: Date;
  time?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  recurringPattern?: RecurringPattern;
  needsFocus?: boolean;
  tags?: string[];
  participants?: string[];
}

/**
 * Service NLP Avancé avec intelligence artificielle
 * Améliore le parsing basique avec:
 * - Expressions temporelles avancées ("dans 2h", "ce weekend")
 * - Détection automatique du focus nécessaire
 * - Durées intelligentes par type de tâche
 * - Priorités intelligentes
 * - Extraction d'informations riches
 */
class NLPServiceAdvanced {
  // Règles de durée par type de tâche (en minutes)
  private smartDurationRules: { [pattern: string]: number } = {
    'courses|supermarché|magasin|acheter': 45,
    'repas|cuisiner|préparer à manger|déjeuner|dîner': 60,
    'sport|gym|fitness|course|yoga|entraînement': 90,
    'appel|appeler|téléphoner|contacter': 15,
    'email|mail|répondre|envoyer': 10,
    'réunion|meeting|rendez-vous médical|rdv': 60,
    'réviser|étudier|apprendre|révisions': 120,
    'coder|programmer|développer|debug': 120,
    'lire|lecture': 45,
    'ménage|nettoyer|ranger': 30,
  };

  // Tâches qui nécessitent du focus (concentration)
  private focusRequiredPatterns = [
    'réviser', 'étudier', 'apprendre', 'examen', 'exam',
    'coder', 'programmer', 'développer', 'debug', 'code',
    'écrire', 'rédiger', 'rapport', 'présentation',
    'travail', 'projet', 'deadline', 'important',
    'lire', 'lecture', 'analyser',
  ];

  // Tâches qui ne nécessitent PAS de focus
  private noFocusPatterns = [
    'courses', 'acheter', 'supermarché', 'magasin',
    'ménage', 'nettoyer', 'ranger', 'laver',
    'appeler', 'téléphoner', 'appel',
    'sport', 'gym', 'course', 'yoga',
    'déplacer', 'aller', 'partir',
  ];

  // Mots-clés de priorité élevée
  private highPriorityKeywords = [
    'urgent', 'asap', 'important', 'critique',
    'deadline', 'exam', 'examen', 'avant',
    'impératif', 'obligatoire', 'rapidement',
    'tout de suite', 'maintenant', 'immédiat',
  ];

  // Mots-clés de priorité faible
  private lowPriorityKeywords = [
    'peut-être', 'si possible', 'quand tu peux',
    'éventuellement', 'optionnel', 'si temps',
    'plus tard', 'quand possible',
  ];

  /**
   * Parse une tâche avec toutes les améliorations intelligentes
   */
  parseAdvanced(input: string): ParsedTask {
    // Commencer par le parsing basique
    const basicParsed = nlpService.parseQuickAdd(input);
    let cleanedInput = input.toLowerCase();

    const result: ParsedTask = {
      title: basicParsed.title,
      date: basicParsed.date,
      time: basicParsed.time,
      duration: basicParsed.duration,
      priority: basicParsed.priority,
      category: basicParsed.category,
      recurringPattern: basicParsed.recurringPattern,
    };

    // 1. Expressions temporelles avancées
    const advancedTimeResult = this.parseAdvancedTimeExpressions(input, result.date);
    if (advancedTimeResult.date) {
      result.date = advancedTimeResult.date;
      result.time = advancedTimeResult.time;
      cleanedInput = advancedTimeResult.cleanedInput;
    }

    // 2. Récurrence intelligente avancée
    const advancedRecurrence = this.parseAdvancedRecurrence(input);
    if (advancedRecurrence) {
      result.recurringPattern = advancedRecurrence;
    }

    // 3. Détection automatique du focus
    result.needsFocus = this.detectFocusNeed(cleanedInput);

    // 4. Durée intelligente (si pas déjà définie)
    if (!result.duration) {
      result.duration = this.detectSmartDuration(cleanedInput);
    }

    // 5. Priorité intelligente améliorée
    result.priority = this.detectSmartPriority(cleanedInput, result.priority);

    // 6. Extraction d'informations riches
    const richInfo = this.extractRichInformation(input);
    if (richInfo.description) {
      result.description = richInfo.description;
    }
    if (richInfo.participants && richInfo.participants.length > 0) {
      result.participants = richInfo.participants;
    }
    if (richInfo.tags && richInfo.tags.length > 0) {
      result.tags = richInfo.tags;
    }

    // Nettoyer le titre
    result.title = this.cleanTitle(result.title, richInfo);

    return result;
  }

  /**
   * Parse les expressions temporelles avancées
   */
  private parseAdvancedTimeExpressions(
    input: string,
    existingDate?: Date
  ): { date?: Date; time?: string; cleanedInput: string } {
    const lowerInput = input.toLowerCase();
    let date = existingDate;
    let time: string | undefined;
    let cleanedInput = lowerInput;

    // "dans X heures" / "dans X minutes"
    const inHoursMatch = lowerInput.match(/dans\s+(\d+)\s+(heure|heures|h)/i);
    if (inHoursMatch) {
      const hours = parseInt(inHoursMatch[1]);
      date = new Date();
      date.setHours(date.getHours() + hours);
      time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      cleanedInput = cleanedInput.replace(inHoursMatch[0], '').trim();
    }

    const inMinutesMatch = lowerInput.match(/dans\s+(\d+)\s+(minute|minutes|min)/i);
    if (inMinutesMatch) {
      const minutes = parseInt(inMinutesMatch[1]);
      date = new Date();
      date.setMinutes(date.getMinutes() + minutes);
      time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      cleanedInput = cleanedInput.replace(inMinutesMatch[0], '').trim();
    }

    // "dans X jours"
    const inDaysMatch = lowerInput.match(/dans\s+(\d+)\s+(jour|jours)/i);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1]);
      date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(9, 0, 0, 0); // Par défaut 9h
      time = '09:00';
      cleanedInput = cleanedInput.replace(inDaysMatch[0], '').trim();
    }

    // "dans X semaines"
    const inWeeksMatch = lowerInput.match(/dans\s+(\d+)\s+(semaine|semaines)/i);
    if (inWeeksMatch) {
      const weeks = parseInt(inWeeksMatch[1]);
      date = new Date();
      date.setDate(date.getDate() + weeks * 7);
      date.setHours(9, 0, 0, 0);
      time = '09:00';
      cleanedInput = cleanedInput.replace(inWeeksMatch[0], '').trim();
    }

    // "ce weekend" / "ce week-end"
    if (/ce\s+week-?end/i.test(lowerInput)) {
      date = new Date();
      const currentDay = date.getDay();
      const daysUntilSaturday = currentDay === 0 ? 6 : 6 - currentDay;
      date.setDate(date.getDate() + daysUntilSaturday);
      date.setHours(10, 0, 0, 0);
      time = '10:00';
      cleanedInput = cleanedInput.replace(/ce\s+week-?end/gi, '').trim();
    }

    // "la semaine prochaine"
    if (/la\s+semaine\s+prochaine/i.test(lowerInput)) {
      date = new Date();
      const currentDay = date.getDay();
      const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;
      date.setDate(date.getDate() + daysUntilMonday);
      date.setHours(9, 0, 0, 0);
      time = '09:00';
      cleanedInput = cleanedInput.replace(/la\s+semaine\s+prochaine/gi, '').trim();
    }

    // "le mois prochain"
    if (/le\s+mois\s+prochain/i.test(lowerInput)) {
      date = new Date();
      date.setMonth(date.getMonth() + 1);
      date.setDate(1);
      date.setHours(9, 0, 0, 0);
      time = '09:00';
      cleanedInput = cleanedInput.replace(/le\s+mois\s+prochain/gi, '').trim();
    }

    // "toute la matinée" / "tout le matin"
    if (/tout(e)?\s+(la\s+)?matin(ée)?/i.test(lowerInput)) {
      if (!date) date = new Date();
      date.setHours(9, 0, 0, 0);
      time = '09:00';
      // Durée sera gérée par smartDuration
      cleanedInput = cleanedInput.replace(/tout(e)?\s+(la\s+)?matin(ée)?/gi, '').trim();
    }

    // "tout l'après-midi"
    if (/tout(e)?\s+(l')?après-midi/i.test(lowerInput)) {
      if (!date) date = new Date();
      date.setHours(14, 0, 0, 0);
      time = '14:00';
      cleanedInput = cleanedInput.replace(/tout(e)?\s+(l')?après-midi/gi, '').trim();
    }

    // "toute la journée"
    if (/tout(e)?\s+la\s+journée/i.test(lowerInput)) {
      if (!date) date = new Date();
      date.setHours(8, 0, 0, 0);
      time = '08:00';
      cleanedInput = cleanedInput.replace(/tout(e)?\s+la\s+journée/gi, '').trim();
    }

    return { date, time, cleanedInput };
  }

  /**
   * Parse les patterns de récurrence avancés
   */
  private parseAdvancedRecurrence(input: string): RecurringPattern | null {
    const lowerInput = input.toLowerCase();

    // "lundi, mercredi, vendredi" ou "lun mer ven"
    const multipleDaysMatch = lowerInput.match(
      /(lundi|lun|mardi|mar|mercredi|mer|jeudi|jeu|vendredi|ven|samedi|sam|dimanche|dim)[\s,]+(et\s+)?(lundi|lun|mardi|mar|mercredi|mer|jeudi|jeu|vendredi|ven|samedi|sam|dimanche|dim)/i
    );
    if (multipleDaysMatch) {
      // Extraire tous les jours
      const days = lowerInput.match(/(lundi|lun|mardi|mar|mercredi|mer|jeudi|jeu|vendredi|ven|samedi|sam|dimanche|dim)/gi);
      if (days) {
        const daysOfWeek = days.map(day => this.dayNameToNumber(day)).filter(d => d !== null) as number[];
        if (daysOfWeek.length > 0) {
          return {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek,
          };
        }
      }
    }

    // "tous les 2 jours"
    const everyNDaysMatch = lowerInput.match(/tous\s+les\s+(\d+)\s+jours/i);
    if (everyNDaysMatch) {
      return {
        frequency: 'daily',
        interval: parseInt(everyNDaysMatch[1]),
      };
    }

    // "tous les matins de semaine"
    if (/tous\s+les\s+matins\s+de\s+semaine/i.test(lowerInput)) {
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Lundi à vendredi
      };
    }

    return null;
  }

  /**
   * Détecte si la tâche nécessite du focus
   */
  private detectFocusNeed(input: string): boolean {
    const lowerInput = input.toLowerCase();

    // Vérifier d'abord les patterns qui NE nécessitent PAS de focus
    for (const pattern of this.noFocusPatterns) {
      if (lowerInput.includes(pattern)) {
        return false;
      }
    }

    // Ensuite vérifier les patterns qui nécessitent du focus
    for (const pattern of this.focusRequiredPatterns) {
      if (lowerInput.includes(pattern)) {
        return true;
      }
    }

    // Par défaut, pas de focus
    return false;
  }

  /**
   * Détecte la durée intelligente selon le type de tâche
   */
  private detectSmartDuration(input: string): number | undefined {
    const lowerInput = input.toLowerCase();

    // Vérifier chaque règle de durée
    for (const [pattern, duration] of Object.entries(this.smartDurationRules)) {
      const patterns = pattern.split('|');
      for (const p of patterns) {
        if (lowerInput.includes(p)) {
          return duration;
        }
      }
    }

    // Détection de mots-clés spéciaux
    if (/rapide|vite\s+fait|quick/i.test(lowerInput)) {
      return 15;
    }

    if (/long|approfondi|détaillé/i.test(lowerInput)) {
      return 120;
    }

    return undefined;
  }

  /**
   * Détecte la priorité intelligente
   */
  private detectSmartPriority(
    input: string,
    existingPriority?: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    // Si déjà détectée par le parsing basique, la garder
    if (existingPriority && existingPriority !== 'medium') {
      return existingPriority;
    }

    const lowerInput = input.toLowerCase();

    // Vérifier priorité élevée
    for (const keyword of this.highPriorityKeywords) {
      if (lowerInput.includes(keyword)) {
        return 'high';
      }
    }

    // Vérifier priorité faible
    for (const keyword of this.lowPriorityKeywords) {
      if (lowerInput.includes(keyword)) {
        return 'low';
      }
    }

    // Détection de deadline → priorité élevée
    if (/avant|d'ici|deadline|pour\s+(lundi|mardi|mercredi|jeudi|vendredi)/i.test(lowerInput)) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Extrait des informations riches pour enrichir la description
   */
  private extractRichInformation(input: string): {
    description?: string;
    participants?: string[];
    tags?: string[];
  } {
    const result: {
      description?: string;
      participants?: string[];
      tags?: string[];
    } = {};

    // Extraction de participants (avec, Jean, Marie, etc.)
    const participantsMatch = input.match(/avec\s+([A-ZÀ-Ö][a-zà-ö]+(?:\s+et\s+[A-ZÀ-Ö][a-zà-ö]+)*)/);
    if (participantsMatch) {
      const participantsStr = participantsMatch[1];
      result.participants = participantsStr.split(/\s+et\s+/);
    }

    // Extraction de tags (#tag)
    const tagsMatches = input.matchAll(/#(\w+)/g);
    result.tags = Array.from(tagsMatches, m => m[1]);

    // Création d'une description enrichie
    const descriptionParts: string[] = [];

    if (result.participants && result.participants.length > 0) {
      descriptionParts.push(`Participants: ${result.participants.join(', ')}`);
    }

    // Extraction d'URLs
    const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      descriptionParts.push(`Lien: ${urlMatch[1]}`);
    }

    // Extraction de montants
    const amountMatch = input.match(/(\d+)\s*€/);
    if (amountMatch) {
      descriptionParts.push(`Montant: ${amountMatch[1]}€`);
    }

    // Extraction de notes entre parenthèses
    const notesMatch = input.match(/\(([^)]+)\)/);
    if (notesMatch) {
      descriptionParts.push(notesMatch[1]);
    }

    if (descriptionParts.length > 0) {
      result.description = descriptionParts.join('\n');
    }

    return result;
  }

  /**
   * Nettoie le titre en enlevant les informations déjà extraites
   */
  private cleanTitle(title: string, richInfo: { participants?: string[]; tags?: string[] }): string {
    let cleaned = title;

    // Retirer les participants
    if (richInfo.participants) {
      cleaned = cleaned.replace(/avec\s+[A-ZÀ-Ö][a-zà-ö]+(?:\s+et\s+[A-ZÀ-Ö][a-zà-ö]+)*/i, '').trim();
    }

    // Retirer les tags
    cleaned = cleaned.replace(/#\w+/g, '').trim();

    // Retirer les URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '').trim();

    // Retirer les montants déjà extraits
    cleaned = cleaned.replace(/\d+\s*€/g, '').trim();

    // Retirer les notes entre parenthèses
    cleaned = cleaned.replace(/\([^)]+\)/g, '').trim();

    // Nettoyer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned || title; // Fallback au titre original si vide
  }

  /**
   * Convertit un nom de jour en numéro
   */
  private dayNameToNumber(dayName: string): number | null {
    const days: { [key: string]: number } = {
      dimanche: 0, dim: 0,
      lundi: 1, lun: 1,
      mardi: 2, mar: 2,
      mercredi: 3, mer: 3,
      jeudi: 4, jeu: 4,
      vendredi: 5, ven: 5,
      samedi: 6, sam: 6,
    };

    const normalized = dayName.toLowerCase();
    return days[normalized] ?? null;
  }

  /**
   * Détecte les duplicatas potentiels dans une liste de tâches
   */
  detectDuplicates(newTask: string, existingTasks: string[]): string[] {
    const newTaskLower = newTask.toLowerCase();
    const duplicates: string[] = [];

    for (const existing of existingTasks) {
      const existingLower = existing.toLowerCase();

      // Similarité exacte
      if (newTaskLower === existingLower) {
        duplicates.push(existing);
        continue;
      }

      // Similarité par mots-clés
      const newWords = newTaskLower.split(/\s+/);
      const existingWords = existingLower.split(/\s+/);

      const commonWords = newWords.filter(word =>
        word.length > 3 && existingWords.includes(word)
      );

      // Si plus de 60% des mots sont communs → duplicata potentiel
      const similarity = commonWords.length / Math.max(newWords.length, existingWords.length);
      if (similarity > 0.6) {
        duplicates.push(existing);
      }
    }

    return duplicates;
  }
}

export const nlpServiceAdvanced = new NLPServiceAdvanced();
