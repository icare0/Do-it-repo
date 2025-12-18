import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';
import { Location, Reminder, RecurringPattern } from '@/types';

export default class TaskModel extends Model {
  static table = 'tasks';

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('completed') completed!: boolean;
  @date('start_date') startDate?: Date;
  @date('end_date') endDate?: Date;
  @field('duration') duration?: number;
  @field('category') category?: string;
  @json('tags', (json) => json) tags?: string[];
  @field('priority') priority!: 'low' | 'medium' | 'high';
  @json('location', (json) => json) location?: Location;
  @json('reminder', (json) => json) reminder?: Reminder;
  @json('recurring_pattern', (json) => json) recurringPattern?: RecurringPattern;
  @field('calendar_event_id') calendarEventId?: string;
  @date('synced_at') syncedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 🆕 AI Engine fields
  @field('has_specific_time') hasSpecificTime?: boolean;
  @field('time_of_day') timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  @json('suggested_time_slot', (json) => json) suggestedTimeSlot?: { start: number; end: number };
  @date('deadline') deadline?: Date;
  @field('original_input') originalInput?: string;
  @field('parsing_confidence') parsingConfidence?: number;
  @field('detected_intent') detectedIntent?: string;
}
