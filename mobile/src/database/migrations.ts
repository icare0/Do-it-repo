import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      // Migration from version 1 to 2: Add AI Engine fields
      toVersion: 2,
      steps: [
        addColumns({
          table: 'tasks',
          columns: [
            { name: 'has_specific_time', type: 'boolean', isOptional: true },
            { name: 'time_of_day', type: 'string', isOptional: true },
            { name: 'suggested_time_slot', type: 'string', isOptional: true },
            { name: 'deadline', type: 'number', isOptional: true },
            { name: 'original_input', type: 'string', isOptional: true },
            { name: 'parsing_confidence', type: 'number', isOptional: true },
            { name: 'detected_intent', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
