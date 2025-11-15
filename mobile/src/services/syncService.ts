import NetInfo from '@react-native-community/netinfo';
import { database, TaskModel, SyncQueueModel } from '@/database';
import { apiService } from './api';
import { useSyncStore } from '@/store/syncStore';
import { useTaskStore } from '@/store/taskStore';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  async initialize() {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      // If we just came online, trigger sync
      if (wasOffline && this.isOnline) {
        this.sync();
      }
    });

    // Start periodic sync (every 5 minutes when online)
    this.startPeriodicSync();

    // Initial sync
    await this.sync();
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async sync() {
    if (!this.isOnline) {
      console.log('Offline, skipping sync');
      return;
    }

    const syncStore = useSyncStore.getState();
    if (syncStore.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    try {
      syncStore.startSync();

      // 1. Push local changes to server
      await this.pushChanges();

      // 2. Pull server changes
      await this.pullChanges();

      syncStore.finishSync();
    } catch (error) {
      console.error('Sync error:', error);
      syncStore.finishSync((error as Error).message);
    }
  }

  private async pushChanges() {
    try {
      // Get all pending changes from sync queue
      const syncQueue = await database
        .get<SyncQueueModel>('sync_queue')
        .query()
        .fetch();

      const pendingChanges = syncQueue.filter((item) => !item.synced);

      if (pendingChanges.length === 0) {
        return;
      }

      console.log(`Pushing ${pendingChanges.length} changes to server`);

      // Group changes by entity type
      const groupedChanges: Record<string, any[]> = {};
      for (const change of pendingChanges) {
        if (!groupedChanges[change.entityType]) {
          groupedChanges[change.entityType] = [];
        }
        groupedChanges[change.entityType].push({
          id: change.entityId,
          operation: change.operation,
          data: change.data,
        });
      }

      // Send to server
      const response = await apiService.sync(groupedChanges);

      // Mark changes as synced
      await database.write(async () => {
        for (const change of pendingChanges) {
          await change.update((record) => {
            record.synced = true;
          });
        }
      });

      // Update sync store
      useSyncStore.getState().setSyncStatus({
        pendingChanges: 0,
      });

      console.log('Push complete');
    } catch (error) {
      console.error('Push changes error:', error);
      throw error;
    }
  }

  private async pullChanges() {
    try {
      const lastSync = useSyncStore.getState().lastSync;
      const lastSyncTime = lastSync ? lastSync.toISOString() : undefined;

      // Get changes from server
      const response = await apiService.getTasks({
        startDate: lastSyncTime,
      });

      if (!response.tasks || response.tasks.length === 0) {
        return;
      }

      console.log(`Pulling ${response.tasks.length} tasks from server`);

      // Update local database
      await database.write(async () => {
        for (const serverTask of response.tasks) {
          // Check if task exists locally
          const localTask = await database
            .get<TaskModel>('tasks')
            .find(serverTask.id)
            .catch(() => null);

          if (localTask) {
            // Update existing task
            await localTask.update((task) => {
              Object.assign(task, this.mapServerTaskToLocal(serverTask));
            });
          } else {
            // Create new task
            await database.get<TaskModel>('tasks').create((task) => {
              task._raw.id = serverTask.id;
              Object.assign(task, this.mapServerTaskToLocal(serverTask));
            });
          }
        }
      });

      // Update task store
      await this.refreshTaskStore();

      console.log('Pull complete');
    } catch (error) {
      console.error('Pull changes error:', error);
      throw error;
    }
  }

  private mapServerTaskToLocal(serverTask: any): Partial<TaskModel> {
    return {
      userId: serverTask.userId,
      title: serverTask.title,
      description: serverTask.description,
      completed: serverTask.completed,
      startDate: serverTask.startDate ? new Date(serverTask.startDate) : undefined,
      endDate: serverTask.endDate ? new Date(serverTask.endDate) : undefined,
      duration: serverTask.duration,
      category: serverTask.category,
      tags: serverTask.tags,
      priority: serverTask.priority,
      location: serverTask.location,
      reminder: serverTask.reminder,
      recurringPattern: serverTask.recurringPattern,
      calendarEventId: serverTask.calendarEventId,
      syncedAt: new Date(),
    };
  }

  async addToSyncQueue(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ) {
    await database.write(async () => {
      await database.get<SyncQueueModel>('sync_queue').create((record) => {
        record.entityType = entityType;
        record.entityId = entityId;
        record.operation = operation;
        record.data = data;
        record.synced = false;
      });
    });

    useSyncStore.getState().incrementPendingChanges();

    // Trigger immediate sync if online
    if (this.isOnline) {
      setTimeout(() => this.sync(), 1000);
    }
  }

  private async refreshTaskStore() {
    const tasks = await database
      .get<TaskModel>('tasks')
      .query()
      .fetch();

    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      completed: task.completed,
      startDate: task.startDate,
      endDate: task.endDate,
      duration: task.duration,
      category: task.category,
      tags: task.tags,
      priority: task.priority,
      location: task.location,
      reminder: task.reminder,
      recurringPattern: task.recurringPattern,
      calendarEventId: task.calendarEventId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      syncedAt: task.syncedAt,
    }));

    useTaskStore.getState().setTasks(mappedTasks);
  }

  async forceSyncNow() {
    await this.sync();
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();
