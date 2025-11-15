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
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate as string);
      if (endDate) filter.startDate.$lte = new Date(endDate as string);
    }

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const tasks = await Task.find(filter).sort({ startDate: 1, createdAt: -1 });

    res.json({ tasks });
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

    const task = await Task.create({
      ...req.body,
      userId: req.user.id,
    });

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

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
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

    // Process sync logic here
    // This is a simplified version - you'd want more sophisticated conflict resolution
    const syncedTasks = [];

    for (const clientTask of clientTasks) {
      if (clientTask.operation === 'create') {
        const task = await Task.create({
          ...clientTask.data,
          userId: req.user.id,
        });
        syncedTasks.push(task);
      } else if (clientTask.operation === 'update') {
        const task = await Task.findOneAndUpdate(
          { _id: clientTask.id, userId: req.user.id },
          { $set: clientTask.data },
          { new: true }
        );
        if (task) syncedTasks.push(task);
      } else if (clientTask.operation === 'delete') {
        await Task.findOneAndDelete({
          _id: clientTask.id,
          userId: req.user.id,
        });
      }
    }

    res.json({ tasks: syncedTasks });
  } catch (error) {
    logger.error('Sync tasks error:', error);
    res.status(500).json({ message: 'Failed to sync tasks' });
  }
};
