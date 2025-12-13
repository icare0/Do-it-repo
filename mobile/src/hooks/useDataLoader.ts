/**
 * Data Loader Hook
 * Loads all app data from WatermelonDB on startup
 */

import { useEffect, useState } from 'react';
import { database, TaskModel } from '@/database';
import { useTaskStore } from '@/store/taskStore';
import { Task } from '@/types';
import { Q } from '@nozbe/watermelondb';
import { notificationService } from '@/services/notificationService';

export function useDataLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { setTasks } = useTaskStore();

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setIsLoading(true);
      setError(null);

      // Load tasks from WatermelonDB
      const taskCollection = database.get<TaskModel>('tasks');

      // Get all non-deleted tasks
      const dbTasks = await taskCollection
        .query(
          Q.where('_status', Q.notEq('deleted'))
        )
        .fetch();

      // Convert WatermelonDB models to Task objects
      const tasks: Task[] = dbTasks.map(dbTask => ({
        id: dbTask.id,
        userId: dbTask.userId,
        title: dbTask.title,
        description: dbTask.description || undefined,
        completed: dbTask.completed,
        startDate: dbTask.startDate ? new Date(dbTask.startDate) : undefined,
        endDate: dbTask.endDate ? new Date(dbTask.endDate) : undefined,
        duration: dbTask.duration || undefined,
        category: dbTask.category || undefined,
        tags: dbTask.tags || undefined,
        priority: dbTask.priority as 'low' | 'medium' | 'high',
        location: dbTask.location || undefined,
        reminder: dbTask.reminder || undefined,
        recurringPattern: dbTask.recurringPattern || undefined,
        calendarEventId: dbTask.calendarEventId || undefined,
        createdAt: new Date(dbTask.createdAt),
        updatedAt: new Date(dbTask.updatedAt),
        syncedAt: dbTask.syncedAt ? new Date(dbTask.syncedAt) : undefined,
      }));

      // Update Zustand store
      setTasks(tasks);

      console.log(`[DataLoader] Loaded ${tasks.length} tasks from database`);

      // Schedule notifications for all upcoming tasks
      await scheduleAllNotifications(tasks);

    } catch (err) {
      console.error('[DataLoader] Failed to load data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Schedule notifications for all upcoming tasks with reminders
   */
  async function scheduleAllNotifications(tasks: Task[]) {
    try {
      const now = new Date();
      let scheduledCount = 0;

      for (const task of tasks) {
        // Skip completed tasks
        if (task.completed) continue;

        // Skip tasks without start date
        if (!task.startDate) continue;

        // Skip tasks in the past (more than 1 hour ago)
        const taskDate = new Date(task.startDate);
        if (taskDate.getTime() < now.getTime() - 3600000) continue;

        // Schedule notification
        try {
          await notificationService.scheduleTaskNotification(task as any);
          scheduledCount++;
        } catch (error) {
          console.error(`[DataLoader] Failed to schedule notification for task ${task.id}:`, error);
        }
      }

      console.log(`[DataLoader] Scheduled ${scheduledCount} task notifications`);
    } catch (error) {
      console.error('[DataLoader] Failed to schedule notifications:', error);
    }
  }

  return {
    isLoading,
    error,
    reload: loadAllData,
  };
}

/**
 * Subscribe to task changes in real-time
 */
export function useTaskSubscription() {
  const { setTasks, addTask, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    const taskCollection = database.get<TaskModel>('tasks');

    // Subscribe to all task changes
    const subscription = taskCollection
      .query()
      .observe()
      .subscribe(tasks => {
        const taskData: Task[] = tasks.map(dbTask => ({
          id: dbTask.id,
          userId: dbTask.userId,
          title: dbTask.title,
          description: dbTask.description || undefined,
          completed: dbTask.completed,
          startDate: dbTask.startDate ? new Date(dbTask.startDate) : undefined,
          endDate: dbTask.endDate ? new Date(dbTask.endDate) : undefined,
          duration: dbTask.duration || undefined,
          category: dbTask.category || undefined,
          tags: dbTask.tags || undefined,
          priority: dbTask.priority as 'low' | 'medium' | 'high',
          location: dbTask.location || undefined,
          reminder: dbTask.reminder || undefined,
          recurringPattern: dbTask.recurringPattern || undefined,
          calendarEventId: dbTask.calendarEventId || undefined,
          createdAt: new Date(dbTask.createdAt),
          updatedAt: new Date(dbTask.updatedAt),
          syncedAt: dbTask.syncedAt ? new Date(dbTask.syncedAt) : undefined,
        }));

        setTasks(taskData);
      });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [setTasks]);
}
