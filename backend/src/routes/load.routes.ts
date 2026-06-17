import { Router } from 'express';
import * as loadController from '../controllers/load.controller';
import { authenticate, authorize, authorizeAdminOrDispatcher } from '../middleware/auth';
import { loadValidators, handleValidationErrors } from '../middleware/validation';
import { uploadPOD } from '../middleware/upload';
import { UserRole } from '../../../shared/types';

const router = Router();

router.use(authenticate);

router.get('/', loadController.getLoads);
router.get('/:id', loadController.getLoadById);

router.post(
  '/',
  authorizeAdminOrDispatcher,
  loadValidators.create,
  handleValidationErrors,
  loadController.createLoad
);

router.patch(
  '/:id',
  authorizeAdminOrDispatcher,
  loadController.updateLoad
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.DISPATCHER),
  loadController.deleteLoad
);

router.post(
  '/:id/assign',
  authorizeAdminOrDispatcher,
  loadValidators.assign,
  handleValidationErrors,
  loadController.assignLoad
);

// Driver-only actions
router.post('/:id/accept', authorize(UserRole.DRIVER), loadController.acceptLoad);
router.post('/:id/decline', authorize(UserRole.DRIVER), loadController.declineLoad);
router.post('/:id/start', authorize(UserRole.DRIVER), loadController.startTrip);
router.post('/:id/pickup', authorize(UserRole.DRIVER), loadController.pickupLoad);
router.post(
  '/:id/deliver',
  authorize(UserRole.DRIVER),
  uploadPOD.single('podImage'),
  loadController.deliverLoad
);

export default router;
