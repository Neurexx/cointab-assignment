import express from 'express';
import {
  createChat,
  getChats,
  getChat,
  sendMessage,
  stopMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', createChat);
router.get('/chats', getChats);
router.get('/chat/:chatId', getChat);
router.post('/chat/:chatId/message', sendMessage);
router.post('/chat/:chatId/stop', stopMessage);

export default router;