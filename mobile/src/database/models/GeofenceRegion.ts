import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class GeofenceRegionModel extends Model {
  static table = 'geofence_regions';

  @field('task_id') taskId!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('radius') radius!: number;
  @field('notify_on_enter') notifyOnEnter!: boolean;
  @field('notify_on_exit') notifyOnExit!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
