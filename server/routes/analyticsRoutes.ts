import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/settings', analyticsController.getSystemSettings);

export default router;
