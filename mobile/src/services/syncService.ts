import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database, TaskModel, SyncQueueModel } from '@/database';
import { apiService } from './api';
import { useSyncStore } from '@/store/syncStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  async initialize() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      if (wasOffline && this.isOnline) {
        // Seulement sync si on est authentifié
        const { token, refreshToken } = useAuthStore.getState();
        if (token && refreshToken) {
          this.sync();
        }
      }
    });

    this.startPeriodicSync();

    console.log("Sync service initialized (waiting for authentication)");
  }

  async nukeDatabase() {
    console.log('🚨 NUCLEAR OPTION: Completely destroying database...');
    try {
      // Reset tous les stores d'abord
      useTaskStore.getState().setTasks([]);
      useSyncStore.getState().setSyncStatus({ pendingChanges: 0, lastSync: undefined });

      // Essayer de supprimer le fichier de base directement si possible
      try {
        await database.write(async () => {
          // Vider toutes les collections
          const collections = ['tasks', 'sync_queue', 'geofence_regions'];
          for (const tableName of collections) {
            try {
              console.log(`Nuking table: ${tableName}`);
              const collection = database.get(tableName);

              // Obtenir TOUS les enregistrements sans exception
              const allRecords = await collection.query().fetch();

              // Les supprimer un par un avec force
              for (let i = 0; i < allRecords.length; i++) {
                const record = allRecords[i];
                try {
                  if (record) {
                    await record.destroyPermanently();
                  }
                } catch (destroyError) {
                  console.log(`Force destroying record ${i}:`, destroyError);
                  // Continuer même en cas d'erreur
                }
              }

              console.log(`Nuked ${allRecords.length} records from ${tableName}`);
            } catch (tableNukeError) {
              console.log(`Error nuking table ${tableName}:`, tableNukeError);
            }
          }
        });
      } catch (writeError) {
        console.error('Database write failed during nuke:', writeError);
      }

      console.log('🚨 Database nuke completed');

    } catch (error) {
      console.error('🚨 Database nuke failed:', error);
    }
  }

  private async forceCleanDatabase() {
    console.log('Force cleaning database to fix corruption...');
    try {
      // Reset complet de toutes les données
      useTaskStore.getState().setTasks([]);
      useSyncStore.getState().setSyncStatus({ pendingChanges: 0, lastSync: undefined });

      await database.write(async () => {
        try {
          // Méthode 1: Utiliser unsafeResetDatabase si disponible
          if ((database as any).unsafeResetDatabase) {
            console.log('Using unsafeResetDatabase method');
            await (database as any).unsafeResetDatabase();
            console.log('Database reset completed');
            return;
          }
        } catch (resetError) {
          console.log('unsafeResetDatabase not available, using manual cleanup');
        }

        // Méthode 2: Nettoyage manuel avec gestion d'erreurs
        const tables = ['tasks', 'sync_queue', 'geofence_regions'];

        for (const tableName of tables) {
          try {
            console.log(`Cleaning table: ${tableName}`);
            const collection = database.get(tableName);
            const records = await collection.query().fetch();
            console.log(`Found ${records.length} records in ${tableName}`);

            // Supprimer chaque enregistrement individuellement
            for (const record of records) {
              try {
                if (record && record.id) {
                  await record.destroyPermanently();
                }
              } catch (recordError) {
                console.log(`Error deleting record from ${tableName}:`, recordError);
              }
            }

            console.log(`Cleaned ${tableName} table`);
          } catch (tableError) {
            console.log(`Error cleaning table ${tableName}:`, tableError);
          }
        }
      });

      console.log('Force database cleanup completed');

    } catch (error) {
      console.error('Force database cleanup failed:', error);

      // En cas d'échec total, essayer de vider les stores au minimum
      try {
        useTaskStore.getState().setTasks([]);
        useSyncStore.getState().setSyncStatus({ pendingChanges: 0 });
        console.log('Stores reset to empty state');
      } catch (storeError) {
        console.error('Even store reset failed:', storeError);
      }
    }
  }

  private async checkAndFixDatabase() {
    try {
      console.log('Checking database integrity...');
      const tasks = await database.get<TaskModel>('tasks').query().fetch();

      // Count null or corrupted tasks
      let corruptedCount = 0;
      for (const task of tasks) {
        if (!task || !task.id) {
          corruptedCount++;
        }
      }

      if (corruptedCount > 0) {
        console.warn(`Found ${corruptedCount} corrupted tasks, clearing database...`);
        await this.clearLocalDatabase();
        console.log('Database cleaned, will re-sync from server');
      } else {
        console.log('Database integrity check passed');
      }
    } catch (error) {
      console.error('Database integrity check failed, clearing database:', error);
      await this.clearLocalDatabase();
    }
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  async sync() {
    if (!this.isOnline) {
      console.log('Offline, skipping sync');
      return;
    }

    const { token, refreshToken, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token || !refreshToken) {
      console.log('Not authenticated, skipping sync');
      return;
    }

    const syncStore = useSyncStore.getState();
    if (syncStore.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    try {
      console.log('Starting sync for authenticated user');
      syncStore.startSync();

      await this.pushChanges();
      await this.pullChanges();

      syncStore.finishSync();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
      syncStore.finishSync((error as Error).message);
    }
  }

  private async pushChanges() {
    try {
      const syncQueue = await database
        .get<SyncQueueModel>('sync_queue')
        .query()
        .fetch();

      const pendingChanges = syncQueue.filter((item) => !item.synced);

      if (pendingChanges.length === 0) return;

      console.log(`Pushing ${pendingChanges.length} changes to server`);

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

      await apiService.sync(groupedChanges);

      await database.write(async () => {
        for (const change of pendingChanges) {
          await change.update((record) => {
            record.synced = true;
          });
        }
      });

      useSyncStore.getState().setSyncStatus({ pendingChanges: 0 });

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

      console.log('Making API call to getTasks with params:', { startDate: lastSyncTime });
      const response = await apiService.getTasks({
        startDate: lastSyncTime,
      });

      console.log('Raw API response:', JSON.stringify(response, null, 2));

      if (!response || !response.tasks) {
        console.log('No response or no tasks property in response');
        return;
      }

      // Filtrer les éléments null/undefined
      const validTasks = response.tasks.filter((task: any, index: number) => {
        if (!task) {
          console.warn(`Null task found at index ${index}, skipping`);
          return false;
        }
        return true;
      });

      if (validTasks.length === 0) {
        console.log('No valid tasks to pull from server after filtering');
        return;
      }

      console.log(`Pulling ${validTasks.length} valid tasks from server (filtered from ${response.tasks.length} total)`);

      await database.write(async () => {
        for (let i = 0; i < validTasks.length; i++) {
          const serverTask = validTasks[i];

          console.log(`Processing task ${i + 1}/${validTasks.length}:`, {
            id: serverTask.id,
            _id: serverTask._id,
            title: serverTask.title,
          });

          // Utiliser clientId (notre UUID local) en priorité, sinon _id ou id
          const taskId = serverTask.clientId || serverTask._id || serverTask.id;
          if (!taskId) {
            console.warn('Task without ID received from server:', JSON.stringify(serverTask));
            continue;
          }

          try {
            // Vérifier si la tâche existe déjà
            let localTask: TaskModel | null = null;

            try {
              localTask = await database.get<TaskModel>('tasks').find(taskId);
              console.log(`Found existing task in cache: ${taskId}`);
            } catch (findError) {
              console.log(`Task not found in cache: ${taskId}, will create new`);
            }

            if (localTask) {
              // Si la tâche est marquée comme supprimée localement, on ne la met pas à jour depuis le serveur
              // pour éviter de la "ressusciter" si le serveur ne sait pas encore qu'elle est supprimée
              // @ts-ignore - _status est interne mais accessible
              if (localTask._status === 'deleted') {
                console.log(`Skipping update for locally deleted task: ${taskId}`);
                continue;
              }

              console.log(`Updating existing task: ${taskId}`);
              await localTask.update((task) => {
                Object.assign(task, this.mapServerTaskToLocal(serverTask));
              });
            } else {
              // Vérifier si la tâche existe dans la DB mais n'est pas en cache
              try {
                const existingTasks = await database.get<TaskModel>('tasks')
                  .query()
                  .fetch();

                const existingTask = existingTasks.find(t => t.id === taskId);

                if (existingTask) {
                  console.log(`Task exists in DB but not cached, updating: ${taskId}`);
                  await existingTask.update((task) => {
                    Object.assign(task, this.mapServerTaskToLocal(serverTask));
                  });
                } else {
                  console.log(`Creating new task: ${taskId}`);
                  await database.get<TaskModel>('tasks').create((task) => {
                    task._raw.id = taskId;
                    Object.assign(task, this.mapServerTaskToLocal(serverTask));
                  });
                }
              } catch (dbError) {
                console.error('Error checking existing tasks:', dbError);
                // En cas d'erreur, on ignore cette tâche
                continue;
              }
            }
          } catch (taskError) {
            console.error('Error processing task:', taskId, taskError);

            // Si c'est une erreur de contrainte unique, on essaie de nettoyer
            if (taskError.message.includes('UNIQUE constraint failed')) {
              console.log(`Attempting to clean up duplicate task: ${taskId}`);
              try {
                await this.cleanupDuplicateTask(taskId);
              } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
              }
            }
          }
        }
      });

      await this.refreshTaskStore();
      useSyncStore.getState().setSyncStatus({ lastSync: new Date() });

      console.log('Pull complete successfully');
    } catch (error) {
      console.error('Pull changes error:', error);
      console.error('Error stack:', (error as Error).stack);
      throw error;
    }
  }

  private async cleanupDuplicateTask(taskId: string) {
    try {
      console.log(`Cleaning up duplicate task: ${taskId}`);

      // Trouver et supprimer toutes les instances de cette tâche
      const allTasks = await database.get<TaskModel>('tasks').query().fetch();
      const duplicates = allTasks.filter(t => t.id === taskId);

      console.log(`Found ${duplicates.length} duplicates for task ${taskId}`);

      for (const duplicate of duplicates) {
        try {
          await duplicate.destroyPermanently();
          console.log(`Deleted duplicate task: ${taskId}`);
        } catch (deleteError) {
          console.error(`Error deleting duplicate:`, deleteError);
        }
      }
    } catch (error) {
      console.error('Error in cleanupDuplicateTask:', error);
    }
  }

  private mapServerTaskToLocal(serverTask: any): Partial<TaskModel> {
    return {
      userId: serverTask.userId || '',
      title: serverTask.title || '',
      description: serverTask.description,
      completed: Boolean(serverTask.completed),
      startDate: serverTask.startDate ? new Date(serverTask.startDate) : undefined,
      endDate: serverTask.endDate ? new Date(serverTask.endDate) : undefined,
      duration: serverTask.duration,
      category: serverTask.category,
      tags: serverTask.tags || [],
      priority: serverTask.priority || 'medium',
      location: serverTask.location,
      reminder: serverTask.reminder,
      recurringPattern: serverTask.recurringPattern,
      calendarEventId: serverTask.calendarEventId,
      syncedAt: new Date(),
    };
  }

  async addToSyncQueue(entityType: string, entityId: string, operation: 'create' | 'update' | 'delete', data: any) {
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

    const { token, refreshToken } = useAuthStore.getState();
    if (this.isOnline && token && refreshToken) {
      setTimeout(() => this.sync(), 1000);
    }
  }

  async clearLocalDatabase() {
    console.log('Clearing corrupted local database...');
    try {
      await database.write(async () => {
        const tasks = await database.get<TaskModel>('tasks').query().fetch();
        for (const task of tasks) {
          if (task) {
            await task.markAsDeleted();
          }
        }

        const syncQueue = await database.get<SyncQueueModel>('sync_queue').query().fetch();
        for (const item of syncQueue) {
          if (item) {
            await item.markAsDeleted();
          }
        }
      });

      console.log('Local database cleared successfully');
      useTaskStore.getState().setTasks([]);
      useSyncStore.getState().setSyncStatus({ pendingChanges: 0 });
    } catch (error) {
      console.error('Error clearing local database:', error);
    }
  }

  private async refreshTaskStore() {
    try {
      console.log('Starting refreshTaskStore...');

      // Approche défensive : utiliser un try-catch pour chaque étape
      let tasks: TaskModel[] = [];

      try {
        // Filter out deleted tasks to prevent them from showing up after refresh
        tasks = await database.get<TaskModel>('tasks')
          .query(Q.where('_status', Q.notEq('deleted')))
          .fetch();
        console.log(`Found ${tasks.length} active tasks in local database`);
      } catch (fetchError) {
        console.error('Error fetching tasks from database:', fetchError);
        // Si on ne peut pas lire la DB, on remet un tableau vide
        useTaskStore.getState().setTasks([]);
        return;
      }

      const mappedTasks = [];

      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];

        try {
          if (!task) {
            console.warn(`Null task found at index ${index}, skipping`);
            continue;
          }

          if (!task.id || task.id === null || task.id === undefined) {
            console.warn(`Task without valid ID found at index ${index}, skipping`);
            continue;
          }

          const mappedTask = {
            id: task.id,
            userId: task.userId || '',
            title: task.title || '',
            description: task.description,
            completed: Boolean(task.completed),
            startDate: task.startDate ? new Date(task.startDate) : undefined,
            endDate: task.endDate ? new Date(task.endDate) : undefined,
            duration: task.duration,
            category: task.category,
            tags: task.tags || [],
            priority: task.priority || 'medium',
            location: task.location,
            reminder: task.reminder,
            recurringPattern: task.recurringPattern,
            calendarEventId: task.calendarEventId,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            syncedAt: task.syncedAt ? new Date(task.syncedAt) : undefined,
          };

          mappedTasks.push(mappedTask);
          console.log(`Mapped task ${index + 1}: ${mappedTask.id} - ${mappedTask.title}`);

        } catch (mappingError) {
          console.error(`Error mapping task at index ${index}:`, mappingError);
          // Continue avec la tâche suivante
        }
      }

      console.log(`Successfully mapped ${mappedTasks.length} tasks out of ${tasks.length}`);
      useTaskStore.getState().setTasks(mappedTasks);
      console.log(`Refreshed task store with ${mappedTasks.length} tasks`);

    } catch (error) {
      console.error('Error refreshing task store:', error);
      console.error('Error stack:', (error as Error).stack);

      // En cas d'erreur, on remet un tableau vide pour éviter les plantages
      console.log('Setting empty task array due to error');
      useTaskStore.getState().setTasks([]);
    }
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