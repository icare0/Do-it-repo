import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import TaskModel from './models/Task';
import GeofenceRegionModel from './models/GeofenceRegion';
import SyncQueueModel from './models/SyncQueue';

const adapter = new SQLiteAdapter({
  schema,
  // optional database name or file system path
  // dbName: 'taskflow',
  // optional migration config
  // migrations,
});

export const database = new Database({
  adapter,
  modelClasses: [TaskModel, GeofenceRegionModel, SyncQueueModel],
});

export { TaskModel, GeofenceRegionModel, SyncQueueModel };
