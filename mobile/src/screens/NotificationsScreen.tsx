import NetInfo from '@react-native-community/netinfo';
import { database, TaskModel, SyncQueueModel } from '@/database';
import { apiService } from './api';
import { useSyncStore } from '@/store/syncStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;

  async initialize() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      if (wasOffline && this.isOnline) {
        console.log('🌐 Back online, triggering sync');
        this.sync();
      }
    });

    this.startPeriodicSync();

    const { token, refreshToken } = useAuthStore.getState();
    if (token && refreshToken) {
      console.log("🔄 Initial sync triggered");
      await this.sync();
    } else {
      console.log("⏸️ Initial sync skipped (no tokens yet)");
    }
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('🕐 Periodic sync triggered');
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  async sync() {
    if (!this.isOnline) {
      console.log('📴 Offline, skipping sync');
      return;
    }

    const { token, refreshToken } = useAuthStore.getState();
    if (!token || !refreshToken) {
      console.log('🔐 Skipping sync - no token or refreshToken');
      return;
    }

    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return;
    }

    try {
      this.isSyncing = true;
      const syncStore = useSyncStore.getState();
      syncStore.startSync();

      console.log('🚀 Starting sync for authenticated user');

      await this.pushChanges();
      await this.pullChanges();

      syncStore.finishSync();
      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync error:', error);
      const syncStore = useSyncStore.getState();
      syncStore.finishSync((error as Error).message);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushChanges() {
    try {
      const syncQueue = await database
        .get<SyncQueueModel>('sync_queue')
        .query()
        .fetch();

      const pendingChanges = syncQueue.filter((item) => !item.synced);

      if (pendingChanges.length === 0) {
        console.log('✨ No pending changes to push');
        return;
      }

      console.log(`📤 Pushing ${pendingChanges.length} changes to server`);

      const groupedChanges: Record<string, any[]> = {};
      for (const change of pendingChanges) {
        if (!groupedChanges[change.entityType]) {
          groupedChanges[change.entityType] = [];
        }

        // ✅ Fix: Ensure proper data format for API
        const changeData = {
          id: change.entityId,
          operation: change.operation,
          data: this.sanitizeTaskData(change.data),
        };

        console.log(`📋 Preparing change: ${change.operation} for ${change.entityId}`, changeData);
        groupedChanges[change.entityType].push(changeData);
      }

      // Send to API
      await apiService.sync(groupedChanges);

      // Mark as synced
      await database.write(async () => {
        for (const change of pendingChanges) {
          await change.update((record) => {
            record.synced = true;
          });
        }
      });

      useSyncStore.getState().setSyncStatus({ pendingChanges: 0 });
      console.log('✅ Push complete');
    } catch (error) {
      console.error('❌ Push changes error:', error);
      throw error;
    }
  }

  private sanitizeTaskData(data: any) {
    // ✅ Fix: Remove undefined values and ensure proper format
    const sanitized = {
      ...data,
      // Convert dates to ISO strings
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
      updatedAt: new Date().toISOString(), // Always update timestamp
    };

    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }

  private async pullChanges() {
    try {
      const lastSync = useSyncStore.getState().lastSync;
      const lastSyncTime = lastSync ? lastSync.toISOString() : undefined;

      console.log(`📥 Making API call to getTasks with params:`, { startDate: lastSyncTime });

      const response = await apiService.getTasks({
        startDate: lastSyncTime,
      });

      console.log(`📊 Raw API response:`, response);

      if (!response.tasks || response.tasks.length === 0) {
        console.log('📭 No valid tasks to pull from server after filtering');
        return;
      }

      // ✅ Fix: Filter valid tasks and avoid duplicates
      const validTasks = response.tasks.filter(task =>
        task &&
        task.id &&
        task.title &&
        task.userId
      );

      console.log(`📋 Pulling ${validTasks.length} valid tasks from server (filtered from ${response.tasks.length} total)`);

      // ✅ Fix: Better duplicate detection
      const existingTaskIds = new Set();
      const existingTasks = await database.get<TaskModel>('tasks').query().fetch();

      existingTasks.forEach(task => {
        existingTaskIds.add(task.id);
        // Also track by title for potential duplicates
        if (task.title) {
          existingTaskIds.add(`title:${task.title.toLowerCase()}`);
        }
      });

      await database.write(async () => {
        for (const [index, serverTask] of validTasks.entries()) {
          console.log(`📝 Processing task ${index + 1}/${validTasks.length}:`, {
            _id: serverTask._id,
            id: serverTask.id,
            title: serverTask.title
          });

          try {
            // ✅ Fix: Check for existing task by ID or title
            const titleKey = `title:${serverTask.title.toLowerCase()}`;

            if (existingTaskIds.has(serverTask.id) || existingTaskIds.has(titleKey)) {
              console.log(`🔄 Task already exists (skipping): ${serverTask.id} - ${serverTask.title}`);
              continue;
            }

            console.log(`➕ Task not found in cache: ${serverTask.id}, will create new`);

            // ✅ Fix: Create task with proper ID mapping
            console.log(`📝 Creating new task: ${serverTask.id}`);

            await database.get<TaskModel>('tasks').create((task) => {
              // ✅ Important: Use server ID to avoid duplicates
              task._raw.id = serverTask.id;
              Object.assign(task, this.mapServerTaskToLocal(serverTask));
            });

            // Track this ID to avoid duplicates in this batch
            existingTaskIds.add(serverTask.id);
            existingTaskIds.add(titleKey);

          } catch (taskError) {
            console.error(`❌ Error processing task ${serverTask.id}:`, taskError);
            // Continue with other tasks instead of failing the entire sync
          }
        }
      });

      await this.refreshTaskStore();
      console.log('✅ Pull complete successfully');
    } catch (error) {
      console.error('❌ Pull changes error:', error);
      throw error;
    }
  }

  private mapServerTaskToLocal(serverTask: any): Partial<TaskModel> {
    return {
      userId: serverTask.userId,
      title: serverTask.title,
      description: serverTask.description,
      completed: Boolean(serverTask.completed),
      startDate: serverTask.startDate ? new Date(serverTask.startDate) : undefined,
      endDate: serverTask.endDate ? new Date(serverTask.endDate) : undefined,
      duration: serverTask.duration ? Number(serverTask.duration) : undefined,
      category: serverTask.category,
      tags: Array.isArray(serverTask.tags) ? serverTask.tags : [],
      priority: serverTask.priority || 'medium',
      location: serverTask.location,
      reminder: serverTask.reminder,
      recurringPattern: serverTask.recurringPattern,
      calendarEventId: serverTask.calendarEventId,
      syncedAt: new Date(),
    };
  }

  async addToSyncQueue(entityType: string, entityId: string, operation: 'create' | 'update' | 'delete', data: any) {
    console.log(`📝 Adding to sync queue: ${operation} ${entityType} ${entityId}`);

    try {
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

      // ✅ Fix: Trigger sync after a short delay to batch operations
      const { token, refreshToken } = useAuthStore.getState();
      if (this.isOnline && token && refreshToken && !this.isSyncing) {
        setTimeout(() => this.sync(), 2000); // 2 second delay to batch operations
      }
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
    }
  }

  private async refreshTaskStore() {
    try {
      console.log('🔄 Starting refreshTaskStore...');

      const tasks = await database.get<TaskModel>('tasks').query().fetch();
      console.log(`📊 Found ${tasks.length} tasks in local database`);

      const mappedTasks = tasks.map((task, index) => {
        console.log(`🗂️ Mapped task ${index + 1}: ${task.id} - ${task.title}`);

        return {
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
        };
      });

      console.log(`✅ Successfully mapped ${mappedTasks.length} tasks out of ${tasks.length}`);
      useTaskStore.getState().setTasks(mappedTasks);
      console.log(`🔄 Refreshed task store with ${mappedTasks.length} tasks`);
    } catch (error) {
      console.error('❌ Error refreshing task store:', error);
    }
  }

  async forceSyncNow() {
    console.log('🚀 Force sync requested');
    await this.sync();
  }

  async clearDuplicates() {
    console.log('🧹 Starting duplicate cleanup...');

    try {
      const tasks = await database.get<TaskModel>('tasks').query().fetch();
      const titleMap = new Map<string, TaskModel[]>();

      // Group by title
      tasks.forEach(task => {
        const key = task.title.toLowerCase().trim();
        if (!titleMap.has(key)) {
          titleMap.set(key, []);
        }
        titleMap.get(key)!.push(task);
      });

      // Find and remove duplicates
      let duplicatesRemoved = 0;
      await database.write(async () => {
        for (const [title, duplicates] of titleMap) {
          if (duplicates.length > 1) {
            console.log(`🔍 Found ${duplicates.length} duplicates for: ${title}`);

            // Keep the most recent one (by updatedAt)
            duplicates.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
            const toKeep = duplicates[0];
            const toRemove = duplicates.slice(1);

            for (const task of toRemove) {
              console.log(`🗑️ Removing duplicate: ${task.id}`);
              await task.markAsDeleted();
              duplicatesRemoved++;
            }
          }
        }
      });

      if (duplicatesRemoved > 0) {
        await this.refreshTaskStore();
        console.log(`✅ Removed ${duplicatesRemoved} duplicate tasks`);
      } else {
        console.log('✨ No duplicates found');
      }

    } catch (error) {
      console.error('❌ Error cleaning duplicates:', error);
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isSyncing = false;
  }
}

export const syncService = new SyncService();