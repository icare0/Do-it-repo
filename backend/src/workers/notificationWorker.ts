import { notificationQueue } from '../config/queue';
import notificationService, { NotificationPayload } from '../services/notificationService';
import logger from '../config/logger';

/**
 * Worker pour traiter les notifications en arrière-plan
 */

// Traiter les jobs de notification
notificationQueue.process(async (job) => {
  const payload: NotificationPayload = job.data;

  logger.info(`📬 Processing notification job ${job.id} for user ${payload.userId}`);

  try {
    const success = await notificationService.sendNotification(payload);

    if (!success) {
      throw new Error('Failed to send notification');
    }

    return { success: true };
  } catch (error) {
    logger.error(`❌ Notification job ${job.id} failed:`, error);
    throw error;
  }
});

// Événements de la queue
notificationQueue.on('completed', (job, result) => {
  logger.info(`✅ Notification job ${job.id} completed:`, result);
});

notificationQueue.on('failed', (job, error) => {
  logger.error(`❌ Notification job ${job.id} failed:`, error);
});

notificationQueue.on('stalled', (job) => {
  logger.warn(`⚠️  Notification job ${job.id} stalled`);
});

logger.info('📋 Notification worker started');

export default notificationQueue;
