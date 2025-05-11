// server/src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const groupRoutes = require('./groupRoutes');
const attachmentRoutes = require('./attachmentRoutes');

// Set up API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', chatRoutes); // Chat routes include contacts, conversations, messages
router.use('/groups', groupRoutes);
router.use('/attachments', attachmentRoutes);

// server/src/routes/index.js - Add this debug endpoint

// Debug push notification endpoint
router.post('/debug-push', async (req, res) => {
  try {
    const { token, userId = 'test_user' } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const firebaseService = require('../services/firebaseService');
    const result = await firebaseService.sendPushNotification(
      userId,
      token,
      { 
        title: 'Debug Notification', 
        body: `Test notification sent at ${new Date().toLocaleTimeString()}` 
      },
      {
        type: 'debug',
        timestamp: Date.now().toString()
      }
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Debug notification sent',
        details: result
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification'
      });
    }
  } catch (error) {
    console.error('Debug push error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;