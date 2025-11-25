import { Router } from 'express';
import { authenticate as protect } from '../middleware/auth';
import {
    connectCalendar,
    calendarCallback,
    getCalendarEvents,
    syncTaskToCalendar,
} from '../controllers/calendarController';

const router = Router();

router.use(protect);

router.get('/connect', connectCalendar);
router.post('/callback', calendarCallback);
router.get('/events', getCalendarEvents);
router.post('/sync', syncTaskToCalendar);

export default router;
