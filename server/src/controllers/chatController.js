// server/src/controllers/chatController.js
const { User, Message, Group, Attachment, sequelize, GroupMessageRead } = require('../db/models');
const { Op } = require('sequelize');
/**
 * Get user's contacts
 */
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'contacts',
          attributes: ['id', 'username', 'email', 'profilePicture', 'status', 'isOnline', 'lastSeen']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json(user.contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      message: 'Server error while getting contacts'
    });
  }
};

/**
 * Add a contact
 */
exports.addContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.body;
    
    if (!contactId) {
      return res.status(400).json({
        message: 'Contact ID is required'
      });
    }
    
    // Check if contact exists
    const contact = await User.findByPk(contactId);
    
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found'
      });
    }
    
    // Check if already a contact
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'contacts',
          where: {
            id: contactId
          },
          required: false
        }
      ]
    });
    
    if (user.contacts && user.contacts.length > 0) {
      return res.status(400).json({
        message: 'Already a contact'
      });
    }
    
    // Add contact
    await user.addContact(contact);
    
    res.json({
      message: 'Contact added successfully',
      contact: {
        id: contact.id,
        username: contact.username,
        email: contact.email,
        profilePicture: contact.profilePicture,
        status: contact.status,
        isOnline: contact.isOnline,
        lastSeen: contact.lastSeen
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      message: 'Server error while adding contact'
    });
  }
};

/**
 * Remove a contact
 */
exports.removeContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    
    // Check if contact exists
    const contact = await User.findByPk(contactId);
    
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found'
      });
    }
    
    // Remove contact
    const user = await User.findByPk(userId);
    await user.removeContact(contact);
    
    res.json({
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      message: 'Server error while removing contact'
    });
  }
};

/**
 * Get user's conversations (both private and group)
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get private conversations (direct messages)
    const privateMessages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: {
              [Op.ne]: null
            }
          },
          {
            receiverId: userId
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'profilePicture', 'isOnline', 'lastSeen']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'profilePicture', 'isOnline', 'lastSeen']
        },
        {
          model: Attachment,
          as: 'attachments'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Get unique user conversations (latest message with each user)
    const userConversations = {};
    
    privateMessages.forEach(message => {
      const otherUserId = message.senderId === userId 
        ? message.receiverId 
        : message.senderId;
      
      if (!userConversations[otherUserId] || 
          message.createdAt > userConversations[otherUserId].createdAt) {
        const otherUser = message.senderId === userId 
          ? message.receiver 
          : message.sender;
        
        userConversations[otherUserId] = {
          id: otherUserId,
          isGroup: false,
          user: otherUser,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            timestamp: message.createdAt,
            attachments: message.attachments
          },
          createdAt: message.createdAt
        };
      }
    });
    
    // Get group conversations
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Group,
          as: 'groups',
          include: [
            {
              model: Message,
              as: 'messages',
              limit: 1,
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'username']
                },
                {
                  model: Attachment,
                  as: 'attachments'
                }
              ]
            },
            {
              model: User,
              as: 'admin',
              attributes: ['id', 'username']
            }
          ]
        }
      ]
    });
    
    // Format group conversations
    const groupConversations = user.groups.map(group => {
      const lastMessage = group.messages[0] || null;
      
      return {
        id: group.id,
        isGroup: true,
        name: group.name,
        description: group.description,
        groupPicture: group.groupPicture,
        adminId: group.adminId,
        admin: group.admin,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.username,
          timestamp: lastMessage.createdAt,
          attachments: lastMessage.attachments
        } : null,
        memberCount: group.members ? group.members.length : 0,
        createdAt: group.createdAt
      };
    });
    
    // Combine private and group conversations
    const conversations = [
      ...Object.values(userConversations),
      ...groupConversations
    ];
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.createdAt);
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.createdAt);
      return bTime - aTime;
    });
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Server error while getting conversations'
    });
  }
};

/**
 * Get private messages between two users
 */
