// server/src/socket/socket.js - Complete implementation with delivery confirmation
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Group, Attachment } = require('../db/models');
const { Op } = require('sequelize');
const firebaseService = require('../services/firebaseService');

// Keep track of online users
const onlineUsers = new Map();
 
function configureSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Find user
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Update user's online status
    if (socket.user) {
      const userId = socket.user.id;
      
      // Mark user as online
      User.update(
        {
          isOnline: true,
          lastSeen: new Date()
        },
        {
          where: { id: userId }
        }
      );
      
      // Store socket id for this user
      onlineUsers.set(userId, socket.id);
      
      // Notify contacts that user is online
      notifyUserStatus(io, userId, 'online');
      
      // Update delivery status for pending messages when user comes online
      updatePendingMessagesDeliveryStatus(io, userId);
    }

    // User authentication
    socket.on('authenticate', async (userId) => {
      try {
        // Verify if the userId matches the authenticated user
        if (socket.user.id !== parseInt(userId)) {
          socket.emit('error', { message: 'Authentication failed: User ID mismatch' });
          return;
        }
        
        onlineUsers.set(userId, socket.id);
        
        // Notify contacts that user is online
        notifyUserStatus(io, userId, 'online');
        
        // Update delivery status for pending messages when user comes online
        updatePendingMessagesDeliveryStatus(io, userId);
        
        console.log(`User ${userId} authenticated`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Private message
    socket.on('private_message', async (data) => {
      try {
        const { to, message, messageId: clientMessageId, attachments = [] } = data;
        const from = socket.user.id;
        
        console.log('Received private_message with clientMessageId:', clientMessageId);
        
        // Validate parameters
        if (!to || (!message && (!attachments || attachments.length === 0))) {
          socket.emit('error', { message: 'Invalid message parameters' });
          return;
        }
        
        // Save message to database
        const newMessage = await Message.create({
          content: message,
          senderId: from,
          receiverId: to,
          isRead: false,
          isDelivered: false,
          clientMessageId: clientMessageId // Store the client message ID
        });
        
        console.log('Created message in database with ID:', newMessage.id, 'and clientMessageId:', clientMessageId);
        
        // Process attachments if any
        if (attachments && attachments.length > 0) {
          // Update attachment records to associate with this message
          await Attachment.update(
            { 
              messageId: newMessage.id,
              isTemporary: false 
            },
            {
              where: {
                id: attachments.map(att => att.id)
              }
            }
          );
        }
        
        // Load attachments for the created message
        const messageWithAttachments = await Message.findByPk(newMessage.id, {
          include: [
            {
              model: Attachment,
              as: 'attachments'
            }
          ]
        });
        
        // Emit to recipient if online
        const recipientSocketId = onlineUsers.get(parseInt(to));
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('private_message', {
            id: newMessage.id,
            clientMessageId: clientMessageId, // Include clientMessageId for tracking
            from,
            to,
            message: newMessage.content,
            attachments: messageWithAttachments.attachments,
            timestamp: newMessage.createdAt
          });
          
          // Mark as delivered immediately since recipient is online
          newMessage.isDelivered = true;
          newMessage.deliveredAt = new Date();
          await newMessage.save();
        }
        
        // Important: Include BOTH message IDs in the acknowledgment
        console.log('Sending message_ack with clientMessageId:', clientMessageId, 'and messageId:', newMessage.id);
        
        // Emit to sender with both IDs
        socket.emit('message_ack', { 
          clientMessageId: clientMessageId, // The original tracking ID
          messageId: newMessage.id,         // The server-generated ID 
          to: to,                          // Include recipient for additional tracking
          status: 'sent' 
        });
        
        // If recipient is online, also send delivery confirmation
        if (recipientSocketId) {
          socket.emit('message_delivered', {
            clientMessageId: clientMessageId, // Include both IDs
            messageId: newMessage.id,
            deliveredTo: parseInt(to),
            timestamp: newMessage.deliveredAt
          });
        }
        
        // Send push notification if recipient is offline
        if (!recipientSocketId || true) {
          // Also include attachment info in the notification
          const hasAttachments = messageWithAttachments.attachments.length > 0;
          const notificationMessage = hasAttachments 
            ? (message ? `${message} [Attachment]` : 'Sent an attachment')
            : message;
            
          sendPushNotification(
            to, 
            from, 
            notificationMessage,
            null,
            false,
            hasAttachments
          );
        }
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { 
          messageId: data.messageId,
          message: 'Failed to send message' 
        });
      }
    });

    // Group message
    socket.on('group_message', async (data) => {
      try {
        const { groupId, message, messageId: clientMessageId, attachments = [] } = data;
        const from = socket.user.id;
        
        // Validate parameters
        if (!groupId || (!message && (!attachments || attachments.length === 0))) {
          socket.emit('error', { message: 'Invalid message parameters' });
          return;
        }
        
        // Check if user is a member of the group
        const group = await Group.findOne({
          where: { id: groupId },
          include: [
            {
              model: User,
              as: 'members',
              where: { id: from },
              required: true
            }
          ]
        });
        
        if (!group) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }
        
        // Save message to database
        const newMessage = await Message.create({
          content: message || '', // Allow empty content if there are attachments
          senderId: from,
          groupId,
          isRead: false,
          isDelivered: false, // Track delivery status
          clientMessageId: clientMessageId
        });
        
        // Process attachments if any
        if (attachments && attachments.length > 0) {
          await Attachment.update(
            { messageId: newMessage.id },
            {
              where: {
                id: attachments.map(att => att.id)
              }
            }
          );
        }
        
        // Load attachments and sender info for the created message
        const messageWithDetails = await Message.findByPk(newMessage.id, {
          include: [
            {
              model: Attachment,
              as: 'attachments'
            },
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'profilePicture']
            }
          ]
        });
        
        // Get all group members
        const fullGroup = await Group.findByPk(groupId, {
          include: [
            {
              model: User,
              as: 'members',
              attributes: ['id']
            }
          ]
        });
        
        // Track online members for delivery status
        const onlineMembers = [];
        
        // Emit to all group members who are online
        if (fullGroup && fullGroup.members) {
          fullGroup.members.forEach(member => {
            // Don't send to the message sender
            if (member.id !== from) {
              const memberSocketId = onlineUsers.get(member.id);
              if (memberSocketId) {
                // Add to online members list
                onlineMembers.push(member.id);
                
                io.to(memberSocketId).emit('group_message', {
                  id: newMessage.id,
                  clientMessageId: clientMessageId,
                  groupId,
                  from,
                  sender: messageWithDetails.sender,
                  message: newMessage.content,
                  attachments: messageWithDetails.attachments,
                  timestamp: newMessage.createdAt
                });

                const hasAttachments = messageWithDetails.attachments.length > 0;
                const notificationMessage = hasAttachments 
                  ? (message ? `${message} [Attachment]` : 'Sent an attachment')
                  : message;
                
                sendPushNotification(
                  member.id, 
                  from, 
                  notificationMessage, 
                  group.name, 
                  true,
                  hasAttachments
                );
              } else {
                // Send push notification to offline members
                // Include attachment info in the notification
                const hasAttachments = messageWithDetails.attachments.length > 0;
                const notificationMessage = hasAttachments 
                  ? (message ? `${message} [Attachment]` : 'Sent an attachment')
                  : message;
                
                sendPushNotification(
                  member.id, 
                  from, 
                  notificationMessage, 
                  group.name, 
                  true,
                  hasAttachments
                );
              }
            }
          });
        }
        
        // Track delivery status for online members
        if (onlineMembers.length > 0) {
          // Create group message delivery records
          await Promise.all(onlineMembers.map(memberId => {
            return createGroupMessageDelivery(newMessage.id, memberId);
          }));
          
          // Update message as delivered to some members
          newMessage.isDelivered = true;
          newMessage.deliveredAt = new Date();
          await newMessage.save();
        }

        console.log('Sending group_message_ack with clientMessageId:', clientMessageId, 'and messageId:', newMessage.id);
        
        // Acknowledge message received by server
        socket.emit('group_message_ack', { 
          clientMessageId: clientMessageId,
          messageId: newMessage.id,
          groupId: groupId,
          status: 'sent' 
        });
        
        // Send delivery status update if some members are online
        if (onlineMembers.length > 0) {
          socket.emit('group_message_delivered', {
            clientMessageId: clientMessageId,
            messageId: newMessage.id,
            groupId: groupId,
            deliveredTo: onlineMembers,
            timestamp: newMessage.deliveredAt
          });
        }
      } catch (error) {
        console.error('Group message error:', error);
        socket.emit('error', { 
          messageId: data.messageId,
          message: 'Failed to send message to group' 
        });
      }
    });

    // Message delivery confirmation
    socket.on('message_delivered', async (data) => {
      console.log("message_delivered", data);
      
      try {
        const { messageId } = data;
        const userId = socket.user.id;
        
        if (!messageId) {
          return;
        }
        
        // Update message delivery status
        const message = await Message.findByPk(messageId);
        
        if (!message) {
          return;
        }
        
        // Only mark as delivered if the current user is the recipient
        if (message.receiverId === userId) {
          message.isDelivered = true;
          message.deliveredAt = new Date();
          await message.save();
          
          // Notify sender that message has been delivered
          const senderSocketId = onlineUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_delivered', {
              messageId,
              deliveredTo: userId,
              timestamp: message.deliveredAt
            });
          }
        }
      } catch (error) {
        console.error('Message delivery confirmation error:', error);
      }
    });

    // Message read receipt
    socket.on('read_receipt', async (data) => {
      console.log("read_receipt", data);
      
      try {
        const { messageId } = data;
        const userId = socket.user.id;
        
        if (!messageId) {
          return;
        }
        
        // Update message read status
        const message = await Message.findByPk(messageId);
        
        if (!message) {
          return;
        }
        
        // Only mark as read if the current user is the recipient
        if (message.receiverId === userId) {
          // Also mark as delivered if not already
          message.isDelivered = true;
          message.deliveredAt = message.deliveredAt || new Date();
          
          // Mark as read
          message.isRead = true;
          message.readAt = new Date();
          await message.save();
          
          // Notify sender that message has been read
          const senderSocketId = onlineUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('read_receipt', {
              messageId,
              readBy: userId,
              timestamp: message.readAt
            });
          }
        }
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    socket.on('group_message_delivered', async (data) => {
      try {
        const { messageId, clientMessageId } = data;
        const userId = socket.user.id;
        
        if (!messageId) {
          console.error('Missing messageId in group_message_delivered');
          return;
        }
        
        console.log('Group message delivered notification received:', { messageId, clientMessageId, userId });
        
        // Find the message in the database
        const message = await Message.findByPk(messageId);
        
        if (!message) {
          console.error('Message not found:', messageId);
          return;
        }
        
        // Create a delivery record
        await createGroupMessageDelivery(messageId, userId);
        
        // Update message as delivered if not already
        if (!message.isDelivered) {
          message.isDelivered = true;
          message.deliveredAt = new Date();
          await message.save();
        }
        
        // Notify sender that message has been delivered
        const senderSocketId = onlineUsers.get(message.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('group_message_delivered', {
            messageId,
            clientMessageId: message.clientMessageId || clientMessageId, // Use stored clientMessageId if available
            groupId: message.groupId,
            deliveredTo: userId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Group message delivery error:', error);
      }
    });

    // Group message read
    socket.on('group_read', async (data) => {
      try {
        const { groupId, lastRead, messageIds = [] } = data;
        const userId = socket.user.id;
        
        if (!groupId) {
          return;
        }
        
        console.log('Group read notification received:', { groupId, messageIds, userId });
        
        // Update or create group read record
        await sequelize.query(`
          INSERT INTO "GroupMessageReads" ("userId", "groupId", "readAt")
          VALUES (:userId, :groupId, :readAt)
          ON CONFLICT ("userId", "groupId") 
          DO UPDATE SET "readAt" = :readAt
        `, {
          replacements: {
            userId,
            groupId,
            readAt: lastRead || new Date()
          },
          type: sequelize.QueryTypes.INSERT
        });
        
        // Mark messages as delivered first
        await Message.update(
          {
            isDelivered: true,
            deliveredAt: new Date()
          },
          {
            where: {
              groupId,
              isDelivered: false
            }
          }
        );
        
        // Create delivery records for all undelivered messages
        const undeliveredMessages = await Message.findAll({
          where: {
            groupId,
            senderId: {
              [Op.ne]: userId
            }
          },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id']
            }
          ]
        });
        
        // Process each message for delivery and read status
        for (const message of undeliveredMessages) {
          // Create delivery record
          await createGroupMessageDelivery(message.id, userId);
          
          // Notify sender about delivery
          const senderSocketId = onlineUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('group_message_delivered', {
              messageId: message.id,
              clientMessageId: message.clientMessageId,
              groupId,
              deliveredTo: userId,
              timestamp: new Date()
            });
          }
          
          // If message is in the list of read messages, send read receipt
          if (messageIds.includes(message.id) || messageIds.length === 0) {
            // For explicit read messages or if marking all as read
            if (senderSocketId) {
              io.to(senderSocketId).emit('group_message_read', {
                messageId: message.id,
                clientMessageId: message.clientMessageId,
                groupId,
                readBy: userId,
                timestamp: new Date()
              });
            }
          }
        }
      } catch (error) {
        console.error('Group read error:', error);
      }
    });

    // User is typing
    socket.on('typing', (data) => {
      try {
        const { to, isGroup } = data;
        const from = socket.user.id;
        
        if (!to) {
          return;
        }
        
        if (isGroup) {
          // For group chats
          socket.to(to).emit('typing', { 
            user: from, 
            groupId: to,
            isGroup: true 
          });
        } else {
          // For private chats
          const recipientSocketId = onlineUsers.get(parseInt(to));
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', { 
              user: from, 
              isGroup: false 
            });
          }
        }
      } catch (error) {
        console.error('Typing indicator error:', error);
      }
    });

    // User disconnects
    socket.on('disconnect', async () => {
      try {
        if (socket.user) {
          const userId = socket.user.id;
          
          // Check if this is the only socket connection for this user
          // This handles multiple tabs/devices case
          const socketCount = await countUserSockets(io, userId);
          
          if (socketCount <= 1) {
            // Mark user as offline
            User.update(
              {
                isOnline: false,
                lastSeen: new Date()
              },
              {
                where: { id: userId }
              }
            );
            
            // Remove from online users map
            onlineUsers.delete(userId);
            
            // Notify contacts that user is offline
            notifyUserStatus(io, userId, 'offline');
            
            console.log(`User ${userId} disconnected and went offline`);
          } else {
            console.log(`User ${userId} disconnected but still has ${socketCount - 1} active connections`);
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  return io;
}

/**
 * Count active socket connections for a user
 */
async function countUserSockets(io, userId) {
  try {
    let count = 0;
    
    const sockets = await io.fetchSockets();
    
    for (const socket of sockets) {
      if (socket.user && socket.user.id === parseInt(userId)) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Count sockets error:', error);
    return 0;
  }
}

/**
 * Notify user's contacts about online/offline status
 */
async function notifyUserStatus(io, userId, status) {
  try {
    // Get user's contacts
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'contacts',
          attributes: ['id']
        }
      ]
    });
    
    if (!user || !user.contacts) {
      return;
    }
    
    // Notify each online contact
    user.contacts.forEach(contact => {
      const contactSocketId = onlineUsers.get(contact.id);
      if (contactSocketId) {
        io.to(contactSocketId).emit('user_status', { 
          userId, 
          status,
          timestamp: new Date()
        });
      }
    });
    
    // Also notify members of groups the user is in
    const groups = await Group.findAll({
      include: [
        {
          model: User,
          as: 'members',
          where: {
            id: userId
          },
          required: true
        }
      ]
    });
    
    if (groups && groups.length > 0) {
      for (const group of groups) {
        const fullGroup = await Group.findByPk(group.id, {
          include: [
            {
              model: User,
              as: 'members',
              attributes: ['id']
            }
          ]
        });
        
        if (fullGroup && fullGroup.members) {
          fullGroup.members.forEach(member => {
            // Don't notify the user themselves
            if (member.id !== userId) {
              const memberSocketId = onlineUsers.get(member.id);
              if (memberSocketId) {
                io.to(memberSocketId).emit('group_user_status', {
                  userId,
                  groupId: group.id,
                  status,
                  timestamp: new Date()
                });
              }
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Notify status error:', error);
  }
}

/**
 * Update delivery status for all pending messages when a user comes online
 */
async function updatePendingMessagesDeliveryStatus(io, userId) {
  try {
    // Find all undelivered messages where this user is the recipient
    const pendingMessages = await Message.findAll({
      where: {
        receiverId: userId,
        isDelivered: false
      }
    });
    
    if (pendingMessages.length === 0) {
      return;
    }
    
    // Current timestamp for all updates
    const now = new Date();
    
    // Update all pending messages to delivered status
    await Message.update(
      {
        isDelivered: true,
        deliveredAt: now
      },
      {
        where: {
          id: pendingMessages.map(msg => msg.id)
        }
      }
    );
    
    // Notify senders of delivery for each message
    const senderGroups = {};
    
    // Group messages by sender to avoid multiple notifications
    pendingMessages.forEach(message => {
      if (!senderGroups[message.senderId]) {
        senderGroups[message.senderId] = [];
      }
      senderGroups[message.senderId].push(message.id);
    });
    
    // Send delivery notifications to each sender
    Object.entries(senderGroups).forEach(([senderId, messageIds]) => {
      const senderSocketId = onlineUsers.get(parseInt(senderId));
      
      if (senderSocketId) {
        // Send individual notifications for each message
        messageIds.forEach(messageId => {
          io.to(senderSocketId).emit('message_delivered', {
            messageId,
            deliveredTo: userId,
            timestamp: now
          });
        });
      }
    });
  } catch (error) {
    console.error('Update pending messages error:', error);
  }
}

/**
 * Create a group message delivery record
 */
async function createGroupMessageDelivery(messageId, userId) {
  try {
    // This would be a table to track which group members have received a message
    await sequelize.query(`
      INSERT INTO "GroupMessageDeliveries" ("messageId", "userId", "deliveredAt")
      VALUES (:messageId, :userId, :deliveredAt)
      ON CONFLICT ("messageId", "userId") 
      DO NOTHING
    `, {
      replacements: {
        messageId,
        userId,
        deliveredAt: new Date()
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    return true;
  } catch (error) {
    console.error('Create group message delivery error:', error);
    return false;
  }
}

/**
 * Send push notification to offline users
 * This is a placeholder function that would integrate with FCM/APNs
 */
async function sendPushNotification(userId, senderId, message, groupName = null, isGroup = false, hasAttachments = false) {
  console.log("inside sockets sendPushNotification");
  
  try {
    // Get recipient
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'pushToken']
    });
    
    if (!user) {
      console.log(`Cannot send push: User ${userId} not found`);
      return;
    }
    
    if (!user.pushToken) {
      console.log(`User ${userId} (${user.username}) has no push token`);
      return;
    }
    
    // Get sender
    const sender = await User.findByPk(senderId, {
      attributes: ['username']
    });
    
    const senderName = sender ? sender.username : 'Someone';
    
    // Prepare notification content
    const title = isGroup ? groupName : senderName;
    const body = isGroup 
      ? `${senderName}: ${message?.substring(0, 100) || ''}${hasAttachments ? ' 📎' : ''}` 
      : `${message?.substring(0, 100) || ''}${hasAttachments ? ' 📎' : ''}`;
    
    // Create unique conversation ID
    const conversationId = isGroup ? `group_${groupName}` : `user_${senderId}`;
    
    // Data payload
    const data = {
      type: 'message',
      senderId: senderId.toString(),
      conversationId: isGroup ? groupName : senderId.toString(),
      isGroup: isGroup.toString(),
      messageId: Math.random().toString(36).substr(2, 9)
    };
    
    // Send notification
    const result = await firebaseService.sendPushNotification(
      userId,
      user.pushToken,
      { title, body },
      data
    );
    
    if (result) {
      console.log(`Push notification sent successfully to ${user.username}`);
    } else {
      console.log(`Failed to send push notification to ${user.username}`);
    }
    
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}
module.exports = configureSocket;