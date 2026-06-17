import prisma from '../utils/prisma';

export async function getAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Revenue & Profit
  const [allLoads, thisMonthLoads, lastMonthLoads] = await Promise.all([
    prisma.load.findMany({
      where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
      select: { brokerPayout: true, companyProfit: true, createdAt: true },
    }),
    prisma.load.findMany({
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: startOfMonth },
      },
      select: { brokerPayout: true, companyProfit: true },
    }),
    prisma.load.findMany({
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      select: { brokerPayout: true, companyProfit: true },
    }),
  ]);

  const totalRevenue = allLoads.reduce((s, l) => s + l.brokerPayout, 0);
  const totalProfit = allLoads.reduce((s, l) => s + l.companyProfit, 0);
  const thisMonthRevenue = thisMonthLoads.reduce((s, l) => s + l.brokerPayout, 0);
  const thisMonthProfit = thisMonthLoads.reduce((s, l) => s + l.companyProfit, 0);
  const lastMonthRevenue = lastMonthLoads.reduce((s, l) => s + l.brokerPayout, 0);
  const lastMonthProfit = lastMonthLoads.reduce((s, l) => s + l.companyProfit, 0);

  const revenueGrowth = lastMonthRevenue > 0
    ? parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
    : 0;

  const profitMargin = totalRevenue > 0
    ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(1))
    : 0;

  // Load stats
  const [totalLoads, completedLoads, cancelledLoads, activeLoads] = await Promise.all([
    prisma.load.count(),
    prisma.load.count({ where: { status: { in: ['DELIVERED', 'COMPLETED'] } } }),
    prisma.load.count({ where: { status: 'CANCELLED' } }),
    prisma.load.count({ where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY'] } } }),
  ]);

  const completionRate = totalLoads > 0
    ? parseFloat(((completedLoads / totalLoads) * 100).toFixed(1))
    : 0;

  // Driver stats
  const [totalDrivers, activeDrivers, onTripDrivers, availableDrivers] = await Promise.all([
    prisma.driver.count(),
    prisma.driver.count({ where: { status: { not: 'SUSPENDED' } } }),
    prisma.driver.count({ where: { status: 'ON_TRIP' } }),
    prisma.driver.count({ where: { status: 'AVAILABLE' } }),
  ]);

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentLoads = await prisma.load.findMany({
    where: {
      status: { in: ['DELIVERED', 'COMPLETED'] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { brokerPayout: true, companyProfit: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const revenueByDay: Record<string, { revenue: number; profit: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    revenueByDay[key] = { revenue: 0, profit: 0 };
  }

  recentLoads.forEach((load) => {
    const key = load.createdAt.toISOString().split('T')[0];
    if (revenueByDay[key]) {
      revenueByDay[key].revenue += load.brokerPayout;
      revenueByDay[key].profit += load.companyProfit;
    }
  });

  const revenueByDayArray = Object.entries(revenueByDay).map(([date, data]) => ({
    date,
    revenue: parseFloat(data.revenue.toFixed(2)),
    profit: parseFloat(data.profit.toFixed(2)),
  }));

  // Top drivers
  const topDriverAssignments = await prisma.assignment.findMany({
    where: {
      completedAt: { not: null },
    },
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
      load: {
        select: { driverPayout: true },
      },
    },
  });

  const driverStats: Record<string, { driver: any; loads: number; earnings: number }> = {};
  topDriverAssignments.forEach((a) => {
    const id = a.driverId;
    if (!driverStats[id]) {
      driverStats[id] = { driver: a.driver, loads: 0, earnings: 0 };
    }
    driverStats[id].loads++;
    driverStats[id].earnings += a.load.driverPayout;
  });

  const topDrivers = Object.values(driverStats)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5)
    .map((d) => ({
      ...d,
      earnings: parseFloat(d.earnings.toFixed(2)),
    }));

  return {
    revenue: {
      total: parseFloat(totalRevenue.toFixed(2)),
      thisMonth: parseFloat(thisMonthRevenue.toFixed(2)),
      lastMonth: parseFloat(lastMonthRevenue.toFixed(2)),
      growth: revenueGrowth,
    },
    profit: {
      total: parseFloat(totalProfit.toFixed(2)),
      thisMonth: parseFloat(thisMonthProfit.toFixed(2)),
      lastMonth: parseFloat(lastMonthProfit.toFixed(2)),
      margin: profitMargin,
    },
    loads: {
      total: totalLoads,
      completed: completedLoads,
      active: activeLoads,
      cancelled: cancelledLoads,
      completionRate,
    },
    drivers: {
      total: totalDrivers,
      active: activeDrivers,
      onTrip: onTripDrivers,
      available: availableDrivers,
    },
    revenueByDay: revenueByDayArray,
    topDrivers,
  };
}
