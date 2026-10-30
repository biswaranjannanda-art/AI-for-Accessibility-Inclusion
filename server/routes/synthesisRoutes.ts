import { Router } from 'express';
import { synthesisController } from '../controllers/synthesisController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { synthesisSchema, litReviewSchema } from '../utils/zodSchemas.ts';

const router = Router();

router.use(authMiddleware);

router.post('/stream', validateBody(synthesisSchema), synthesisController.streamChat);
router.post('/review', validateBody(litReviewSchema), synthesisController.generateLiteratureReview);
router.get('/sessions', synthesisController.listSessions);
router.get('/sessions/:id/messages', synthesisController.getSessionMessages);

export default router;
