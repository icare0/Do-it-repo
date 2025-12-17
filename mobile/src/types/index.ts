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

  // 🆕 AI Engine enhancements
  hasSpecificTime?: boolean; // true = "demain 14h", false = "demain" (flexible)
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'; // For flexible tasks
  suggestedTimeSlot?: { // AI-suggested time slot based on habits
    start: number; // 0-23
    end: number;
  };
  deadline?: Date; // Different from startDate (e.g., "finish by Friday")
  originalInput?: string; // Original user input for learning
  parsingConfidence?: number; // AI confidence score (0-1)
  detectedIntent?: string; // shopping, call, meeting, work, etc.
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
  Onboarding: undefined;
  Today: undefined;
  TaskList: undefined;
  TaskDetail: { taskId: string };
  QuickAdd: { prefillText?: string } | undefined;
  Map: undefined;
  Calendar: undefined;
  Settings: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  FocusMode: { taskTitle?: string } | undefined;
  SmartAssistant: undefined;
  Stats: undefined;
  WidgetSetup: undefined;
};
