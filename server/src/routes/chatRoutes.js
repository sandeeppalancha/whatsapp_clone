// server/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(authenticate);

// Contacts
router.get('/contacts', chatController.getContacts);
router.post('/contacts', chatController.addContact);
router.delete('/contacts/:contactId', chatController.removeContact);

// Conversations
router.get('/conversations', chatController.getConversations);

// Messages
router.get('/messages/private/:contactId', chatController.getPrivateMessages);
router.get('/messages/group/:groupId', chatController.getGroupMessages);
router.get('/messages/unread', chatController.getUnreadMessageCount);

router.put('/messages/:id/read', chatController.markMessageAsRead);
router.put('/messages/group/:groupId/read', chatController.markGroupMessagesAsRead);

module.exports = router;