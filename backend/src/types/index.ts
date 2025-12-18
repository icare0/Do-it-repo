import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  provider: 'local' | 'google' | 'apple';
  providerId?: string;
  refreshTokens: string[];
  googleRefreshToken?: string;
  googleCalendarSyncToken?: string;
  fcmToken?: string;
  timezone: string;
  preferences: {
    language: string;
    notificationsEnabled: boolean;
    geofenceNotificationsEnabled: boolean;
    defaultTaskDuration: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ITask extends Document {
  userId: string;
  clientId?: string;
  title: string;
  description?: string;
  completed: boolean;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  category?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
  location?: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  reminder?: {
    type: 'time' | 'location';
    time?: Date;
    locationId?: string;
    notificationSent?: boolean;
  };
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  calendarEventId?: string;
  version: number;
  lastSyncedAt?: Date;
  deletedAt?: Date;
  completedAt?: Date;
  order: number;
  notes?: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
    size?: number;
  }>;
  subtasks?: Array<{
    title: string;
    completed: boolean;
    order: number;
  }>;
  // 🆕 AI Engine fields
  hasSpecificTime?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  suggestedTimeSlot?: {
    start: number;
    end: number;
  };
  deadline?: Date;
  originalInput?: string;
  parsingConfidence?: number;
  detectedIntent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeofence extends Document {
  taskId: string;
  userId: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    timezone?: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}
