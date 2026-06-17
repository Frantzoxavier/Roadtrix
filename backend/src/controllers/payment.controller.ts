import { Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import * as driverService from '../services/driver.service';
import { sendSuccess, paginate } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '../../../shared/types';

export async function getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role === UserRole.DRIVER) {
      const driver = await driverService.getDriverByUserId(req.user.userId);
      const result = await paymentService.getDriverPayments(driver.id, req.query as any);
      sendSuccess(res, result, undefined, 200, paginate(result.page, result.limit, result.total));
      return;
    }

    const { payments, total, page, limit } = await paymentService.getPayments(req.query as any);
    sendSuccess(res, payments, undefined, 200, paginate(page, limit, total));
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await paymentService.createPayment(req.body);
    sendSuccess(res, payment, 'Payment created', 201);
  } catch (error) {
    next(error);
  }
}

export async function processPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await paymentService.processPayment(req.params.id);
    sendSuccess(res, payment, 'Payment processed successfully');
  } catch (error) {
    next(error);
  }
}
