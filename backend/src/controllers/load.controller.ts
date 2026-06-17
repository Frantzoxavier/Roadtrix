import { Response, NextFunction } from 'express';
import * as loadService from '../services/load.service';
import * as driverService from '../services/driver.service';
import { sendSuccess, paginate } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '../../../shared/types';

export async function getLoads(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Drivers only see their own loads
    if (req.user?.role === UserRole.DRIVER) {
      const driver = await driverService.getDriverByUserId(req.user.userId);
      const { loads, total, page, limit } = await loadService.getDriverLoads(driver.id, req.query as any);
      sendSuccess(res, loads, undefined, 200, paginate(page, limit, total));
      return;
    }

    const { loads, total, page, limit } = await loadService.getLoads(req.query as any);
    sendSuccess(res, loads, undefined, 200, paginate(page, limit, total));
  } catch (error) {
    next(error);
  }
}

export async function getLoadById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const load = await loadService.getLoadById(req.params.id);
    sendSuccess(res, load);
  } catch (error) {
    next(error);
  }
}

export async function createLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const load = await loadService.createLoad(req.body);
    sendSuccess(res, load, 'Load created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const load = await loadService.updateLoad(req.params.id, req.body);
    sendSuccess(res, load, 'Load updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await loadService.deleteLoad(req.params.id);
    sendSuccess(res, null, 'Load deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function assignLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.body;
    const result = await loadService.assignLoad(req.params.id, driverId);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`driver:${driverId}`).emit('loadAssigned', { loadId: req.params.id, load: result.load });
      io.to('dispatchers').emit('loadAssigned', { loadId: req.params.id, driverId, load: result.load });
    }

    sendSuccess(res, result, 'Load assigned successfully');
  } catch (error) {
    next(error);
  }
}

export async function acceptLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const result = await loadService.acceptLoad(req.params.id, driver.id);
    
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('loadAccepted', { loadId: req.params.id, driverId: driver.id });
    }

    sendSuccess(res, result, 'Load accepted');
  } catch (error) {
    next(error);
  }
}

export async function declineLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const load = await loadService.declineLoad(req.params.id, driver.id);
    
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('loadDeclined', { loadId: req.params.id, driverId: driver.id });
    }

    sendSuccess(res, load, 'Load declined');
  } catch (error) {
    next(error);
  }
}

export async function startTrip(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const result = await loadService.startTrip(req.params.id, driver.id);
    
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('tripStarted', { loadId: req.params.id, driverId: driver.id });
    }

    sendSuccess(res, result, 'Trip started — en route to pickup');
  } catch (error) {
    next(error);
  }
}

export async function pickupLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const result = await loadService.pickupLoad(req.params.id, driver.id);
    
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('loadPickedUp', { loadId: req.params.id, driverId: driver.id });
    }

    sendSuccess(res, result, 'Cargo picked up — en route to delivery');
  } catch (error) {
    next(error);
  }
}

export async function deliverLoad(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    const { recipientName } = req.body;
    const podImagePath = (req as any).file?.path;

    const result = await loadService.deliverLoad(req.params.id, driver.id, recipientName, podImagePath);
    
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('loadDelivered', {
        loadId: req.params.id,
        driverId: driver.id,
        recipientName,
      });
    }

    sendSuccess(res, result, 'Delivery confirmed!');
  } catch (error) {
    next(error);
  }
}
