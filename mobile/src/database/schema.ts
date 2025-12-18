import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2, // 🆕 Incremented for AI Engine fields
  tables: [
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'completed', type: 'boolean' },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'priority', type: 'string' },
        { name: 'location', type: 'string', isOptional: true }, // JSON object
        { name: 'reminder', type: 'string', isOptional: true }, // JSON object
        { name: 'recurring_pattern', type: 'string', isOptional: true }, // JSON object
        { name: 'calendar_event_id', type: 'string', isOptional: true },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // 🆕 AI Engine fields
        { name: 'has_specific_time', type: 'boolean', isOptional: true },
        { name: 'time_of_day', type: 'string', isOptional: true },
        { name: 'suggested_time_slot', type: 'string', isOptional: true }, // JSON object {start, end}
        { name: 'deadline', type: 'number', isOptional: true },
        { name: 'original_input', type: 'string', isOptional: true },
        { name: 'parsing_confidence', type: 'number', isOptional: true },
        { name: 'detected_intent', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'geofence_regions',
      columns: [
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'radius', type: 'number' },
        { name: 'notify_on_enter', type: 'boolean' },
        { name: 'notify_on_exit', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'entity_type', type: 'string' },
        { name: 'entity_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'data', type: 'string' }, // JSON
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
