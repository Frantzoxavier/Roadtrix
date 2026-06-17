import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authValidators, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post('/register', authValidators.register, handleValidationErrors, authController.register);
router.post('/login', authValidators.login, handleValidationErrors, authController.login);
router.get('/me', authenticate, authController.me);

export default router;
