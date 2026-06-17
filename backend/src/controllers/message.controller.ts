import { Response, NextFunction } from 'express';
import * as messageService from '../services/message.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { otherUserId } = req.query as { otherUserId?: string };
    const messages = await messageService.getMessages(req.user!.userId, otherUserId);
    sendSuccess(res, messages);
  } catch (error) {
    next(error);
  }
}

export async function getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversations = await messageService.getConversations(req.user!.userId);
    sendSuccess(res, conversations);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { receiverId, message } = req.body;
    const newMessage = await messageService.sendMessage(req.user!.userId, receiverId, message);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('newMessage', { message: newMessage });
      io.to(`user:${req.user!.userId}`).emit('newMessage', { message: newMessage });
    }

    sendSuccess(res, newMessage, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
}
