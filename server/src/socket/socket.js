// server/src/socket/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Group, Attachment } = require('../db/models');
const { Op } = require('sequelize');

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
        
        console.log(`User ${userId} authenticated`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Private message
    socket.on('private_message', async (data) => {
      try {
        const { to, message, messageId, attachments = [] } = data;
        const from = socket.user.id;
        
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
          isRead: false
        });
        
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
            from,
            message: newMessage.content,
            attachments: messageWithAttachments.attachments,
            timestamp: newMessage.createdAt
          });
        }
        
        // Emit to sender with the message ID
        socket.emit('message_ack', { 
          clientMessageId: messageId,
          messageId: newMessage.id, 
          status: 'sent' 
        });
        
        // Send push notification if recipient is offline
        if (!recipientSocketId) {
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
        const { groupId, message, messageId, attachments = [] } = data;
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
          isRead: false
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
        
        // Emit to all group members who are online
        if (fullGroup && fullGroup.members) {
          fullGroup.members.forEach(member => {
            // Don't send to the message sender
            if (member.id !== from) {
              const memberSocketId = onlineUsers.get(member.id);
              if (memberSocketId) {
                io.to(memberSocketId).emit('group_message', {
                  id: newMessage.id,
                  groupId,
                  from,
                  sender: messageWithDetails.sender,
                  message: newMessage.content,
                  attachments: messageWithDetails.attachments,
                  timestamp: newMessage.createdAt
                });
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
        
        // Acknowledge message received by server
        socket.emit('message_ack', { 
          clientMessageId: messageId,
          messageId: newMessage.id,
          status: 'sent' 
        });
      } catch (error) {
        console.error('Group message error:', error);
        socket.emit('error', { 
          messageId: data.messageId,
          message: 'Failed to send message to group' 
        });
      }
    });

    // Message read receipt
    socket.on('read_receipt', async (data) => {
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

    // Group message read
    socket.on('group_read', async (data) => {
      try {
        const { groupId, lastRead } = data;
        const userId = socket.user.id;
        
        if (!groupId) {
          return;
        }
        
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
 * Send push notification to offline users
 * This is a placeholder function that would integrate with FCM/APNs
 */
async function sendPushNotification(userId, senderId, message, groupName = null, isGroup = false) {
  try {
    // Get recipient's push token
    const user = await User.findByPk(userId, {
      attributes: ['pushToken']
    });
    
    if (!user || !user.pushToken) {
      return;
    }
    
    // Get sender's name
    const sender = await User.findByPk(senderId, {
      attributes: ['username']
    });
    
    const senderName = sender ? sender.username : 'Someone';
    
    // Prepare notification payload
    const title = isGroup ? groupName : senderName;
    const body = isGroup 
      ? `${senderName}: ${message.substring(0, 100)}` 
      : message.substring(0, 100);
    
    // This would integrate with FCM for Android and APNs for iOS
    // For this example, we'll just log the notification
    console.log(`Push notification to ${userId}:`, {
      title,
      body,
      data: {
        type: 'message',
        senderId,
        conversationId: isGroup ? groupName : senderId,
        isGroup,
        messageId: Math.random().toString(36).substr(2, 9) // This would be the actual message ID in a real implementation
      }
    });
    
    // In a real implementation, you'd send the push notification here
    // using the appropriate service (FCM/APNs)
    
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}

module.exports = configureSocket;