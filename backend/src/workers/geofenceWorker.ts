import { geofenceQueue } from '../config/queue';
import geofenceService, { LocationUpdate } from '../services/geofenceService';
import logger from '../config/logger';

/**
 * Worker pour traiter les vérifications de geofence en arrière-plan
 */

// Traiter les jobs de geofence
geofenceQueue.process(async (job) => {
  const location: LocationUpdate = job.data;

  logger.info(`📍 Processing geofence job ${job.id} for user ${location.userId}`);

  try {
    await geofenceService.checkLocation(location);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Geofence job ${job.id} failed:`, error);
    throw error;
  }
});

// Événements de la queue
geofenceQueue.on('completed', (job, result) => {
  logger.info(`✅ Geofence job ${job.id} completed:`, result);
});

geofenceQueue.on('failed', (job, error) => {
  logger.error(`❌ Geofence job ${job.id} failed:`, error);
});

geofenceQueue.on('stalled', (job) => {
  logger.warn(`⚠️  Geofence job ${job.id} stalled`);
});

logger.info('📋 Geofence worker started');

export default geofenceQueue;
