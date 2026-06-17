import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param } from 'express-validator';
import { sendError } from '../utils/response';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    sendError(res, 'Validation failed', 422, messages);
    return;
  }
  next();
}

export const authValidators = {
  register: [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('role').isIn(['ADMIN', 'DISPATCHER', 'DRIVER']).withMessage('Invalid role'),
  ],
  login: [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

export const driverValidators = {
  create: [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
    body('licenseExpiration').isISO8601().withMessage('Valid license expiration date is required'),
    body('vehicleType').trim().notEmpty().withMessage('Vehicle type is required'),
    body('vehicleMake').trim().notEmpty().withMessage('Vehicle make is required'),
    body('vehicleModel').trim().notEmpty().withMessage('Vehicle model is required'),
    body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
  ],
  update: [
    param('id').notEmpty().withMessage('Driver ID is required'),
    body('status').optional().isIn(['AVAILABLE', 'UNAVAILABLE', 'ON_TRIP', 'SUSPENDED']),
    body('rating').optional().isFloat({ min: 1, max: 5 }),
  ],
};

export const loadValidators = {
  create: [
    body('sourcePlatform').trim().notEmpty().withMessage('Source platform is required'),
    body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
    body('pickupLat').isFloat({ min: -90, max: 90 }).withMessage('Valid pickup latitude required'),
    body('pickupLng').isFloat({ min: -180, max: 180 }).withMessage('Valid pickup longitude required'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('deliveryLat').isFloat({ min: -90, max: 90 }).withMessage('Valid delivery latitude required'),
    body('deliveryLng').isFloat({ min: -180, max: 180 }).withMessage('Valid delivery longitude required'),
    body('loadType').trim().notEmpty().withMessage('Load type is required'),
    body('weight').isFloat({ min: 0 }).withMessage('Valid weight is required'),
    body('brokerPayout').isFloat({ min: 0 }).withMessage('Valid broker payout required'),
    body('driverPayout').isFloat({ min: 0 }).withMessage('Valid driver payout required'),
  ],
  assign: [
    param('id').notEmpty().withMessage('Load ID is required'),
    body('driverId').notEmpty().withMessage('Driver ID is required'),
  ],
};

export const messageValidators = {
  send: [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('message').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 1000 }),
  ],
};

export const paymentValidators = {
  create: [
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  ],
};
