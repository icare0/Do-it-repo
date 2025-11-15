import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ]),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  authController.login
);

router.post(
  '/google',
  authLimiter,
  validate([body('idToken').notEmpty()]),
  authController.googleAuth
);

router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty()]),
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);

router.get('/profile', authenticate, authController.getProfile);

export default router;
