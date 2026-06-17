import { PrismaClient, UserRole, DriverStatus, LoadStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const vehicleTypes = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Box Truck'];
const vehicleMakes = ['Freightliner', 'Kenworth', 'Peterbilt', 'Volvo', 'International'];
const vehicleModels = ['Cascadia', 'T680', '579', 'VNL 860', 'LT'];
const loadTypes = ['General Freight', 'Refrigerated', 'Flatbed', 'Hazmat', 'Electronics', 'Auto Parts', 'Food & Beverage'];
const sourcePlatforms = ['Uber Freight', 'DAT Load Board', 'Truckstop.com', 'Echo Global', 'Convoy'];

const cities = [
  { city: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
  { city: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { city: 'Dallas, TX', lat: 32.7767, lng: -96.797 },
  { city: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Jacksonville, FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Columbus, OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581 },
  { city: 'Nashville, TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Memphis, TN', lat: 35.1495, lng: -90.049 },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding RoadTrix database...');

  // Clean up
  await prisma.trip.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.load.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // ─── Admin ───────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      phone: '+15550000001',
      email: 'admin@roadtrix.com',
      passwordHash: await bcrypt.hash('Admin@123', SALT_ROUNDS),
    },
  });
  console.log('✅ Admin created:', adminUser.email);

  // ─── Dispatcher ──────────────────────────────────────────────────────────
  const dispatcherUser = await prisma.user.create({
    data: {
      role: UserRole.DISPATCHER,
      firstName: 'Marcus',
      lastName: 'Thompson',
      phone: '+15550000002',
      email: 'dispatcher@roadtrix.com',
      passwordHash: await bcrypt.hash('Dispatch@123', SALT_ROUNDS),
    },
  });
  console.log('✅ Dispatcher created:', dispatcherUser.email);

  // ─── Drivers ─────────────────────────────────────────────────────────────
  const driverNames = [
    { first: 'James', last: 'Rodriguez' },
    { first: 'Michael', last: 'Chen' },
    { first: 'David', last: 'Williams' },
    { first: 'Robert', last: 'Johnson' },
    { first: 'Christopher', last: 'Brown' },
    { first: 'Anthony', last: 'Davis' },
    { first: 'Daniel', last: 'Martinez' },
    { first: 'Kevin', last: 'Anderson' },
    { first: 'Jason', last: 'Taylor' },
    { first: 'Brian', last: 'Wilson' },
  ];

  const drivers: { user: any; driver: any }[] = [];

  for (let i = 0; i < driverNames.length; i++) {
    const name = driverNames[i];
    const vehicleIdx = i % vehicleMakes.length;
    const location = randomItem(cities);

    const user = await prisma.user.create({
      data: {
        role: UserRole.DRIVER,
        firstName: name.first,
        lastName: name.last,
        phone: `+1555${String(1000 + i).padStart(7, '0')}`,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@roadtrix.com`,
        passwordHash: await bcrypt.hash('Driver@123', SALT_ROUNDS),
      },
    });

    const statuses = [DriverStatus.AVAILABLE, DriverStatus.AVAILABLE, DriverStatus.ON_TRIP, DriverStatus.UNAVAILABLE];
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber: `CDL${String(100000 + i * 7919)}`,
        licenseExpiration: new Date(Date.now() + (365 + i * 30) * 24 * 60 * 60 * 1000),
        vehicleType: vehicleTypes[vehicleIdx],
        vehicleMake: vehicleMakes[vehicleIdx],
        vehicleModel: vehicleModels[vehicleIdx],
        plateNumber: `RT${String(1000 + i * 37).toUpperCase()}`,
        rating: randomFloat(3.8, 5.0),
        status: statuses[i % statuses.length],
        currentLat: location.lat + randomFloat(-0.1, 0.1),
        currentLng: location.lng + randomFloat(-0.1, 0.1),
        lastLocationAt: new Date(),
      },
    });

    drivers.push({ user, driver });
    console.log(`✅ Driver ${i + 1}/10 created: ${user.email}`);
  }

  // ─── Loads ────────────────────────────────────────────────────────────────
  const loads: any[] = [];
  const loadStatuses = [
    LoadStatus.OPEN, LoadStatus.OPEN, LoadStatus.OPEN,
    LoadStatus.ASSIGNED, LoadStatus.ACCEPTED,
    LoadStatus.EN_ROUTE_PICKUP, LoadStatus.PICKED_UP,
    LoadStatus.EN_ROUTE_DELIVERY, LoadStatus.DELIVERED,
    LoadStatus.COMPLETED, LoadStatus.COMPLETED,
    LoadStatus.CANCELLED,
  ];

  for (let i = 0; i < 50; i++) {
    const pickup = randomItem(cities);
    let delivery = randomItem(cities);
    while (delivery.city === pickup.city) {
      delivery = randomItem(cities);
    }

    const brokerPayout = randomFloat(1200, 5500);
    const driverPayout = parseFloat((brokerPayout * randomFloat(0.6, 0.75)).toFixed(2));
    const companyProfit = parseFloat((brokerPayout - driverPayout).toFixed(2));

    const load = await prisma.load.create({
      data: {
        sourcePlatform: randomItem(sourcePlatforms),
        externalLoadId: `EXT-${String(10000 + i * 1337)}`,
        pickupAddress: pickup.city,
        pickupLat: pickup.lat + randomFloat(-0.05, 0.05),
        pickupLng: pickup.lng + randomFloat(-0.05, 0.05),
        deliveryAddress: delivery.city,
        deliveryLat: delivery.lat + randomFloat(-0.05, 0.05),
        deliveryLng: delivery.lng + randomFloat(-0.05, 0.05),
        loadType: randomItem(loadTypes),
        weight: randomFloat(5000, 44000),
        brokerPayout,
        driverPayout,
        companyProfit,
        status: loadStatuses[i % loadStatuses.length],
        notes: i % 3 === 0 ? 'Handle with care. Temperature sensitive.' : null,
        createdAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      },
    });

    loads.push(load);
  }
  console.log(`✅ 50 loads created`);

  // ─── Assignments ─────────────────────────────────────────────────────────
  const assignableLoads = loads.filter((l) =>
    ![LoadStatus.OPEN, LoadStatus.CANCELLED].includes(l.status)
  );

  let assignmentCount = 0;
  for (let i = 0; i < Math.min(20, assignableLoads.length); i++) {
    const load = assignableLoads[i];
    const driver = drivers[i % drivers.length];

    const assignedAt = randomDate(
      new Date(load.createdAt.getTime()),
      new Date(load.createdAt.getTime() + 4 * 60 * 60 * 1000)
    );

    let acceptedAt: Date | null = null;
    let completedAt: Date | null = null;

    if ([LoadStatus.ACCEPTED, LoadStatus.EN_ROUTE_PICKUP, LoadStatus.PICKED_UP,
         LoadStatus.EN_ROUTE_DELIVERY, LoadStatus.DELIVERED, LoadStatus.COMPLETED].includes(load.status)) {
      acceptedAt = new Date(assignedAt.getTime() + randomFloat(5, 30) * 60 * 1000);
    }
    if ([LoadStatus.DELIVERED, LoadStatus.COMPLETED].includes(load.status)) {
      completedAt = new Date(assignedAt.getTime() + randomFloat(6, 24) * 60 * 60 * 1000);
    }

    const assignment = await prisma.assignment.create({
      data: {
        loadId: load.id,
        driverId: driver.driver.id,
        assignedAt,
        acceptedAt,
        completedAt,
      },
    });

    // Create trips for started loads
    if ([LoadStatus.PICKED_UP, LoadStatus.EN_ROUTE_DELIVERY, LoadStatus.DELIVERED, LoadStatus.COMPLETED].includes(load.status)) {
      await prisma.trip.create({
        data: {
          assignmentId: assignment.id,
          startedAt: acceptedAt ? new Date(acceptedAt.getTime() + 10 * 60 * 1000) : null,
          pickupTime: new Date(assignedAt.getTime() + 2 * 60 * 60 * 1000),
          deliveryTime: [LoadStatus.DELIVERED, LoadStatus.COMPLETED].includes(load.status)
            ? completedAt
            : null,
          recipientName: [LoadStatus.DELIVERED, LoadStatus.COMPLETED].includes(load.status)
            ? randomItem(['John Smith', 'Mary Johnson', 'Bob Wilson', 'Alice Brown', 'Tom Davis'])
            : null,
        },
      });
    }

    // Create payments for completed loads
    if (load.status === LoadStatus.COMPLETED) {
      await prisma.payment.create({
        data: {
          driverId: driver.driver.id,
          loadId: load.id,
          amount: load.driverPayout,
          status: PaymentStatus.PAID,
          payoutDate: completedAt ? new Date(completedAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }

    assignmentCount++;
  }
  console.log(`✅ ${assignmentCount} assignments created`);

  // ─── Sample Messages ──────────────────────────────────────────────────────
  for (let i = 0; i < 10; i++) {
    const driver = drivers[i % drivers.length];
    await prisma.message.create({
      data: {
        senderId: dispatcherUser.id,
        receiverId: driver.user.id,
        message: randomItem([
          'Please confirm your ETA to pickup.',
          'Load ready for pickup at dock 3.',
          'Customer updated delivery window to 2-4pm.',
          'Great job on that last delivery!',
          'Check in when you arrive at the facility.',
        ]),
        createdAt: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
      },
    });
  }
  console.log('✅ Sample messages created');

  // ─── Pending Payments ─────────────────────────────────────────────────────
  const deliveredLoads = loads.filter((l) => l.status === LoadStatus.DELIVERED);
  for (const load of deliveredLoads.slice(0, 5)) {
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    await prisma.payment.create({
      data: {
        driverId: driver.driver.id,
        loadId: load.id,
        amount: load.driverPayout,
        status: PaymentStatus.PENDING,
      },
    });
  }
  console.log('✅ Pending payments created');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Admin:      admin@roadtrix.com      / Admin@123');
  console.log('Dispatcher: dispatcher@roadtrix.com / Dispatch@123');
  console.log('Driver:     james.rodriguez@roadtrix.com / Driver@123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
