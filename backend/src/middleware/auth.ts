import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authorization token required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });
    sendError(res, 'Invalid or expired token', 401);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}

export function authorizeDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== UserRole.DRIVER) {
    sendError(res, 'Driver access required', 403);
    return;
  }
  next();
}

export function authorizeAdminOrDispatcher(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.DISPATCHER)) {
    sendError(res, 'Admin or Dispatcher access required', 403);
    return;
  }
  next();
}
