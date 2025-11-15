import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    startDate: {
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    location: {
      name: String,
      address: String,
      latitude: Number,
      longitude: Number,
      radius: Number,
    },
    reminder: {
      type: {
        type: String,
        enum: ['time', 'location'],
      },
      time: Date,
      locationId: String,
      notificationSent: {
        type: Boolean,
        default: false,
      },
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      interval: Number,
      daysOfWeek: [Number],
      endDate: Date,
    },
    calendarEventId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskSchema.index({ userId: 1, startDate: 1 });
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
