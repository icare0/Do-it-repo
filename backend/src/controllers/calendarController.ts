import { Response } from 'express';
import { AuthRequest } from '../types';
import { calendarService } from '../services/calendarService';
import User from '../models/User';
import logger from '../config/logger';

export const connectCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const url = calendarService.getAuthUrl();
        res.json({ url });
    } catch (error) {
        logger.error('Error generating auth url:', error);
        res.status(500).json({ message: 'Failed to generate auth url' });
    }
};

export const calendarCallback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { code } = req.body;
        const { user } = req;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const tokens = await calendarService.getTokens(code);

        if (tokens.refresh_token) {
            await User.findByIdAndUpdate(user.id, {
                googleRefreshToken: tokens.refresh_token,
            });
        }

        res.json({ message: 'Calendar connected successfully' });
    } catch (error) {
        logger.error('Error in calendar callback:', error);
        res.status(500).json({ message: 'Failed to connect calendar' });
    }
};

export const getCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { user } = req;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const dbUser = await User.findById(user.id).select('+googleRefreshToken');

        if (!dbUser || !dbUser.googleRefreshToken) {
            res.status(400).json({ message: 'Calendar not connected' });
            return;
        }

        const events = await calendarService.listEvents(dbUser.googleRefreshToken);

        // Sync events to tasks
        await calendarService.syncGoogleEventsToTasks(user.id, events || []);

        res.json(events);
    } catch (error) {
        logger.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
};

export const syncTaskToCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { user } = req;
        const { taskId, title, description, startDate, endDate } = req.body;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const dbUser = await User.findById(user.id).select('+googleRefreshToken');

        if (!dbUser || !dbUser.googleRefreshToken) {
            res.status(400).json({ message: 'Calendar not connected' });
            return;
        }

        const event = await calendarService.addToCalendar(dbUser.googleRefreshToken, {
            title,
            description,
            startDate,
            endDate,
        });

        res.json(event);
    } catch (error) {
        logger.error('Error syncing task:', error);
        res.status(500).json({ message: 'Failed to sync task' });
    }
};
