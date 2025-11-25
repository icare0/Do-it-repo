import { getDistance, isPointWithinRadius } from 'geolib';
import Geofence from '../models/Geofence';
import Task from '../models/Task';
import notificationService from './notificationService';
import cacheService from './cacheService';
import logger from '../config/logger';

/**
 * Service de geofencing
 * Gère les rappels basés sur la localisation
 */

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceData {
  taskId: string;
  userId: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

class GeofenceService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MIN_ACCURACY = 100; // mètres
  private readonly MIN_DISTANCE_CHANGE = 50; // mètres pour trigger une vérification

  /**
   * Crée un nouveau geofence pour une tâche
   */
  async createGeofence(data: GeofenceData): Promise<any> {
    try {
      const geofence = await Geofence.create(data);

      // Invalider le cache
      await cacheService.invalidateUserCache(data.userId);

      logger.info(`✅ Geofence created for task ${data.taskId}`);
      return geofence;
    } catch (error) {
      logger.error('❌ Failed to create geofence:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les geofences actifs d'un utilisateur
   */
  async getUserGeofences(userId: string): Promise<any[]> {
    try {
      const cacheKey = cacheService.getUserGeofencesCacheKey(userId);

      return await cacheService.remember(cacheKey, this.CACHE_TTL, async () => {
        const geofences = await Geofence.find({ userId, active: true })
          .populate('taskId')
          .sort({ createdAt: -1 });

        return geofences;
      });
    } catch (error) {
      logger.error('❌ Failed to get user geofences:', error);
      throw error;
    }
  }

  /**
   * Met à jour un geofence
   */
  async updateGeofence(
    geofenceId: string,
    userId: string,
    updates: Partial<GeofenceData>
  ): Promise<any> {
    try {
      const geofence = await Geofence.findOneAndUpdate(
        { _id: geofenceId, userId },
        { $set: updates },
        { new: true }
      );

      if (!geofence) {
        throw new Error('Geofence not found');
      }

      // Invalider le cache
      await cacheService.invalidateUserCache(userId);

      logger.info(`✅ Geofence ${geofenceId} updated`);
      return geofence;
    } catch (error) {
      logger.error('❌ Failed to update geofence:', error);
      throw error;
    }
  }

  /**
   * Supprime un geofence
   */
  async deleteGeofence(geofenceId: string, userId: string): Promise<void> {
    try {
      await Geofence.findOneAndDelete({ _id: geofenceId, userId });

      // Invalider le cache
      await cacheService.invalidateUserCache(userId);

      logger.info(`✅ Geofence ${geofenceId} deleted`);
    } catch (error) {
      logger.error('❌ Failed to delete geofence:', error);
      throw error;
    }
  }

  /**
   * Désactive un geofence
   */
  async deactivateGeofence(geofenceId: string, userId: string): Promise<void> {
    try {
      await Geofence.findOneAndUpdate(
        { _id: geofenceId, userId },
        { $set: { active: false } }
      );

      // Invalider le cache
      await cacheService.invalidateUserCache(userId);

      logger.info(`✅ Geofence ${geofenceId} deactivated`);
    } catch (error) {
      logger.error('❌ Failed to deactivate geofence:', error);
      throw error;
    }
  }

  /**
   * Vérifie la position de l'utilisateur par rapport aux geofences
   */
  async checkLocation(location: LocationUpdate): Promise<void> {
    try {
      const { userId, latitude, longitude, accuracy = 999 } = location;

      // Ignorer les positions peu précises
      if (accuracy > this.MIN_ACCURACY) {
        logger.debug(`⚠️  Location accuracy too low (${accuracy}m), skipping check`);
        return;
      }

      // Récupérer les geofences actifs de l'utilisateur
      const geofences = await this.getUserGeofences(userId);

      if (geofences.length === 0) {
        logger.debug(`No active geofences for user ${userId}`);
        return;
      }

      logger.info(`📍 Checking location for user ${userId}: ${latitude}, ${longitude}`);

      // Vérifier chaque geofence
      for (const geofence of geofences) {
        await this.checkGeofenceTrigger(geofence, latitude, longitude);
      }
    } catch (error) {
      logger.error('❌ Failed to check location:', error);
    }
  }

  /**
   * Vérifie si un geofence doit déclencher une notification
   */
  private async checkGeofenceTrigger(
    geofence: any,
    userLat: number,
    userLng: number
  ): Promise<void> {
    try {
      const isInside = isPointWithinRadius(
        { latitude: userLat, longitude: userLng },
        { latitude: geofence.latitude, longitude: geofence.longitude },
        geofence.radius
      );

      // Récupérer l'état précédent du cache
      const stateKey = `geofence:${geofence._id}:state`;
      const previousState = await cacheService.get<boolean>(stateKey);

      // Si l'état a changé, déclencher une notification
      if (previousState === null || previousState !== isInside) {
        await cacheService.set(stateKey, isInside, 3600); // Cache pour 1 heure

        if (isInside && geofence.notifyOnEnter) {
          await this.triggerGeofenceNotification(geofence, userLat, userLng, true);
        } else if (!isInside && geofence.notifyOnExit) {
          await this.triggerGeofenceNotification(geofence, userLat, userLng, false);
        }
      }
    } catch (error) {
      logger.error('❌ Failed to check geofence trigger:', error);
    }
  }

  /**
   * Déclenche une notification de geofence
   */
  private async triggerGeofenceNotification(
    geofence: any,
    userLat: number,
    userLng: number,
    isEntering: boolean
  ): Promise<void> {
    try {
      // Récupérer la tâche associée
      const task = await Task.findById(geofence.taskId);
      if (!task) {
        logger.warn(`⚠️  Task ${geofence.taskId} not found for geofence ${geofence._id}`);
        return;
      }

      // Calculer la distance
      const distance = getDistance(
        { latitude: userLat, longitude: userLng },
        { latitude: geofence.latitude, longitude: geofence.longitude }
      );

      logger.info(
        `🚨 Geofence triggered for task ${task.title}: ${isEntering ? 'ENTER' : 'EXIT'} (distance: ${distance}m)`
      );

      // Envoyer la notification
      await notificationService.sendGeofenceNotification(
        geofence.userId,
        task._id.toString(),
        task.title,
        task.location?.name || 'Zone',
        isEntering
      );

      // Marquer la notification comme envoyée
      if (task.reminder) {
        task.reminder.notificationSent = true;
        await task.save();
      }
    } catch (error) {
      logger.error('❌ Failed to trigger geofence notification:', error);
    }
  }

  /**
   * Trouve les geofences à proximité d'une position
   */
  async findNearbyGeofences(
    userId: string,
    latitude: number,
    longitude: number,
    maxDistance: number = 5000
  ): Promise<any[]> {
    try {
      const geofences = await this.getUserGeofences(userId);

      const nearby = geofences.filter((geofence) => {
        const distance = getDistance(
          { latitude, longitude },
          { latitude: geofence.latitude, longitude: geofence.longitude }
        );

        return distance <= maxDistance;
      });

      // Trier par distance
      nearby.sort((a, b) => {
        const distA = getDistance(
          { latitude, longitude },
          { latitude: a.latitude, longitude: a.longitude }
        );
        const distB = getDistance(
          { latitude, longitude },
          { latitude: b.latitude, longitude: b.longitude }
        );

        return distA - distB;
      });

      return nearby;
    } catch (error) {
      logger.error('❌ Failed to find nearby geofences:', error);
      throw error;
    }
  }

  /**
   * Vérifie les geofences pour toutes les tâches avec rappel de localisation
   */
  async syncTaskGeofences(userId: string): Promise<void> {
    try {
      // Récupérer toutes les tâches avec rappel de localisation
      const tasks = await Task.find({
        userId,
        'reminder.type': 'location',
        completed: false,
        deletedAt: null,
      });

      logger.info(`🔄 Syncing geofences for ${tasks.length} tasks`);

      for (const task of tasks) {
        if (!task.location || !task.location.latitude || !task.location.longitude) {
          continue;
        }

        // Vérifier si un geofence existe déjà
        const existingGeofence = await Geofence.findOne({
          taskId: task._id,
          userId,
        });

        if (!existingGeofence) {
          // Créer un nouveau geofence
          await this.createGeofence({
            taskId: task._id.toString(),
            userId,
            latitude: task.location.latitude,
            longitude: task.location.longitude,
            radius: task.location.radius || 100,
            notifyOnEnter: true,
            notifyOnExit: false,
          });
        }
      }

      logger.info(`✅ Geofences synced for user ${userId}`);
    } catch (error) {
      logger.error('❌ Failed to sync task geofences:', error);
    }
  }
}

export default new GeofenceService();
