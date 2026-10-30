import { Router } from 'express';
import { discoveryController } from '../controllers/discoveryController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { searchSchema } from '../utils/zodSchemas.ts';

const router = Router();

router.use(authMiddleware);

router.post('/search', validateBody(searchSchema), discoveryController.search);

export default router;
