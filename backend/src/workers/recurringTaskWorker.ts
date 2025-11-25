import { recurringTaskQueue } from '../config/queue';
import Task from '../models/Task';
import notificationService from '../services/notificationService';
import logger from '../config/logger';
import moment from 'moment-timezone';

/**
 * Worker pour traiter les tâches récurrentes
 */

interface RecurringTaskJob {
  taskId: string;
  userId: string;
}

// Traiter les jobs de tâches récurrentes
recurringTaskQueue.process(async (job) => {
  const { taskId, userId }: RecurringTaskJob = job.data;

  logger.info(`🔄 Processing recurring task job ${job.id} for task ${taskId}`);

  try {
    const task = await Task.findById(taskId);

    if (!task || !task.recurringPattern) {
      logger.warn(`⚠️  Task ${taskId} not found or not recurring`);
      return { success: false, reason: 'Task not found or not recurring' };
    }

    // Calculer la prochaine occurrence
    const nextDate = calculateNextOccurrence(task.startDate!, task.recurringPattern);

    if (!nextDate) {
      logger.info(`No more occurrences for task ${taskId}`);
      return { success: true, reason: 'No more occurrences' };
    }

    // Créer une nouvelle instance de la tâche
    const newTask = await Task.create({
      userId: task.userId,
      title: task.title,
      description: task.description,
      startDate: nextDate,
      endDate: task.endDate
        ? moment(nextDate).add(moment(task.endDate).diff(moment(task.startDate))).toDate()
        : undefined,
      duration: task.duration,
      category: task.category,
      tags: task.tags,
      priority: task.priority,
      location: task.location,
      reminder: task.reminder,
      recurringPattern: task.recurringPattern,
    });

    logger.info(`✅ Created new recurring task instance: ${newTask._id}`);

    // Programmer la prochaine occurrence
    const delay = nextDate.getTime() - Date.now();
    if (delay > 0) {
      await recurringTaskQueue.add(
        { taskId: newTask._id.toString(), userId },
        { delay }
      );
    }

    // Envoyer une notification si nécessaire
    if (task.reminder) {
      await notificationService.sendRecurringTaskNotification(
        userId,
        newTask._id.toString(),
        task.title
      );
    }

    return { success: true, newTaskId: newTask._id.toString() };
  } catch (error) {
    logger.error(`❌ Recurring task job ${job.id} failed:`, error);
    throw error;
  }
});

/**
 * Calcule la prochaine occurrence d'une tâche récurrente
 */
function calculateNextOccurrence(
  currentDate: Date,
  pattern: any
): Date | null {
  const { frequency, interval = 1, daysOfWeek, endDate } = pattern;
  let nextDate = moment(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.add(interval, 'days');
      break;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Trouver le prochain jour de la semaine dans la liste
        const currentDay = nextDate.day();
        let found = false;

        for (let i = 1; i <= 7; i++) {
          const checkDay = (currentDay + i) % 7;
          if (daysOfWeek.includes(checkDay)) {
            nextDate.add(i, 'days');
            found = true;
            break;
          }
        }

        if (!found) {
          nextDate.add(7 * interval, 'days');
        }
      } else {
        nextDate.add(7 * interval, 'days');
      }
      break;

    case 'monthly':
      nextDate.add(interval, 'months');
      break;

    case 'yearly':
      nextDate.add(interval, 'years');
      break;

    default:
      return null;
  }

  // Vérifier si la prochaine occurrence dépasse la date de fin
  if (endDate && nextDate.isAfter(moment(endDate))) {
    return null;
  }

  return nextDate.toDate();
}

// Événements de la queue
recurringTaskQueue.on('completed', (job, result) => {
  logger.info(`✅ Recurring task job ${job.id} completed:`, result);
});

recurringTaskQueue.on('failed', (job, error) => {
  logger.error(`❌ Recurring task job ${job.id} failed:`, error);
});

recurringTaskQueue.on('stalled', (job) => {
  logger.warn(`⚠️  Recurring task job ${job.id} stalled`);
});

logger.info('📋 Recurring task worker started');

export default recurringTaskQueue;
