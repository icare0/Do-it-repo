export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // in minutes
  category?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
  location?: Location;
  reminder?: Reminder;
  recurringPattern?: RecurringPattern;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface Location {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius?: number; // geofence radius in meters
}

export interface Reminder {
  type: 'time' | 'location';
  time?: Date;
  locationId?: string;
  notificationSent?: boolean;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday is 0
  endDate?: Date;
}

export interface GeofenceRegion {
  id: string;
  taskId: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export interface SyncStatus {
  lastSync?: Date;
  pendingChanges: number;
  isSyncing: boolean;
  error?: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Today: undefined;
  TaskList: undefined;
  TaskDetail: { taskId: string };
  QuickAdd: undefined;
  Map: undefined;
  Calendar: undefined;
  Settings: undefined;
};
