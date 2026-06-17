import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, authorizeAdminOrDispatcher } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeAdminOrDispatcher);

router.get('/', analyticsController.getAnalytics);

export default router;
