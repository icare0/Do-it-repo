import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../types';
import logger from '../config/logger';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { startDate, endDate, completed, category } = req.query;

    const filter: any = { userId: req.user.id };

    if (startDate || endDate) {
      filter.updatedAt = {}; // ✅ Use updatedAt for sync instead of startDate
      if (startDate) filter.updatedAt.$gte = new Date(startDate as string);
      if (endDate) filter.updatedAt.$lte = new Date(endDate as string);
    }

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const tasks = await Task.find(filter).sort({ updatedAt: -1 });

    // ✅ Ensure proper serialization
    const serializedTasks = tasks.map(task => ({
      id: task._id.toString(),
      _id: task._id.toString(),
      userId: task.userId,
      title: task.title,
      description: task.description,
      completed: task.completed,
      startDate: task.startDate?.toISOString(),
      endDate: task.endDate?.toISOString(),
      duration: task.duration,
      category: task.category,
      tags: task.tags || [],
      priority: task.priority,
      location: task.location,
      reminder: task.reminder,
      recurringPattern: task.recurringPattern,
      calendarEventId: task.calendarEventId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    res.json({ tasks: serializedTasks });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to get task' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // ✅ Validate required fields
    const { title, priority = 'medium' } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ message: 'Title is required and must be a string' });
      return;
    }

    const taskData = {
      ...req.body,
      userId: req.user.id,
      priority,
      completed: Boolean(req.body.completed),
    };

    // ✅ Convert date strings to Date objects
    if (req.body.startDate) {
      taskData.startDate = new Date(req.body.startDate);
    }
    if (req.body.endDate) {
      taskData.endDate = new Date(req.body.endDate);
    }

    const task = await Task.create(taskData);

    res.status(201).json({ task });
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updateData = { ...req.body };

    // ✅ Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

export const toggleTaskCompletion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.completed = !task.completed;
    await task.save();

    res.json({ task });
  } catch (error) {
    logger.error('Toggle task error:', error);
    res.status(500).json({ message: 'Failed to toggle task' });
  }
};

export const syncTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { tasks: clientTasks } = req.body;

    if (!Array.isArray(clientTasks)) {
      res.status(400).json({ message: 'Invalid tasks data format' });
      return;
    }

    logger.info(`📥 Processing sync for ${clientTasks.length} tasks from user ${req.user.id}`);

    const syncedTasks = [];
    const errors = [];

    for (const [index, clientTask] of clientTasks.entries()) {
      try {
        logger.info(`📝 Processing task ${index + 1}/${clientTasks.length}: ${clientTask.operation} ${clientTask.id}`);

        if (clientTask.operation === 'create') {
          // ✅ Validate required fields
          if (!clientTask.data || !clientTask.data.title) {
            errors.push(`Task ${clientTask.id}: Missing title`);
            continue;
          }

          // ✅ Check for existing task to avoid duplicates
          const existingTask = await Task.findOne({
            $or: [
              { _id: clientTask.id },
              { userId: req.user.id, title: clientTask.data.title }
            ]
          });

          if (existingTask) {
            logger.info(`🔄 Task already exists, updating instead: ${clientTask.id}`);
            // Update existing task
            const updatedTask = await Task.findOneAndUpdate(
              { _id: existingTask._id },
              {
                $set: {
                  ...clientTask.data,
                  userId: req.user.id,
                  updatedAt: new Date(),
                }
              },
              { new: true, runValidators: true }
            );
            if (updatedTask) syncedTasks.push(updatedTask);
          } else {
            // Create new task
            const taskData = {
              _id: clientTask.id, // ✅ Use client ID to maintain consistency
              ...clientTask.data,
              userId: req.user.id,
            };

            // ✅ Convert date strings
            if (taskData.startDate) {
              taskData.startDate = new Date(taskData.startDate);
            }
            if (taskData.endDate) {
              taskData.endDate = new Date(taskData.endDate);
            }

            const task = await Task.create(taskData);
            syncedTasks.push(task);
          }
        } else if (clientTask.operation === 'update') {
          const updateData = { ...clientTask.data, updatedAt: new Date() };

          // ✅ Convert date strings
          if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
          }
          if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
          }

          const task = await Task.findOneAndUpdate(
            { _id: clientTask.id, userId: req.user.id },
            { $set: updateData },
            { new: true, runValidators: true }
          );

          if (task) {
            syncedTasks.push(task);
          } else {
            errors.push(`Task ${clientTask.id}: Not found for update`);
          }
        } else if (clientTask.operation === 'delete') {
          const deletedTask = await Task.findOneAndDelete({
            _id: clientTask.id,
            userId: req.user.id,
          });

          if (!deletedTask) {
            errors.push(`Task ${clientTask.id}: Not found for deletion`);
          }
        }
      } catch (taskError) {
        logger.error(`❌ Error processing task ${clientTask.id}:`, taskError);
        errors.push(`Task ${clientTask.id}: ${(taskError as Error).message}`);
      }
    }

    const response: any = {
      tasks: syncedTasks,
      processed: clientTasks.length,
      successful: syncedTasks.length,
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.failed = errors.length;
    }

    logger.info(`✅ Sync complete: ${syncedTasks.length} successful, ${errors.length} errors`);

    res.json(response);
  } catch (error) {
    logger.error('❌ Sync tasks error:', error);
    res.status(500).json({
      message: 'Failed to sync tasks',
      error: (error as Error).message,
    });
  }
};