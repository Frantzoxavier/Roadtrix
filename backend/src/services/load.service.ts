import prisma from '../utils/prisma';
import { AppError } from '../middleware/error';
import { LoadStatus } from '../../../shared/types';
import { parsePagination } from '../utils/response';

interface CreateLoadDTO {
  sourcePlatform: string;
  externalLoadId?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  loadType: string;
  weight: number;
  brokerPayout: number;
  driverPayout: number;
  notes?: string;
}

interface UpdateLoadDTO {
  sourcePlatform?: string;
  externalLoadId?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  loadType?: string;
  weight?: number;
  brokerPayout?: number;
  driverPayout?: number;
  notes?: string;
  status?: string;
}

const loadInclude = {
  assignment: {
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
        },
      },
      trip: true,
    },
  },
};

export async function getLoads(query: {
  status?: string;
  driverId?: string;
  sourcePlatform?: string;
  search?: string;
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const where: Record<string, unknown> = {};

  if (query.status) {
    where['status'] = query.status;
  }

  if (query.sourcePlatform) {
    where['sourcePlatform'] = query.sourcePlatform;
  }

  if (query.driverId) {
    where['assignment'] = { driverId: query.driverId };
  }

  if (query.search) {
    where['OR'] = [
      { pickupAddress: { contains: query.search, mode: 'insensitive' } },
      { deliveryAddress: { contains: query.search, mode: 'insensitive' } },
      { externalLoadId: { contains: query.search, mode: 'insensitive' } },
      { loadType: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where,
      include: loadInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.load.count({ where }),
  ]);

  return { loads, total, page, limit };
}

export async function getLoadById(id: string) {
  const load = await prisma.load.findUnique({
    where: { id },
    include: loadInclude,
  });

  if (!load) {
    throw new AppError('Load not found', 404);
  }

  return load;
}

export async function createLoad(data: CreateLoadDTO) {
  const companyProfit = parseFloat((data.brokerPayout - data.driverPayout).toFixed(2));

  const load = await prisma.load.create({
    data: {
      sourcePlatform: data.sourcePlatform,
      externalLoadId: data.externalLoadId,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      loadType: data.loadType,
      weight: data.weight,
      brokerPayout: data.brokerPayout,
      driverPayout: data.driverPayout,
      companyProfit,
      notes: data.notes,
    },
    include: loadInclude,
  });

  return load;
}

export async function updateLoad(id: string, data: UpdateLoadDTO) {
  const existing = await prisma.load.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Load not found', 404);
  }

  const updateData: Record<string, unknown> = { ...data };

  if (data.brokerPayout !== undefined || data.driverPayout !== undefined) {
    const brokerPayout = data.brokerPayout ?? existing.brokerPayout;
    const driverPayout = data.driverPayout ?? existing.driverPayout;
    updateData['companyProfit'] = parseFloat((brokerPayout - driverPayout).toFixed(2));
  }

  const load = await prisma.load.update({
    where: { id },
    data: updateData as any,
    include: loadInclude,
  });

  return load;
}

export async function deleteLoad(id: string) {
  const load = await prisma.load.findUnique({ where: { id } });
  if (!load) {
    throw new AppError('Load not found', 404);
  }

  if (![LoadStatus.OPEN, LoadStatus.CANCELLED].includes(load.status as LoadStatus)) {
    throw new AppError('Cannot delete a load that is in progress', 400);
  }

  await prisma.load.delete({ where: { id } });
  return { message: 'Load deleted successfully' };
}

export async function assignLoad(loadId: string, driverId: string) {
  const load = await prisma.load.findUnique({ where: { id: loadId }, include: { assignment: true } });
  if (!load) throw new AppError('Load not found', 404);
  if (load.status !== LoadStatus.OPEN) throw new AppError('Load is not available for assignment', 400);
  if (load.assignment) throw new AppError('Load is already assigned', 400);

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new AppError('Driver not found', 404);
  if (driver.status === 'SUSPENDED') throw new AppError('Driver is suspended', 400);

  const [assignment, updatedLoad] = await prisma.$transaction([
    prisma.assignment.create({
      data: { loadId, driverId },
      include: { driver: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true } } } }, trip: true },
    }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.ASSIGNED },
      include: loadInclude,
    }),
  ]);

  return { assignment, load: updatedLoad };
}

