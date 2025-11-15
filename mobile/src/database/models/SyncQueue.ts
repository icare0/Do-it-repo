import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

export default class SyncQueueModel extends Model {
  static table = 'sync_queue';

  @field('entity_type') entityType!: string;
  @field('entity_id') entityId!: string;
  @field('operation') operation!: 'create' | 'update' | 'delete';
  @json('data', (json) => json) data!: any;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
