import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error';
import { UserRole } from '../../../shared/types';

const SALT_ROUNDS = 12;

interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface LoginDTO {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterDTO) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken({
    userId: user.id,
    role: user.role as UserRole,
    email: user.email,
  });

  return { user, token };
}

export async function loginUser(data: LoginDTO) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      driver: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.driver?.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended. Contact support.', 403);
  }

  const token = signToken({
    userId: user.id,
    role: user.role as UserRole,
    email: user.email,
  });

  const { passwordHash: _, ...safeUser } = user;

  return { user: safeUser, token };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      driver: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}
