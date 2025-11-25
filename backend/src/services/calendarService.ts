import { google, Auth } from 'googleapis';
import logger from '../config/logger';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class CalendarService {
    private oauth2Client: Auth.OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback'
        );
    }

    public getAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force refresh token generation
        });
    }

    public async getTokens(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    public getOAuthClient(refreshToken: string): Auth.OAuth2Client {
        const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback'
        );
        client.setCredentials({ refresh_token: refreshToken });
        return client;
    }

    public async listEvents(refreshToken: string, maxResults: number = 10) {
        const auth = this.getOAuthClient(refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return res.data.items;
        } catch (error) {
            logger.error('Error fetching calendar events:', error);
            throw error;
        }
    }

    public async addToCalendar(refreshToken: string, eventData: any) {
        const auth = this.getOAuthClient(refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const event = {
                summary: eventData.title,
                description: eventData.description,
                start: {
                    dateTime: eventData.startDate, // ISO string
                    timeZone: 'UTC', // Adjust as needed
                },
                end: {
                    dateTime: eventData.endDate, // ISO string
                    timeZone: 'UTC',
                },
            };

            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            return res.data;
        } catch (error) {
            logger.error('Error adding event to calendar:', error);
            throw error;
        }
    }

    public async syncGoogleEventsToTasks(userId: string, events: any[]) {
        try {
            const Task = require('../models/Task').default; // Lazy load to avoid circular dependency if any

            for (const event of events) {
                if (!event.start?.dateTime) continue; // Skip all-day events for now or handle differently

                const taskData = {
                    userId,
                    title: event.summary || 'No Title',
                    description: event.description || '',
                    startDate: new Date(event.start.dateTime),
                    endDate: event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.start.dateTime),
                    calendarEventId: event.id,
                    category: 'Google Calendar',
                    priority: 'medium',
                };

                await Task.findOneAndUpdate(
                    { calendarEventId: event.id, userId },
                    { $set: taskData },
                    { upsert: true, new: true }
                );
            }
            logger.info(`Synced ${events.length} Google events for user ${userId}`);
        } catch (error) {
            logger.error('Error syncing google events to tasks:', error);
            throw error;
        }
    }
}

export const calendarService = new CalendarService();
