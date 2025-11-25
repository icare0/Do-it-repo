import { Router } from 'express';
import {
  getTodayView,
  getWeekView,
  getCategoryView,
  getPriorityView,
  getOverdueView,
  getStats,
  searchTasks,
} from '../controllers/viewController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/views/today
 * @desc    Récupère la vue "Aujourd'hui"
 * @access  Private
 */
router.get('/today', getTodayView);

/**
 * @route   GET /api/views/week
 * @desc    Récupère la vue "Cette semaine"
 * @access  Private
 */
router.get('/week', getWeekView);

/**
 * @route   GET /api/views/category/:category
 * @desc    Récupère les tâches par catégorie
 * @access  Private
 */
router.get('/category/:category', getCategoryView);

/**
 * @route   GET /api/views/priority/:priority
 * @desc    Récupère les tâches par priorité
 * @access  Private
 */
router.get('/priority/:priority', getPriorityView);

/**
 * @route   GET /api/views/overdue
 * @desc    Récupère les tâches en retard
 * @access  Private
 */
router.get('/overdue', getOverdueView);

/**
 * @route   GET /api/views/stats
 * @desc    Récupère les statistiques utilisateur
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/views/search
 * @desc    Recherche de tâches
 * @access  Private
 */
router.get('/search', searchTasks);

export default router;
