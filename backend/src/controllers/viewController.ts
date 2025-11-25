import { Response } from 'express';
import { AuthRequest } from '../types';
import Task from '../models/Task';
import moment from 'moment-timezone';
import cacheService from '../services/cacheService';
import logger from '../config/logger';

/**
 * Récupère la vue "Aujourd'hui"
 * Affiche uniquement les tâches du jour en cours
 */
export const getTodayView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const cacheKey = cacheService.getUserTodayCacheKey(req.user.id);

    const data = await cacheService.remember(cacheKey, 300, async () => {
      const timezone = req.user?.timezone || 'Europe/Paris';
      const now = moment.tz(timezone);
      const startOfDay = now.clone().startOf('day').toDate();
      const endOfDay = now.clone().endOf('day').toDate();

      // Tâches du jour
      const tasks = await Task.find({
        userId: req.user!.id,
        deletedAt: null,
        $or: [
          {
            startDate: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
          {
            startDate: { $lte: now.toDate() },
            completed: false,
            $or: [{ endDate: null }, { endDate: { $gte: startOfDay } }],
          },
        ],
      })
        .sort({ completed: 1, startDate: 1, priority: -1 })
        .lean();

      // Statistiques du jour
      const completedToday = tasks.filter((t) => t.completed).length;
      const totalToday = tasks.length;
      const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

      // Tâches en retard
      const overdue = await Task.countDocuments({
        userId: req.user!.id,
        completed: false,
        deletedAt: null,
        startDate: { $lt: startOfDay },
      });

      return {
        date: now.format('YYYY-MM-DD'),
        tasks,
        stats: {
          total: totalToday,
          completed: completedToday,
          remaining: totalToday - completedToday,
          highPriority,
          overdue,
        },
      };
    });

    res.json(data);
  } catch (error) {
    logger.error('Get today view error:', error);
    res.status(500).json({ message: 'Failed to get today view' });
  }
};

/**
 * Récupère la vue "Cette semaine"
 */
export const getWeekView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timezone = req.user.timezone || 'Europe/Paris';
    const now = moment.tz(timezone);
    const startOfWeek = now.clone().startOf('week').toDate();
    const endOfWeek = now.clone().endOf('week').toDate();

    const tasks = await Task.find({
      userId: req.user.id,
      deletedAt: null,
      startDate: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .sort({ startDate: 1, priority: -1 })
      .lean();

    // Grouper par jour
    const tasksByDay: { [key: string]: any[] } = {};
    tasks.forEach((task) => {
      const day = moment(task.startDate).format('YYYY-MM-DD');
      if (!tasksByDay[day]) {
        tasksByDay[day] = [];
      }
      tasksByDay[day].push(task);
    });

    res.json({
      startDate: startOfWeek,
      endDate: endOfWeek,
      tasksByDay,
      totalTasks: tasks.length,
    });
  } catch (error) {
    logger.error('Get week view error:', error);
    res.status(500).json({ message: 'Failed to get week view' });
  }
};

/**
 * Récupère les tâches par catégorie
 */
export const getCategoryView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { category } = req.params;

    const tasks = await Task.find({
      userId: req.user.id,
      category,
      deletedAt: null,
    })
      .sort({ completed: 1, startDate: 1 })
      .lean();

    const completed = tasks.filter((t) => t.completed).length;

    res.json({
      category,
      tasks,
      stats: {
        total: tasks.length,
        completed,
        remaining: tasks.length - completed,
      },
    });
  } catch (error) {
    logger.error('Get category view error:', error);
    res.status(500).json({ message: 'Failed to get category view' });
  }
};

/**
 * Récupère les tâches par priorité
 */
export const getPriorityView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { priority } = req.params;

    if (!['low', 'medium', 'high'].includes(priority)) {
      res.status(400).json({ message: 'Invalid priority' });
      return;
    }

    const tasks = await Task.find({
      userId: req.user.id,
      priority,
      completed: false,
      deletedAt: null,
    })
      .sort({ startDate: 1 })
      .lean();

    res.json({
      priority,
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    logger.error('Get priority view error:', error);
    res.status(500).json({ message: 'Failed to get priority view' });
  }
};

/**
 * Récupère les tâches en retard
 */
export const getOverdueView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timezone = req.user.timezone || 'Europe/Paris';
    const now = moment.tz(timezone).toDate();

    const tasks = await Task.find({
      userId: req.user.id,
      completed: false,
      deletedAt: null,
      startDate: { $lt: now },
    })
      .sort({ startDate: 1, priority: -1 })
      .lean();

    res.json({
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    logger.error('Get overdue view error:', error);
    res.status(500).json({ message: 'Failed to get overdue view' });
  }
};

/**
 * Récupère les statistiques utilisateur
 */
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const cacheKey = cacheService.getUserStatsCacheKey(req.user.id);

    const stats = await cacheService.remember(cacheKey, 600, async () => {
      const timezone = req.user?.timezone || 'Europe/Paris';
      const now = moment.tz(timezone);

      // Total des tâches
      const totalTasks = await Task.countDocuments({
        userId: req.user!.id,
        deletedAt: null,
      });

      // Tâches complétées
      const completedTasks = await Task.countDocuments({
        userId: req.user!.id,
        completed: true,
        deletedAt: null,
      });

      // Tâches en cours
      const activeTasks = totalTasks - completedTasks;

      // Tâches en retard
      const overdueTasks = await Task.countDocuments({
        userId: req.user!.id,
        completed: false,
        deletedAt: null,
        startDate: { $lt: now.toDate() },
      });

      // Tâches par catégorie
      const tasksByCategory = await Task.aggregate([
        {
          $match: {
            userId: req.user!.id,
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: ['$completed', 1, 0] },
            },
          },
        },
      ]);

      // Tâches par priorité
      const tasksByPriority = await Task.aggregate([
        {
          $match: {
            userId: req.user!.id,
            completed: false,
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]);

      // Taux de complétion
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Tâches complétées cette semaine
      const startOfWeek = now.clone().startOf('week').toDate();
      const completedThisWeek = await Task.countDocuments({
        userId: req.user!.id,
        completed: true,
        completedAt: { $gte: startOfWeek },
      });

      return {
        totalTasks,
        completedTasks,
        activeTasks,
        overdueTasks,
        completionRate,
        completedThisWeek,
        tasksByCategory,
        tasksByPriority,
      };
    });

    res.json({ stats });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

/**
 * Recherche de tâches
 */
export const searchTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { q, category, priority, completed } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    const filter: any = {
      userId: req.user.id,
      deletedAt: null,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    };

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    const tasks = await Task.find(filter)
      .sort({ startDate: -1 })
      .limit(50)
      .lean();

    res.json({
      query: q,
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    logger.error('Search tasks error:', error);
    res.status(500).json({ message: 'Failed to search tasks' });
  }
};
