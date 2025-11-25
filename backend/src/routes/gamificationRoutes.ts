import { Router } from 'express';
import {
  getGamificationStats,
  getStreaks,
  getLeaderboard,
  getDashboard,
  getDetailedStats,
} from '../controllers/gamificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/gamification
 * @desc    Récupère toutes les statistiques (avec focus sur streaks)
 * @access  Private
 */
router.get('/', getGamificationStats);

/**
 * @route   GET /api/gamification/dashboard
 * @desc    Résumé pour le dashboard
 * @access  Private
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/gamification/streaks
 * @desc    Récupère les streaks (séries)
 * @access  Private
 */
router.get('/streaks', getStreaks);

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Récupère le classement des streaks
 * @access  Private
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/gamification/stats
 * @desc    Statistiques détaillées
 * @access  Private
 */
router.get('/stats', getDetailedStats);

export default router;
