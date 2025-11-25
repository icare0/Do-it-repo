import { Router } from 'express';
import { body } from 'express-validator';
import * as taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getTasks);

router.get('/:id', taskController.getTask);

router.post(
  '/',
  validate([
    body('title').trim().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ]),
  taskController.createTask
);

router.patch('/:id', taskController.updateTask);

router.delete('/:id', taskController.deleteTask);

router.patch('/:id/toggle', taskController.toggleTaskCompletion);

router.post('/sync', taskController.syncTasks);

router.post(
  '/parse',
  validate([body('text').trim().notEmpty().withMessage('Text is required')]),
  taskController.parseNaturalLanguage
);

export default router;
