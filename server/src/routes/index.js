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

module.exports = router;