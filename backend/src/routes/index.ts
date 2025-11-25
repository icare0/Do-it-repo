import { Router } from 'express';
import authRoutes from './authRoutes';
import taskRoutes from './taskRoutes';
import calendarRoutes from './calendarRoutes';
import geofenceRoutes from './geofenceRoutes';
import viewRoutes from './viewRoutes';
import gamificationRoutes from './gamificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/calendar', calendarRoutes);
router.use('/geofences', geofenceRoutes);
router.use('/views', viewRoutes);
router.use('/gamification', gamificationRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
