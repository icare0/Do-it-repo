import Bull from 'bull';
import logger from './logger';

const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// File d'attente pour les notifications
export const notificationQueue = new Bull('notifications', queueConfig);

// File d'attente pour les geofences
export const geofenceQueue = new Bull('geofences', queueConfig);

// File d'attente pour la synchronisation
export const syncQueue = new Bull('sync', queueConfig);

// File d'attente pour les tâches récurrentes
export const recurringTaskQueue = new Bull('recurring-tasks', queueConfig);

// Gestion des événements
notificationQueue.on('completed', (job) => {
  logger.info(`✅ Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`❌ Notification job ${job.id} failed:`, err);
});

geofenceQueue.on('completed', (job) => {
  logger.info(`✅ Geofence job ${job.id} completed`);
});

geofenceQueue.on('failed', (job, err) => {
  logger.error(`❌ Geofence job ${job.id} failed:`, err);
});

syncQueue.on('completed', (job) => {
  logger.info(`✅ Sync job ${job.id} completed`);
});

syncQueue.on('failed', (job, err) => {
  logger.error(`❌ Sync job ${job.id} failed:`, err);
});

recurringTaskQueue.on('completed', (job) => {
  logger.info(`✅ Recurring task job ${job.id} completed`);
});

recurringTaskQueue.on('failed', (job, err) => {
  logger.error(`❌ Recurring task job ${job.id} failed:`, err);
});

logger.info('📋 Bull queues initialized');

export default {
  notificationQueue,
  geofenceQueue,
  syncQueue,
  recurringTaskQueue,
};
