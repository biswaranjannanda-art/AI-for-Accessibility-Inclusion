import { Router } from 'express';
import { extractionController } from '../controllers/extractionController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { extractionProcessSchema } from '../utils/zodSchemas.ts';

const router = Router();

router.use(authMiddleware);

router.post('/process', validateBody(extractionProcessSchema), extractionController.processExtraction);
router.get('/', extractionController.listExtractions);
router.get('/export', extractionController.exportExtractions);

export default router;