exports.getPrivateMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    
    // Get messages between users
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: contactId
          },
          {
            senderId: contactId,
            receiverId: userId
          }
        ]
      },
      include: [
        {
          model: Attachment,
          as: 'attachments'
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    // Mark messages as read
    const unreadMessages = messages.filter(
      message => message.senderId === parseInt(contactId) && !message.isRead
    );
    
    if (unreadMessages.length > 0) {
      await Message.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            id: unreadMessages.map(message => message.id)
          }
        }
      );
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({
      message: 'Server error while getting messages'
    });
  }
};

/**
 * Get group messages
 */
exports.getGroupMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    
    // Check if user is a member of the group
    const group = await Group.findByPk(groupId, {
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
    
    if (!group) {
      return res.status(403).json({
        message: 'You are not a member of this group'
      });
    }
    
    // Get group messages
    const messages = await Message.findAll({
      where: {
        groupId
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: Attachment,
          as: 'attachments'
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      message: 'Server error while getting group messages'
    });
  }
};

/**
 * Get unread message count
 */
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Count unread private messages
    const unreadPrivateCount = await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
    
    // Get user's groups
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Group,
          as: 'groups',
          attributes: ['id']
        }
      ]
    });
    
    const groupIds = user.groups.map(group => group.id);
    
    // Count unread group messages (approximate - would need a more complex tracking system for accurate counts)
    let unreadGroupCount = 0;
    
    if (groupIds.length > 0) {
      const latestReadTimestamps = await sequelize.query(`
        SELECT "groupId", MAX("readAt") as "lastRead"
        FROM "GroupMessageReads"
        WHERE "userId" = :userId
        GROUP BY "groupId"
      `, {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      });
      
      const timestampMap = {};
      latestReadTimestamps.forEach(item => {
        timestampMap[item.groupId] = item.lastRead;
      });
      
      for (const groupId of groupIds) {
        const lastRead = timestampMap[groupId] || new Date(0);
        
        const count = await Message.count({
          where: {
            groupId,
            createdAt: {
              [Op.gt]: lastRead
            },
            senderId: {
              [Op.ne]: userId // Don't count own messages
            }
          }
        });
        
        unreadGroupCount += count;
      }
    }
    
    res.json({
      unreadPrivateCount,
      unreadGroupCount,
      totalUnreadCount: unreadPrivateCount + unreadGroupCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      message: 'Server error while getting unread count'
    });
  }
};

// Add these methods to server/src/controllers/chatController.js

/**
 * Mark a message as read
 */
exports.markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the message
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }
    
    // Check if this user is the intended recipient
    if (message.receiverId !== userId) {
      return res.status(403).json({
        message: 'You can only mark messages sent to you as read'
      });
    }
    
    // Update message
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({
      message: 'Message marked as read',
      readAt: message.readAt
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      message: 'Server error while marking message as read'
    });
  }
};

/**
 * Mark all messages in a group as read by this user
 */
exports.markGroupMessagesAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member of the group
    const group = await Group.findByPk(groupId, {
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
    
    if (!group) {
      return res.status(403).json({
        message: 'You are not a member of this group'
      });
    }
    
    // Create or update the read record
    await sequelize.query(`
      INSERT INTO "GroupMessageReads" ("userId", "groupId", "readAt", "createdAt", "updatedAt")
      VALUES (:userId, :groupId, :readAt, :createdAt, :updatedAt)
      ON CONFLICT ("userId", "groupId") 
      DO UPDATE SET "readAt" = :readAt, "updatedAt" = :updatedAt
    `, {
      replacements: {
        userId,
        groupId,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    res.json({
      message: 'Group messages marked as read',
      readAt: new Date()
    });
  } catch (error) {
    console.error('Mark group messages as read error:', error);
    res.status(500).json({
      message: 'Server error while marking group messages as read'
    });
  }
};