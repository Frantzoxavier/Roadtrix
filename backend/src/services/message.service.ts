import prisma from '../utils/prisma';
import { AppError } from '../middleware/error';

const messageInclude = {
  sender: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
  },
  receiver: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
  },
};

export async function getMessages(userId: string, otherUserId?: string) {
  const where = otherUserId
    ? {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      }
    : {
        OR: [{ senderId: userId }, { receiverId: userId }],
      };

  const messages = await prisma.message.findMany({
    where,
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: { receiverId: userId, read: false, ...(otherUserId && { senderId: otherUserId }) },
    data: { read: true },
  });

  return messages;
}

export async function getConversations(userId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Group by conversation partner
  const conversations: Record<string, { user: any; lastMessage: any; unreadCount: number }> = {};

  messages.forEach((msg) => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!conversations[partnerId]) {
      conversations[partnerId] = {
        user: partner,
        lastMessage: msg,
        unreadCount: 0,
      };
    }

    if (msg.receiverId === userId && !msg.read) {
      conversations[partnerId].unreadCount++;
    }
  });

  return Object.values(conversations);
}

export async function sendMessage(senderId: string, receiverId: string, message: string) {
  // Verify receiver exists
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw new AppError('Recipient not found', 404);
  }

  const newMessage = await prisma.message.create({
    data: { senderId, receiverId, message },
    include: messageInclude,
  });

  return newMessage;
}

export async function markAsRead(userId: string, senderId: string) {
  await prisma.message.updateMany({
    where: { receiverId: userId, senderId, read: false },
    data: { read: true },
  });
}
