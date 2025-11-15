import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '@/types';

class CalendarService {
  private defaultCalendarId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Calendar permission error:', error);
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
        : { isLocalAccount: true, name: 'Do'It' };

    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'Do'It',
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
      name: 'Do'It',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((cal) => cal.id);

      const events = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
      }));
    } catch (error) {
      console.error('Get events error:', error);
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
