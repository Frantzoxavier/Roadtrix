import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize, authorizeAdminOrDispatcher } from '../middleware/auth';
import { paymentValidators, handleValidationErrors } from '../middleware/validation';
import { UserRole } from '../../../shared/types';

const router = Router();

router.use(authenticate);

router.get('/', paymentController.getPayments);

router.post(
  '/',
  authorizeAdminOrDispatcher,
  paymentValidators.create,
  handleValidationErrors,
  paymentController.createPayment
);

router.patch('/:id/process', authorize(UserRole.ADMIN), paymentController.processPayment);

export default router;
