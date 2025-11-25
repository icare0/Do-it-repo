import { Router } from 'express';
import {
  getGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
  updateLocation,
  getNearbyGeofences,
  syncGeofences,
} from '../controllers/geofenceController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/geofences
 * @desc    Récupère tous les geofences de l'utilisateur
 * @access  Private
 */
router.get('/', getGeofences);

/**
 * @route   POST /api/geofences
 * @desc    Crée un nouveau geofence
 * @access  Private
 */
router.post(
  '/',
  [
    body('taskId').notEmpty().withMessage('Task ID is required'),
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    body('radius')
      .optional()
      .isInt({ min: 10, max: 10000 })
      .withMessage('Radius must be between 10 and 10000 meters'),
  ],
  validateRequest,
  createGeofence
);

/**
 * @route   PATCH /api/geofences/:id
 * @desc    Met à jour un geofence
 * @access  Private
 */
router.patch('/:id', updateGeofence);

/**
 * @route   DELETE /api/geofences/:id
 * @desc    Supprime un geofence
 * @access  Private
 */
router.delete('/:id', deleteGeofence);

/**
 * @route   POST /api/geofences/location
 * @desc    Met à jour la position de l'utilisateur
 * @access  Private
 */
router.post(
  '/location',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    body('accuracy').optional().isFloat().withMessage('Accuracy must be a number'),
  ],
  validateRequest,
  updateLocation
);

/**
 * @route   GET /api/geofences/nearby
 * @desc    Trouve les geofences à proximité
 * @access  Private
 */
router.get(
  '/nearby',
  [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    query('maxDistance').optional().isInt().withMessage('Max distance must be a number'),
  ],
  validateRequest,
  getNearbyGeofences
);

/**
 * @route   POST /api/geofences/sync
 * @desc    Synchronise les geofences avec les tâches
 * @access  Private
 */
router.post('/sync', syncGeofences);

export default router;
