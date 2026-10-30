import { Router } from 'express';
import { documentController } from '../controllers/documentController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', documentController.getAllDocuments);
router.get('/:id/chunks', documentController.getDocumentChunks);
router.delete('/:id', documentController.deleteDocument);

export default router;
