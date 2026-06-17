import { Router } from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate, authorize, authorizeAdminOrDispatcher } from '../middleware/auth';
import { driverValidators, handleValidationErrors } from '../middleware/validation';
import { UserRole } from '../../../shared/types';

const router = Router();

router.use(authenticate);

router.get('/', authorizeAdminOrDispatcher, driverController.getDrivers);
router.get('/me', authorize(UserRole.DRIVER), driverController.getMyDriverProfile);
router.get('/me/active-load', authorize(UserRole.DRIVER), driverController.getMyActiveLoad);
router.get('/:id', authorizeAdminOrDispatcher, driverController.getDriverById);
router.post('/', authorize(UserRole.ADMIN), driverValidators.create, handleValidationErrors, driverController.createDriver);
router.patch('/:id', authorizeAdminOrDispatcher, driverValidators.update, handleValidationErrors, driverController.updateDriver);
router.delete('/:id', authorize(UserRole.ADMIN), driverController.deleteDriver);

export default router;
