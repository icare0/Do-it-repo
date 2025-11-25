/**
 * Point d'entrée pour tous les workers
 * Ce fichier doit être exécuté dans un processus séparé pour traiter les jobs en arrière-plan
 */

import './notificationWorker';
import './geofenceWorker';
import './recurringTaskWorker';
import logger from '../config/logger';

logger.info('🚀 All workers started and ready to process jobs');

// Gérer les erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Gérer l'arrêt propre
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing workers');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing workers');
  process.exit(0);
});
