import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.ts';
import { documentController } from '../controllers/documentController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { createWorkspaceSchema } from '../utils/zodSchemas.ts';
import { upload } from '../middleware/uploadMiddleware.ts';

const router = Router();

// Protect all workspace routes with authMiddleware
router.use(authMiddleware);

router.get('/', workspaceController.listWorkspaces);
router.post('/', validateBody(createWorkspaceSchema), workspaceController.createWorkspace);
router.get('/:id', workspaceController.getWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Documents inside a workspace
router.get('/:id/documents', documentController.listDocuments);
router.post('/:id/documents', upload.single('file'), documentController.uploadDocument);

export default router;
