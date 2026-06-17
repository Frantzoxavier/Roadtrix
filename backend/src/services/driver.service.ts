import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/error';
import { UserRole } from '../../../shared/types';
import { parsePagination } from '../utils/response';

const SALT_ROUNDS = 12;

interface CreateDriverDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiration: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
}

interface UpdateDriverDTO {
  status?: string;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  plateNumber?: string;
  rating?: number;
}

export async function getDrivers(query: {
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const where: Record<string, unknown> = {};

  if (query.status) {
    where['status'] = query.status;
  }

  if (query.search) {
    where['user'] = {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ],
    };
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driver.count({ where }),
  ]);

  return { drivers, total, page, limit };
}

export async function getDriverById(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
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
      assignments: {
        include: {
          load: true,
          trip: true,
        },
        orderBy: { assignedAt: 'desc' },
        take: 10,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  return driver;
}

export async function getDriverByUserId(userId: string) {
  const driver = await prisma.driver.findUnique({
    where: { userId },
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
  });

  if (!driver) {
    throw new AppError('Driver profile not found', 404);
  }

  return driver;
}

export async function createDriver(data: CreateDriverDTO) {
  // Check for existing email
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('A driver with this email already exists', 409);
  }

  const defaultPassword = 'Driver@123';
  const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: UserRole.DRIVER,
      driver: {
        create: {
          licenseNumber: data.licenseNumber,
          licenseExpiration: new Date(data.licenseExpiration),
          vehicleType: data.vehicleType,
          vehicleMake: data.vehicleMake,
          vehicleModel: data.vehicleModel,
          plateNumber: data.plateNumber,
        },
      },
    },
    include: {
      driver: true,
    },
  });

  return user;
}

export async function updateDriver(id: string, data: UpdateDriverDTO) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  const updated = await prisma.driver.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as any }),
      ...(data.vehicleType && { vehicleType: data.vehicleType }),
      ...(data.vehicleMake && { vehicleMake: data.vehicleMake }),
      ...(data.vehicleModel && { vehicleModel: data.vehicleModel }),
      ...(data.plateNumber && { plateNumber: data.plateNumber }),
      ...(data.rating !== undefined && { rating: data.rating }),
    },
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
  });

  return updated;
}

export async function deleteDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  await prisma.user.delete({ where: { id: driver.userId } });
  return { message: 'Driver deleted successfully' };
}

export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number
) {
  await prisma.driver.update({
    where: { id: driverId },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastLocationAt: new Date(),
    },
  });
}

export async function getDriverActiveLoad(driverId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: {
      driverId,
      load: {
        status: {
          in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY'],
        },
      },
    },
    include: {
      load: true,
      trip: true,
    },
    orderBy: { assignedAt: 'desc' },
  });

  return assignment;
}
