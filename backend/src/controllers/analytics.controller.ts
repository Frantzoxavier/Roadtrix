import { Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const analytics = await analyticsService.getAnalytics();
    sendSuccess(res, analytics);
  } catch (error) {
    next(error);
  }
}
