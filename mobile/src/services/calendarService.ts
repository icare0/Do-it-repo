import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '@/types';

class CalendarService {
  private hasCheckedPermissions = false;

  /**
   * Vérifie et demande les permissions calendrier
   */
  async ensurePermissions(): Promise<boolean> {
    try {
      console.log('📅 [CalendarService] 🔍 Vérification des permissions...');

      // Vérifier l'état actuel des permissions
      const { status: currentStatus } = await Calendar.getCalendarPermissionsAsync();
      console.log('📅 [CalendarService] État actuel des permissions:', currentStatus);

      if (currentStatus === 'granted') {
        console.log('✅ [CalendarService] Permissions déjà accordées !');
        this.hasCheckedPermissions = true;
        return true;
      }

      // Si pas accordées, les demander
      console.log('📅 [CalendarService] Demande des permissions à l\'utilisateur...');
      const { status: newStatus } = await Calendar.requestCalendarPermissionsAsync();
      console.log('📅 [CalendarService] Nouveau statut:', newStatus);

      const granted = newStatus === 'granted';
      this.hasCheckedPermissions = true;

      if (!granted) {
        console.error('❌ [CalendarService] Permissions refusées par l\'utilisateur !');
      }

      return granted;
    } catch (error) {
      console.error('❌ [CalendarService] Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Déduplique les événements (même titre + même date de début)
   */
  private deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
    const seen = new Map<string, CalendarEvent>();

    events.forEach((event) => {
      // Créer une clé unique basée sur titre + date de début
      const key = `${event.title.toLowerCase().trim()}_${event.startDate.getTime()}`;

      if (!seen.has(key)) {
        seen.set(key, event);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Récupère tous les calendriers du device
   */
  async getAllCalendars() {
    try {
      console.log('📅 [CalendarService] 📚 Récupération de tous les calendriers...');

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('📅 [CalendarService] ✅ Nombre de calendriers trouvés:', calendars.length);

      // Log détaillé de chaque calendrier
      calendars.forEach((cal, idx) => {
        console.log(`📅 [CalendarService] Calendrier #${idx + 1}:`, {
          id: cal.id,
          title: cal.title,
          source: cal.source?.name,
          type: cal.source?.type,
          color: cal.color,
          allowsModifications: cal.allowsModifications,
          isPrimary: (cal as any).isPrimary,
        });
      });

      return calendars;
    } catch (error) {
      console.error('❌ [CalendarService] Erreur lors de la récupération des calendriers:', error);
      return [];
    }
  }

  /**
   * Récupère les événements du calendrier device SEULEMENT
   * Approche simplifiée pour debug
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      console.log('📅 [CalendarService] ========================================');
      console.log('📅 [CalendarService] 🚀 DÉBUT RÉCUPÉRATION DES ÉVÉNEMENTS');
      console.log('📅 [CalendarService] ========================================');
      console.log('📅 [CalendarService] 📆 Période demandée:');
      console.log('📅 [CalendarService]    Du:', startDate.toLocaleDateString('fr-FR'), startDate.toLocaleTimeString('fr-FR'));
      console.log('📅 [CalendarService]    Au:', endDate.toLocaleDateString('fr-FR'), endDate.toLocaleTimeString('fr-FR'));

      // Étape 1: Vérifier les permissions
      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] 🔐 ÉTAPE 1: Permissions');
      const hasPermission = await this.ensurePermissions();

      if (!hasPermission) {
        console.error('❌ [CalendarService] ARRÊT: Pas de permissions !');
        console.log('📅 [CalendarService] ========================================');
        return [];
      }

      // Étape 2: Récupérer tous les calendriers
      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] 📚 ÉTAPE 2: Calendriers');
      const calendars = await this.getAllCalendars();

      if (calendars.length === 0) {
        console.warn('⚠️ [CalendarService] Aucun calendrier trouvé sur cet appareil !');
        console.log('📅 [CalendarService] ========================================');
        return [];
      }

      // Étape 3: Récupérer les événements
      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] 🎯 ÉTAPE 3: Événements');
      const calendarIds = calendars.map(cal => cal.id);
      console.log('📅 [CalendarService] IDs utilisés:', calendarIds);
      console.log('📅 [CalendarService] Appel à Calendar.getEventsAsync...');

      const deviceEvents = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] 🎉 RÉSULTAT: ', deviceEvents.length, 'événement(s) trouvé(s) !');

      // Log de TOUS les événements trouvés
      if (deviceEvents.length > 0) {
        console.log('📅 [CalendarService] ');
        console.log('📅 [CalendarService] 📋 LISTE DES ÉVÉNEMENTS:');
        deviceEvents.forEach((event, idx) => {
          console.log(`📅 [CalendarService] ─────────────────────────────────────`);
          console.log(`📅 [CalendarService] Événement #${idx + 1}:`);
          console.log(`📅 [CalendarService]   📌 Titre: "${event.title}"`);
          console.log(`📅 [CalendarService]   🕐 Début: ${new Date(event.startDate).toLocaleString('fr-FR')}`);
          console.log(`📅 [CalendarService]   🕑 Fin: ${new Date(event.endDate).toLocaleString('fr-FR')}`);
          console.log(`📅 [CalendarService]   📍 Lieu: ${event.location || 'Aucun'}`);
          console.log(`📅 [CalendarService]   🆔 Calendar ID: ${event.calendarId}`);
        });
        console.log(`📅 [CalendarService] ─────────────────────────────────────`);
      } else {
        console.log('📅 [CalendarService] ');
        console.log('📅 [CalendarService] ⚠️ AUCUN ÉVÉNEMENT trouvé dans cette période !');
        console.log('📅 [CalendarService] Vérifiez que vous avez des événements dans vos calendriers');
        console.log('📅 [CalendarService] entre', startDate.toLocaleDateString(), 'et', endDate.toLocaleDateString());
      }

      // Mapper les événements
      const mappedEvents: CalendarEvent[] = deviceEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
        source: 'device' as const,
      }));

      // Déduplication des événements (plusieurs comptes peuvent avoir les mêmes événements)
      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] 🔄 Déduplication des événements...');
      const uniqueEvents = this.deduplicateEvents(mappedEvents);
      console.log('📅 [CalendarService] ✅ Après déduplication:', uniqueEvents.length, 'événement(s) unique(s)');

      console.log('📅 [CalendarService] ');
      console.log('📅 [CalendarService] ========================================');
      console.log('📅 [CalendarService] ✅ FIN: Retour de', uniqueEvents.length, 'événement(s)');
      console.log('📅 [CalendarService] ========================================');

      return uniqueEvents;
    } catch (error) {
      console.error('❌ [CalendarService] ========================================');
      console.error('❌ [CalendarService] ERREUR CRITIQUE:');
      console.error('❌ [CalendarService]', error);
      console.error('❌ [CalendarService] ========================================');
      return [];
    }
  }

  // Les autres méthodes restent inchangées pour l'instant
  async getDefaultCalendar(): Promise<string | null> {
    try {
      const hasPermission = await this.ensurePermissions();
      if (!hasPermission) return null;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        (cal) =>
          cal.allowsModifications &&
          (Platform.OS === 'ios' ? cal.source.name === 'Default' : (cal as any).isPrimary)
      );

      return defaultCalendar?.id || null;
    } catch (error) {
      console.error('Get default calendar error:', error);
      return null;
    }
  }

  async syncTasksToCalendar(tasks: any[]): Promise<void> {
    // Fonction de sync - garder pour plus tard
    console.log('syncTasksToCalendar appelé avec', tasks.length, 'tâches');
  }
}

export const calendarService = new CalendarService();
