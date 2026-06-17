import prisma from '../utils/prisma';
import { AppError } from '../middleware/error';
import { parsePagination } from '../utils/response';

const paymentInclude = {
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
};

export async function getPayments(query: {
  status?: string;
  driverId?: string;
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const where: Record<string, unknown> = {};
  if (query.status) where['status'] = query.status;
  if (query.driverId) where['driverId'] = query.driverId;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: paymentInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

export async function getDriverPayments(driverId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { driverId },
      include: paymentInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where: { driverId } }),
  ]);

  // Calculate earnings summary
  const allPayments = await prisma.payment.findMany({
    where: { driverId },
    select: { amount: true, status: true, createdAt: true },
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weeklyEarnings = allPayments
    .filter((p) => p.status === 'PAID' && new Date(p.createdAt) >= startOfWeek)
    .reduce((s, p) => s + p.amount, 0);

  const monthlyEarnings = allPayments
    .filter((p) => p.status === 'PAID' && new Date(p.createdAt) >= startOfMonth)
    .reduce((s, p) => s + p.amount, 0);

  const totalEarnings = allPayments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);

  const pendingAmount = allPayments
    .filter((p) => p.status === 'PENDING')
    .reduce((s, p) => s + p.amount, 0);

  return {
    payments,
    total,
    page,
    limit,
    summary: {
      weekly: parseFloat(weeklyEarnings.toFixed(2)),
      monthly: parseFloat(monthlyEarnings.toFixed(2)),
      total: parseFloat(totalEarnings.toFixed(2)),
      pending: parseFloat(pendingAmount.toFixed(2)),
    },
  };
}

export async function createPayment(data: {
  driverId: string;
  amount: number;
  loadId?: string;
  notes?: string;
}) {
  const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
  if (!driver) throw new AppError('Driver not found', 404);

  const payment = await prisma.payment.create({
    data: {
      driverId: data.driverId,
      amount: data.amount,
      loadId: data.loadId,
      notes: data.notes,
      status: 'PENDING',
    },
    include: paymentInclude,
  });

  return payment;
}

export async function processPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status !== 'PENDING') throw new AppError('Payment is not in pending status', 400);

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'PAID',
      payoutDate: new Date(),
    },
    include: paymentInclude,
  });

  return updated;
}
