import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import TaskModel from './models/Task';
import GeofenceRegionModel from './models/GeofenceRegion';
import SyncQueueModel from './models/SyncQueue';

const adapter = new SQLiteAdapter({
  schema,
  migrations, // 🆕 Enable migrations for AI Engine fields
  // optional database name or file system path
  // dbName: 'doit',
});

export const database = new Database({
  adapter,
  modelClasses: [TaskModel, GeofenceRegionModel, SyncQueueModel],
});

export { TaskModel, GeofenceRegionModel, SyncQueueModel };