export async function acceptLoad(loadId: string, driverId: string) {
  const assignment = await getAssignmentForDriver(loadId, driverId);
  if (assignment.load.status !== LoadStatus.ASSIGNED) {
    throw new AppError('Load cannot be accepted at this stage', 400);
  }

  const [updatedAssignment, updatedLoad] = await prisma.$transaction([
    prisma.assignment.update({
      where: { id: assignment.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.ACCEPTED },
      include: loadInclude,
    }),
  ]);

  return { assignment: updatedAssignment, load: updatedLoad };
}

export async function declineLoad(loadId: string, driverId: string) {
  const assignment = await getAssignmentForDriver(loadId, driverId);
  if (![LoadStatus.ASSIGNED, LoadStatus.ACCEPTED].includes(assignment.load.status as LoadStatus)) {
    throw new AppError('Load cannot be declined at this stage', 400);
  }

  const [,, updatedLoad] = await prisma.$transaction([
    prisma.assignment.delete({ where: { id: assignment.id } }),
    prisma.driver.update({ where: { id: driverId }, data: { status: 'AVAILABLE' } }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.OPEN },
      include: loadInclude,
    }),
  ]);

  return updatedLoad;
}

export async function startTrip(loadId: string, driverId: string) {
  const assignment = await getAssignmentForDriver(loadId, driverId);
  if (assignment.load.status !== LoadStatus.ACCEPTED) {
    throw new AppError('Load must be accepted before starting the trip', 400);
  }

  const [trip, updatedLoad] = await prisma.$transaction([
    prisma.trip.create({
      data: {
        assignmentId: assignment.id,
        startedAt: new Date(),
      },
    }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.EN_ROUTE_PICKUP },
      include: loadInclude,
    }),
    prisma.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } }),
  ]);

  return { trip, load: updatedLoad };
}

export async function pickupLoad(loadId: string, driverId: string) {
  const assignment = await getAssignmentForDriver(loadId, driverId);
  if (assignment.load.status !== LoadStatus.EN_ROUTE_PICKUP) {
    throw new AppError('Driver must be en route to pickup first', 400);
  }

  const trip = await prisma.trip.findUnique({ where: { assignmentId: assignment.id } });
  if (!trip) throw new AppError('Trip not found', 404);

  const [updatedTrip, updatedLoad] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: { pickupTime: new Date() },
    }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.PICKED_UP },
      include: loadInclude,
    }),
  ]);

  return { trip: updatedTrip, load: updatedLoad };
}

export async function deliverLoad(
  loadId: string,
  driverId: string,
  recipientName: string,
  podImagePath?: string
) {
  const assignment = await getAssignmentForDriver(loadId, driverId);
  if (![LoadStatus.PICKED_UP, LoadStatus.EN_ROUTE_DELIVERY].includes(assignment.load.status as LoadStatus)) {
    throw new AppError('Load must be picked up before marking as delivered', 400);
  }

  const trip = await prisma.trip.findUnique({ where: { assignmentId: assignment.id } });
  if (!trip) throw new AppError('Trip not found', 404);

  const now = new Date();

  const [updatedTrip, updatedLoad] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        deliveryTime: now,
        recipientName,
        ...(podImagePath && { podImage: podImagePath }),
      },
    }),
    prisma.load.update({
      where: { id: loadId },
      data: { status: LoadStatus.DELIVERED },
      include: loadInclude,
    }),
    prisma.assignment.update({
      where: { id: assignment.id },
      data: { completedAt: now },
    }),
    prisma.driver.update({ where: { id: driverId }, data: { status: 'AVAILABLE' } }),
  ]);

  // Auto-create pending payment
  await prisma.payment.create({
    data: {
      driverId,
      loadId,
      amount: assignment.load.driverPayout,
      status: 'PENDING',
    },
  });

  return { trip: updatedTrip, load: updatedLoad };
}

// Helper
async function getAssignmentForDriver(loadId: string, driverId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { loadId, driverId },
    include: { load: true, trip: true },
  });

  if (!assignment) {
    throw new AppError('Assignment not found for this driver', 404);
  }

  return assignment;
}

export async function getDriverLoads(driverId: string, query: { page?: string; limit?: string; status?: string }) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const where: Record<string, unknown> = { assignment: { driverId } };
  if (query.status) {
    where['status'] = query.status;
  }

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where,
      include: loadInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.load.count({ where }),
  ]);

  return { loads, total, page, limit };
}
