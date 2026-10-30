import { Router } from 'express';
import { authController } from '../controllers/authController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { registerSchema, loginSchema } from '../utils/zodSchemas.ts';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/demo-login', authController.demoLogin);
router.get('/me', authMiddleware, authController.me);

export default router;
