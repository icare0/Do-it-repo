import { Response } from 'express';
import { AuthRequest } from '../types';
import gamificationService from '../services/gamificationService';
import UserStats from '../models/UserStats';
import logger from '../config/logger';

/**
 * Récupère les statistiques complètes de gamification de l'utilisateur
 * (Focus sur les STREAKS)
 */
export const getGamificationStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const data = await gamificationService.getUserStats(req.user.id);

    res.json(data);
  } catch (error) {
    logger.error('Get gamification stats error:', error);
    res.status(500).json({ message: 'Failed to get gamification stats' });
  }
};

/**
 * Récupère uniquement les streaks
 */
export const getStreaks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const stats = await UserStats.findOne({ userId: req.user.id });

    if (!stats) {
      res.json({
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
      });
      return;
    }

    res.json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastCompletedDate: stats.lastCompletedDate,
    });
  } catch (error) {
    logger.error('Get streaks error:', error);
    res.status(500).json({ message: 'Failed to get streaks' });
  }
};

/**
 * Récupère le leaderboard (classement des streaks)
 */
export const getLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { limit = 50 } = req.query;
    const limitNumber = parseInt(limit as string, 10);

    const leaderboard = await gamificationService.getStreakLeaderboard(limitNumber);

    const userRank =
      leaderboard.findIndex((entry) => entry.userId === req.user!.id) + 1;

    res.json({
      leaderboard,
      userRank: userRank || null,
      total: leaderboard.length,
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
};

/**
 * Récupère un résumé des statistiques (dashboard)
 */
export const getDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const stats = await UserStats.findOne({ userId: req.user.id });

    if (!stats) {
      const initialized = await gamificationService.initializeUserStats(req.user.id);
      res.json({
        currentStreak: 0,
        longestStreak: 0,
        totalTasksCompleted: 0,
        tasksCompletedToday: 0,
        tasksCompletedThisWeek: 0,
        bestDay: null,
        bestWeek: null,
      });
      return;
    }

    res.json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalTasksCompleted: stats.totalTasksCompleted,
      tasksCompletedToday: stats.tasksCompletedToday,
      tasksCompletedThisWeek: stats.tasksCompletedThisWeek,
      tasksCompletedThisMonth: stats.tasksCompletedThisMonth,
      bestDay: stats.bestDay,
      bestWeek: stats.bestWeek,
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard' });
  }
};

/**
 * Récupère les statistiques détaillées
 */
export const getDetailedStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const stats = await UserStats.findOne({ userId: req.user.id });

    if (!stats) {
      res.json({
        totalTasksCompleted: 0,
        totalTasksCreated: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 100,
        categoriesUsed: [],
      });
      return;
    }

    const completionRate =
      stats.totalTasksCreated > 0
        ? Math.round((stats.totalTasksCompleted / stats.totalTasksCreated) * 100)
        : 0;

    res.json({
      totalTasksCompleted: stats.totalTasksCompleted,
      totalTasksCreated: stats.totalTasksCreated,
      completionRate,
      averageCompletionTime: Math.round(stats.averageCompletionTime * 10) / 10,
      onTimeCompletionRate: stats.onTimeCompletionRate,
      categoriesUsed: stats.categoriesUsed,
      daysActive: stats.daysActive,
      lastActiveDate: stats.lastActiveDate,
    });
  } catch (error) {
    logger.error('Get detailed stats error:', error);
    res.status(500).json({ message: 'Failed to get detailed stats' });
  }
};
