import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '@/types';
import { apiService } from './api';

class CalendarService {
  private defaultCalendarId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📅 [CalendarService] Demande de permissions calendrier...');
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      console.log('📅 [CalendarService] Statut des permissions:', status);
      const granted = status === 'granted';
      console.log('📅 [CalendarService] Permissions accordées:', granted);
      return granted;
    } catch (error) {
      console.error('❌ [CalendarService] Erreur permissions calendrier:', error);
      return false;
    }
  }

  async getDefaultCalendar(): Promise<string | null> {
    try {
      if (this.defaultCalendarId) return this.defaultCalendarId;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Find default calendar
      const defaultCalendar = calendars.find(
        (cal) =>
          cal.allowsModifications &&
          (Platform.OS === 'ios'
            ? cal.source.name === 'Default'
            : cal.isPrimary)
      );

      if (defaultCalendar) {
        this.defaultCalendarId = defaultCalendar.id;
        return defaultCalendar.id;
      }

      // If no default found, create one
      const newCalendarId = await this.createCalendar();
      this.defaultCalendarId = newCalendarId;
      return newCalendarId;
    } catch (error) {
      console.error('Get default calendar error:', error);
      return null;
    }
  }

  private async createCalendar(): Promise<string> {
    const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await Calendar.getDefaultCalendarAsync()
        : { isLocalAccount: true, name: "Do'It" };

    const newCalendarId = await Calendar.createCalendarAsync({
      title: "Do'It",
      color: '#3B82F6',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId:
        Platform.OS === 'ios'
          ? (defaultCalendarSource as any).source.id
          : undefined,
      source:
        Platform.OS === 'android'
          ? (defaultCalendarSource as any)
          : undefined,
      name: "Do'It",
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      console.log('📅 [CalendarService] ========== DÉBUT getEvents ==========');
      console.log('📅 [CalendarService] Période:', startDate.toISOString(), 'à', endDate.toISOString());
      const allEvents: CalendarEvent[] = [];

      // 1. Get events from device calendar
      console.log('📅 [CalendarService] Étape 1: Récupération des événements du device...');
      const hasPermission = await this.requestPermissions();

      if (hasPermission) {
        console.log('✅ [CalendarService] Permissions OK, récupération des calendriers...');
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        console.log('📅 [CalendarService] Nombre de calendriers trouvés:', calendars.length);

        calendars.forEach((cal, index) => {
          console.log(`📅 [CalendarService] Calendrier ${index + 1}:`, {
            id: cal.id,
            title: cal.title,
            source: cal.source?.name || 'Unknown',
            type: cal.source?.type || 'Unknown',
            allowsModifications: cal.allowsModifications,
          });
        });

        const calendarIds = calendars.map((cal) => cal.id);
        console.log('📅 [CalendarService] IDs des calendriers:', calendarIds);

        console.log('📅 [CalendarService] Récupération des événements pour ces calendriers...');
        const deviceEvents = await Calendar.getEventsAsync(
          calendarIds,
          startDate,
          endDate
        );

        console.log('📅 [CalendarService] Nombre d\'événements trouvés sur le device:', deviceEvents.length);

        deviceEvents.forEach((event, index) => {
          console.log(`📅 [CalendarService] Événement device ${index + 1}:`, {
            id: event.id,
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            calendarId: event.calendarId,
          });
        });

        const mappedDeviceEvents = deviceEvents.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          location: event.location,
          notes: event.notes,
          source: 'device' as const,
        }));

        allEvents.push(...mappedDeviceEvents);
        console.log('✅ [CalendarService] Événements device ajoutés:', mappedDeviceEvents.length);
      } else {
        console.log('❌ [CalendarService] Pas de permissions calendrier !');
      }

      // 2. Get events from Google Calendar via backend
      console.log('📅 [CalendarService] Étape 2: Récupération Google Calendar via API...');
      try {
        const googleCalendarResponse = await apiService.getCalendarEvents(
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('📅 [CalendarService] Réponse Google Calendar:', googleCalendarResponse);

        if (googleCalendarResponse?.events && Array.isArray(googleCalendarResponse.events)) {
          console.log('📅 [CalendarService] Nombre d\'événements Google Calendar:', googleCalendarResponse.events.length);

          const googleEvents = googleCalendarResponse.events.map((event: any) => ({
            id: event.id,
            title: event.summary || event.title,
            startDate: new Date(event.start?.dateTime || event.start?.date),
            endDate: new Date(event.end?.dateTime || event.end?.date),
            location: event.location,
            notes: event.description,
            source: 'google' as const,
          }));

          allEvents.push(...googleEvents);
          console.log('✅ [CalendarService] Événements Google Calendar ajoutés:', googleEvents.length);
        } else {
          console.log('⚠️ [CalendarService] Pas d\'événements dans la réponse Google Calendar');
        }
      } catch (apiError) {
        console.error('❌ [CalendarService] Erreur Google Calendar:', apiError);
        // Continue without Google Calendar events
      }

      // 3. Get Google Tasks
      console.log('📅 [CalendarService] Étape 3: Récupération Google Tasks via API...');
      try {
        const googleTasksResponse = await apiService.getGoogleTasks();

        console.log('📅 [CalendarService] Réponse Google Tasks:', googleTasksResponse);

        if (googleTasksResponse?.tasks && Array.isArray(googleTasksResponse.tasks)) {
          console.log('📅 [CalendarService] Nombre de tâches Google:', googleTasksResponse.tasks.length);

          const taskEvents = googleTasksResponse.tasks
            .filter((task: any) => task.due)
            .map((task: any) => ({
              id: task.id,
              title: task.title,
              startDate: new Date(task.due),
              endDate: new Date(task.due),
              notes: task.notes,
              source: 'google-tasks' as const,
            }));

          allEvents.push(...taskEvents);
          console.log('✅ [CalendarService] Tâches Google ajoutées:', taskEvents.length);
        } else {
          console.log('⚠️ [CalendarService] Pas de tâches dans la réponse Google Tasks');
        }
      } catch (apiError) {
        console.error('❌ [CalendarService] Erreur Google Tasks:', apiError);
        // Continue without Google Tasks
      }

      console.log('📅 [CalendarService] ========== TOTAL ÉVÉNEMENTS:', allEvents.length, '==========');
      console.log('📅 [CalendarService] Détail des sources:');
      console.log('  - Device:', allEvents.filter(e => e.source === 'device').length);
      console.log('  - Google Calendar:', allEvents.filter(e => e.source === 'google').length);
      console.log('  - Google Tasks:', allEvents.filter(e => e.source === 'google-tasks').length);

      return allEvents;
    } catch (error) {
      console.error('❌ [CalendarService] ERREUR CRITIQUE dans getEvents:', error);
      return [];
    }
  }

  async createEvent(event: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    alarms?: number[]; // minutes before
  }): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) return null;

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        alarms: event.alarms?.map((minutes) => ({
          relativeOffset: -minutes,
          method: Calendar.AlarmMethod.ALERT,
        })),
        timeZone: 'UTC',
      });

      return eventId;
    } catch (error) {
      console.error('Create event error:', error);
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    updates: {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      location?: string;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      console.error('Update event error:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Delete event error:', error);
      return false;
    }
  }

  async syncTasksToCalendar(tasks: any[]): Promise<void> {
    try {
      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) return;

      for (const task of tasks) {
        if (!task.startDate) continue;

        if (task.calendarEventId) {
          // Update existing event
          await this.updateEvent(task.calendarEventId, {
            title: task.title,
            startDate: task.startDate,
            endDate: task.endDate || new Date(task.startDate.getTime() + 3600000), // +1 hour
            location: task.location?.name,
            notes: task.description,
          });
        } else {
          // Create new event
          const eventId = await this.createEvent({
            title: task.title,
            startDate: task.startDate,
            endDate: task.endDate || new Date(task.startDate.getTime() + 3600000),
            location: task.location?.name,
            notes: task.description,
            alarms: [15], // 15 minutes before
          });

          // Store eventId in task (you'll need to update your task in DB)
          if (eventId) {
            // Update task with calendar event ID
            console.log('Created calendar event:', eventId);
          }
        }
      }
    } catch (error) {
      console.error('Sync to calendar error:', error);
    }
  }
}

export const calendarService = new CalendarService();
