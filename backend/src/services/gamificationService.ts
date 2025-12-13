import UserStats, { IUserStats } from '../models/UserStats';
import Task from '../models/Task';
import notificationService from './notificationService';
import logger from '../config/logger';
import moment from 'moment-timezone';

/**
 * Service de Gamification Simplifié
 * Focus sur les STREAKS (séries de jours consécutifs) et les statistiques
 */

class GamificationService {
  /**
   * Initialise les stats d'un nouvel utilisateur
   */
  async initializeUserStats(userId: string): Promise<IUserStats> {
    try {
      const existingStats = await UserStats.findOne({ userId });
      if (existingStats) {
        return existingStats;
      }

      const stats = await UserStats.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
      });

      logger.info(`✨ User stats initialized for user ${userId}`);
      return stats;
    } catch (error) {
      logger.error('Failed to initialize user stats:', error);
      throw error;
    }
  }

  /**
   * Met à jour les statistiques quand une tâche est complétée
   */
  async onTaskCompleted(userId: string, task: any): Promise<void> {
    try {
      let stats: any = await UserStats.findOne({ userId });
      if (!stats) {
        stats = await this.initializeUserStats(userId);
      }

      const now = moment();
      const today = now.startOf('day');

      // Incrémenter les compteurs
      stats.totalTasksCompleted += 1;
      stats.tasksCompletedToday += 1;
      stats.tasksCompletedThisWeek += 1;
      stats.tasksCompletedThisMonth += 1;

      // Ajouter la catégorie si nouvelle
      if (task.category && !stats.categoriesUsed.includes(task.category)) {
        stats.categoriesUsed.push(task.category);
      }

      // 🔥 GÉRER LES STREAKS 🔥
      const lastCompleted = stats.lastCompletedDate
        ? moment(stats.lastCompletedDate).startOf('day')
        : null;

      let streakIncreased = false;
      let previousStreak = stats.currentStreak;

      if (!lastCompleted || lastCompleted.isBefore(today, 'day')) {
        // Nouveau jour
        if (lastCompleted && today.diff(lastCompleted, 'days') === 1) {
          // ✅ Jour consécutif - AUGMENTER LE STREAK
          stats.currentStreak += 1;
          streakIncreased = true;
        } else if (lastCompleted && today.diff(lastCompleted, 'days') > 1) {
          // ❌ Streak cassé - RECOMMENCER À 1
          stats.currentStreak = 1;
        } else if (!lastCompleted) {
          // 🎯 Premier jour
          stats.currentStreak = 1;
          streakIncreased = true;
        }

        stats.lastCompletedDate = now.toDate();

        // Mettre à jour le longest streak
        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      }

      // Mettre à jour le meilleur jour
      if (
        !stats.bestDay ||
        stats.tasksCompletedToday > stats.bestDay.tasksCompleted
      ) {
        stats.bestDay = {
          date: now.toDate(),
          tasksCompleted: stats.tasksCompletedToday,
        };
      }

      // Calculer le temps de complétion
      if (task.createdAt && task.completedAt) {
        const completionTime = moment(task.completedAt).diff(
          moment(task.createdAt),
          'hours',
          true
        );
        stats.averageCompletionTime =
          (stats.averageCompletionTime * (stats.totalTasksCompleted - 1) +
            completionTime) /
          stats.totalTasksCompleted;
      }

      // Ajouter à l'historique
      stats.completionHistory.push({
        date: now.toDate(),
        tasksCompleted: stats.tasksCompletedToday,
      });

      await stats.save();

      // 🔥 ENVOYER UNE NOTIFICATION SI LE STREAK A AUGMENTÉ
      if (streakIncreased && stats.currentStreak > 1) {
        await this.sendStreakNotification(userId, stats.currentStreak, previousStreak);
      }

      logger.info(
        `📊 Stats updated for user ${userId}: Streak ${stats.currentStreak} 🔥`
      );
    } catch (error) {
      logger.error('Failed to update task completion stats:', error);
    }
  }

  /**
   * Envoie une notification de streak
   */
  private async sendStreakNotification(
    userId: string,
    currentStreak: number,
    previousStreak: number
  ): Promise<void> {
    try {
      let title = '';
      let body = '';
      let shouldNotify = false;

      // Notifications pour les milestones importants
      if (currentStreak === 3) {
        title = '🔥 En Feu !';
        body = '3 jours consécutifs ! Continuez comme ça !';
        shouldNotify = true;
      } else if (currentStreak === 7) {
        title = '⚡ Une Semaine !';
        body = '7 jours d\'affilée ! Incroyable !';
        shouldNotify = true;
      } else if (currentStreak === 14) {
        title = '💪 Deux Semaines !';
        body = '14 jours de suite ! Vous êtes impressionnant !';
        shouldNotify = true;
      } else if (currentStreak === 30) {
        title = '💎 Un Mois Complet !';
        body = '30 jours consécutifs ! Vous êtes une légende !';
        shouldNotify = true;
      } else if (currentStreak === 50) {
        title = '🌟 50 Jours !';
        body = 'Un demi-siècle de productivité ! Incroyable !';
        shouldNotify = true;
      } else if (currentStreak === 100) {
        title = '👑 CENT JOURS !';
        body = '100 jours consécutifs ! Vous êtes LÉGENDAIRE !';
        shouldNotify = true;
      } else if (currentStreak % 10 === 0 && currentStreak >= 10) {
        // Tous les 10 jours après 10
        title = `🔥 ${currentStreak} Jours !`;
        body = `Série de ${currentStreak} jours ! Ne vous arrêtez pas !`;
        shouldNotify = true;
      }

      if (shouldNotify) {
        await notificationService.sendNotification({
          userId,
          title,
          body,
          type: 'streak',
          data: {
            currentStreak: currentStreak.toString(),
            previousStreak: previousStreak.toString(),
            subtitle: `🔥 Série de ${currentStreak} jours`,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to send streak notification:', error);
    }
  }

  /**
   * Récupère toutes les stats d'un utilisateur
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      let stats: any = await UserStats.findOne({ userId });
      if (!stats) {
        stats = await this.initializeUserStats(userId);
      }

      return {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastCompletedDate: stats.lastCompletedDate,
        totalTasksCompleted: stats.totalTasksCompleted,
        tasksCompletedToday: stats.tasksCompletedToday,
        tasksCompletedThisWeek: stats.tasksCompletedThisWeek,
        tasksCompletedThisMonth: stats.tasksCompletedThisMonth,
        averageCompletionTime: stats.averageCompletionTime,
        bestDay: stats.bestDay,
        bestWeek: stats.bestWeek,
        completionHistory: stats.completionHistory.slice(-30), // 30 derniers jours
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Récupère le leaderboard des streaks
   */
  async getStreakLeaderboard(limit: number = 50): Promise<any[]> {
    try {
      const topUsers = await UserStats.find()
        .sort({ currentStreak: -1 })
        .limit(limit)
        .lean();

      return topUsers.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalTasksCompleted: user.totalTasksCompleted,
      }));
    } catch (error) {
      logger.error('Failed to get streak leaderboard:', error);
      throw error;
    }
  }

  /**
   * Réinitialise les compteurs quotidiens
   */
  async resetDailyStats(): Promise<void> {
    try {
      await UserStats.updateMany({}, { tasksCompletedToday: 0 });
      logger.info('✅ Daily stats reset');
    } catch (error) {
      logger.error('Failed to reset daily stats:', error);
    }
  }

  /**
   * Réinitialise les compteurs hebdomadaires
   */
  async resetWeeklyStats(): Promise<void> {
    try {
      await UserStats.updateMany({}, { tasksCompletedThisWeek: 0 });
      logger.info('✅ Weekly stats reset');
    } catch (error) {
      logger.error('Failed to reset weekly stats:', error);
    }
  }

  /**
   * Réinitialise les compteurs mensuels
   */
  async resetMonthlyStats(): Promise<void> {
    try {
      await UserStats.updateMany({}, { tasksCompletedThisMonth: 0 });
      logger.info('✅ Monthly stats reset');
    } catch (error) {
      logger.error('Failed to reset monthly stats:', error);
    }
  }
}

export default new GamificationService();
