import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { messageValidators, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', messageController.getMessages);
router.get('/conversations', messageController.getConversations);
router.post('/', messageValidators.send, handleValidationErrors, messageController.sendMessage);

export default router;
