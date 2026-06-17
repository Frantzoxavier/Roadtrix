import { Response, NextFunction } from 'express';
import * as driverService from '../services/driver.service';
import { sendSuccess, paginate } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getDrivers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { drivers, total, page, limit } = await driverService.getDrivers(req.query as any);
    sendSuccess(res, drivers, undefined, 200, paginate(page, limit, total));
  } catch (error) {
    next(error);
  }
}

export async function getDriverById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    sendSuccess(res, driver);
  } catch (error) {
    next(error);
  }
}

export async function getMyDriverProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    sendSuccess(res, driver);
  } catch (error) {
    next(error);
  }
}

export async function createDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.createDriver(req.body);
    sendSuccess(res, driver, 'Driver created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    sendSuccess(res, driver, 'Driver updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await driverService.deleteDriver(req.params.id);
    sendSuccess(res, null, 'Driver deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMyActiveLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const activeLoad = await driverService.getDriverActiveLoad(driver.id);
    sendSuccess(res, activeLoad);
  } catch (error) {
    next(error);
  }
}
