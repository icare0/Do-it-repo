import { Response } from 'express';
import { AuthRequest } from '../types';
import geofenceService from '../services/geofenceService';
import logger from '../config/logger';

/**
 * Récupère tous les geofences de l'utilisateur
 */
export const getGeofences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const geofences = await geofenceService.getUserGeofences(req.user.id);

    res.json({ geofences });
  } catch (error) {
    logger.error('Get geofences error:', error);
    res.status(500).json({ message: 'Failed to get geofences' });
  }
};

/**
 * Crée un nouveau geofence
 */
export const createGeofence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { taskId, latitude, longitude, radius, notifyOnEnter, notifyOnExit } = req.body;

    if (!taskId || !latitude || !longitude) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const geofence = await geofenceService.createGeofence({
      taskId,
      userId: req.user.id,
      latitude,
      longitude,
      radius: radius || 100,
      notifyOnEnter: notifyOnEnter !== undefined ? notifyOnEnter : true,
      notifyOnExit: notifyOnExit || false,
    });

    res.status(201).json({ geofence });
  } catch (error) {
    logger.error('Create geofence error:', error);
    res.status(500).json({ message: 'Failed to create geofence' });
  }
};

/**
 * Met à jour un geofence
 */
export const updateGeofence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const geofence = await geofenceService.updateGeofence(id, req.user.id, updates);

    res.json({ geofence });
  } catch (error) {
    logger.error('Update geofence error:', error);
    res.status(500).json({ message: 'Failed to update geofence' });
  }
};

/**
 * Supprime un geofence
 */
export const deleteGeofence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await geofenceService.deleteGeofence(id, req.user.id);

    res.json({ message: 'Geofence deleted successfully' });
  } catch (error) {
    logger.error('Delete geofence error:', error);
    res.status(500).json({ message: 'Failed to delete geofence' });
  }
};

/**
 * Met à jour la position de l'utilisateur et vérifie les geofences
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Vérifier les geofences de manière asynchrone
    geofenceService.checkLocation({
      userId: req.user.id,
      latitude,
      longitude,
      accuracy,
    }).catch((error) => {
      logger.error('Background geofence check error:', error);
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

/**
 * Trouve les geofences à proximité
 */
export const getNearbyGeofences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { latitude, longitude, maxDistance } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const nearby = await geofenceService.findNearbyGeofences(
      req.user.id,
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      maxDistance ? parseInt(maxDistance as string, 10) : undefined
    );

    res.json({ geofences: nearby });
  } catch (error) {
    logger.error('Get nearby geofences error:', error);
    res.status(500).json({ message: 'Failed to get nearby geofences' });
  }
};

/**
 * Synchronise les geofences avec les tâches
 */
export const syncGeofences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await geofenceService.syncTaskGeofences(req.user.id);

    res.json({ message: 'Geofences synced successfully' });
  } catch (error) {
    logger.error('Sync geofences error:', error);
    res.status(500).json({ message: 'Failed to sync geofences' });
  }
};
