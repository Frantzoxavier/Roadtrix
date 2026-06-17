import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import * as driverService from '../services/driver.service';
import logger from '../utils/logger';

interface SocketUser {
  userId: string;
  role: string;
  driverId?: string;
}

const connectedUsers = new Map<string, { socketId: string; userId: string; role: string }>();

export function setupSocketHandlers(io: SocketServer) {
  // Auth middleware for sockets
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as SocketUser;
    logger.info(`Socket connected: ${user.userId} (${user.role})`);

    // Join personal room
    socket.join(`user:${user.userId}`);

    // Join role rooms
    if (user.role === 'DRIVER') {
      socket.join('drivers');

      // Get driver ID and join driver room
      try {
        const driver = await driverService.getDriverByUserId(user.userId);
        (socket as any).driverId = driver.id;
        socket.join(`driver:${driver.id}`);
        connectedUsers.set(socket.id, { socketId: socket.id, userId: user.userId, role: user.role });

        // Broadcast driver online status
        io.to('dispatchers').emit('driverOnline', { driverId: driver.id, userId: user.userId });
      } catch (err) {
        logger.error('Failed to get driver for socket', { userId: user.userId });
      }
    } else if (user.role === 'ADMIN' || user.role === 'DISPATCHER') {
      socket.join('dispatchers');
      connectedUsers.set(socket.id, { socketId: socket.id, userId: user.userId, role: user.role });
    }

    // ─── Driver Location Update ───────────────────────────────────────────
    socket.on('driverLocationUpdate', async (data: { lat: number; lng: number }) => {
      try {
        const driverId = (socket as any).driverId;
        if (!driverId || user.role !== 'DRIVER') return;

        await driverService.updateDriverLocation(driverId, data.lat, data.lng);

        // Broadcast to dispatchers
        io.to('dispatchers').emit('driverLocationUpdate', {
          driverId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Location update failed', { error });
      }
    });

    // ─── Load Status Events ───────────────────────────────────────────────
    socket.on('joinLoad', (loadId: string) => {
      socket.join(`load:${loadId}`);
    });

    socket.on('leaveLoad', (loadId: string) => {
      socket.leave(`load:${loadId}`);
    });

    // ─── Typing Indicator ────────────────────────────────────────────────
    socket.on('typing', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('userTyping', {
        senderId: user.userId,
        typing: true,
      });
    });

    socket.on('stopTyping', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('userTyping', {
        senderId: user.userId,
        typing: false,
      });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      logger.info(`Socket disconnected: ${user.userId}`);

      if (user.role === 'DRIVER') {
        const driverId = (socket as any).driverId;
        if (driverId) {
          io.to('dispatchers').emit('driverOffline', { driverId, userId: user.userId });
        }
      }
    });
  });

  logger.info('✅ Socket.IO handlers initialized');
}

export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}
