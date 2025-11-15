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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ITask extends Document {
  userId: string;
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
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}
