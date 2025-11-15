import mongoose, { Schema } from 'mongoose';
import { IGeofence } from '../types';

const geofenceSchema = new Schema<IGeofence>(
  {
    taskId: {
      type: String,
      required: true,
      ref: 'Task',
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radius: {
      type: Number,
      required: true,
      default: 100,
    },
    notifyOnEnter: {
      type: Boolean,
      default: true,
    },
    notifyOnExit: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

geofenceSchema.index({ userId: 1, active: 1 });

export default mongoose.model<IGeofence>('Geofence', geofenceSchema);
