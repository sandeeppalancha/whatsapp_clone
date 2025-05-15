// client/src/services/socketService.js - Enhanced with delivery confirmations
import { io } from 'socket.io-client';
import { store } from '../redux/store';
import { 
  addMessage, 
  updateMessageStatus, 
  updateUserStatus,
  markMessageAsRead,
  updateTypingStatus
} from '../redux/slices/chatSlice';
import { addNotification } from '../redux/slices/uiSlice';

// Socket instance
let socket;

// Online status tracking
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize socket connection
 */
export const initializeSocket = (token) => {
  // Close existing socket if it exists
  if (socket) {
    socket.close();
  }

  const BACKEND_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  
  // Create new socket connection with authentication
  socket = io(BACKEND_URL, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  // Set up socket event listeners
  setupSocketEventListeners();

  return socket;
};

export const sendGroupMessageDeliveryConfirmation = (messageId, clientMessageId) => {
  if (!socket || !isConnected || !messageId) {
    return;
  }
  
  console.log('Sending group message delivery confirmation for:', { messageId, clientMessageId });
  
  socket.emit('group_message_delivered', { 
    messageId,
    clientMessageId
  });
};

/**
 * Set up all socket event listeners
 */
const setupSocketEventListeners = () => {
  if (!socket) return;

  // Connection events
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('reconnect_attempt', handleReconnectAttempt);
  socket.on('reconnect_failed', handleReconnectFailed);

  // Message events
  socket.on('private_message', handlePrivateMessage);
  socket.on('group_message', handleGroupMessage);
  socket.on('message_ack', handleMessageAck);
  socket.on('message_delivered', handleMessageDelivered);
  socket.on('read_receipt', handleReadReceipt);

  socket.on('group_message_ack', (data) => {
    console.log('Group message ack received:', data);
    
    const payload = {
      clientMessageId: data.clientMessageId,
      messageId: data.messageId,
      status: 'sent',
      groupId: data.groupId
    };
    
    console.log('Dispatching updateMessageStatus for group message:', payload);
    
    store.dispatch(updateMessageStatus(payload));
  });
  
  socket.on('group_message_delivered', (data) => {
    console.log('Group message delivered notification received:', data);
    
    const payload = {
      clientMessageId: data.clientMessageId,
      messageId: data.messageId,
      status: 'delivered',
      deliveredAt: data.timestamp,
      deliveredTo: data.deliveredTo,
      groupId: data.groupId
    };
    
    store.dispatch(updateMessageStatus(payload));
  });
  
  socket.on('group_message_read', (data) => {
    console.log('Group message read notification received:', data);
    
    const payload = {
      clientMessageId: data.clientMessageId,
      messageId: data.messageId,
      status: 'read',
      readAt: data.timestamp,
      readBy: data.readBy,
      groupId: data.groupId
    };
    
    store.dispatch(updateMessageStatus(payload));
  });

  // Status events
  socket.on('user_status', handleUserStatus);
  socket.on('group_user_status', handleGroupUserStatus);
  socket.on('typing', handleTypingIndicator);

  // Error events
  socket.on('error', handleError);
};

/**
 * Handle socket connection
 */
const handleConnect = () => {
  console.log('Socket connected');
  isConnected = true;
  reconnectAttempts = 0;
  
  // Authenticate socket with user ID
  const userId = store.getState().auth.user?.id;
  if (userId) {
    socket.emit('authenticate', userId);
  }
};

/**
 * Handle socket disconnection
 */
const handleDisconnect = (reason) => {
  console.log(`Socket disconnected: ${reason}`);
  isConnected = false;
};

/**
 * Handle connection error
 */
const handleConnectError = (error) => {
  console.error('Socket connection error:', error.message);
  isConnected = false;
};

/**
 * Handle reconnect attempt
 */
const handleReconnectAttempt = (attemptNumber) => {
  console.log(`Socket reconnection attempt ${attemptNumber}...`);
  reconnectAttempts = attemptNumber;
};

/**
 * Handle reconnection failure
 */
const handleReconnectFailed = () => {
  console.error('Socket reconnection failed after max attempts');
  
  // Notify user
  store.dispatch(
    addNotification({
      id: Math.random().toString(36).substr(2, 9),
      type: 'error',
      title: 'Connection Lost',
      message: 'Unable to reconnect to the chat server. Please check your internet connection and refresh the app.',
      duration: 0 // Persistent notification
    })
  );
};

/**
 * Handle incoming private message
 */
const handlePrivateMessage = (data) => {
  const { id, from, message, attachments, timestamp } = data;
  console.log("handlePrivateMessage in socketservice", data);
  
  
  // Add message to redux store
  store.dispatch(
    addMessage({
      conversationId: from,
      isGroup: false,
      message: {
        id: id || Math.random().toString(36).substr(2, 9),
        content: message,
        senderId: from,
        attachments: attachments || [],
        timestamp: timestamp || new Date().toISOString(),
        status: 'received'
      }
    })
  );
  
  // Immediately confirm delivery to sender
  sendDeliveryConfirmation(id);
  
  // Create notification if not in the active conversation
  const activeConversation = store.getState().chat.activeConversation;
  if (!activeConversation || 
      activeConversation.id !== from || 
      activeConversation.isGroup !== false) {
    
    // Get sender info from contacts
    const contacts = store.getState().chat.contacts;
    const sender = contacts.find(contact => contact.id === from);
    const senderName = sender ? sender.username : 'Someone';
    
    store.dispatch(
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: 'message',
        title: `New message from ${senderName}`,
        message: message,
        senderId: from,
        conversationId: from,
        isGroup: false,
        timestamp: new Date().toISOString()
      })
    );
  } else {
    // If in the active conversation, mark as read
    sendReadReceipt(id);
  }
};

/**
 * Handle incoming group message
 */
const handleGroupMessage = (data) => {
    const { id, groupId, from, sender, message, attachments, timestamp, replyTo } = data;
    
    console.log('Received group message with reply:', data);
    
    // Add message to Redux
    store.dispatch(
      addMessage({
        conversationId: data.groupId,
        isGroup: true,
        message: {
          id: data.id,
          clientMessageId: data.clientMessageId,
          content: data.message,
          senderId: data.from,
          sender: data.sender,
          attachments: data.attachments || [],
          timestamp: data.timestamp || new Date().toISOString(),
          status: 'received',
          replyTo: data.replyTo, // Add this line
          replyToId: data.replyTo?.id // Add this line for consistency
        }
      })
    );
    
    // Send delivery confirmation if this is a new message
    if (data.id) {
      sendGroupMessageDeliveryConfirmation(data.id, data.clientMessageId);
    }
  
  // Create notification if not in the active conversation
  const activeConversation = store.getState().chat.activeConversation;
  if (!activeConversation || 
      activeConversation.id !== groupId || 
      activeConversation.isGroup !== true) {
    
    // Get group info from conversations
    const conversations = store.getState().chat.conversations;
    const group = conversations.find(conv => conv.isGroup && conv.id === groupId);
    const groupName = group ? group.name : 'Group';
    
    // Get sender name
    const senderName = sender ? sender.username : 'Someone';
    
    store.dispatch(
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: 'message',
        title: `New message in ${groupName}`,
        message: `${senderName}: ${message}`,
        senderId: from,
        conversationId: groupId,
        isGroup: true,
        timestamp: new Date().toISOString()
      })
    );
  } else {
    // If in the active conversation, mark as read
    sendGroupRead(groupId);
  }
};

/**
 * Handle message acknowledgement (sent)
 */
const handleMessageAck = (data) => {
  console.log('🔄 Socket received message_ack:', data);
  
  const {clientMessageId, messageId, status} = data;
  // Make sure we have the clientMessageId
  // const clientMessageId = data.clientMessageId;
  const serverMessageId = data.messageId;
  
  if (!clientMessageId && !serverMessageId) {
    console.error('❌ Message ack received without any ID!', data);
    return;
  }
  
  // Log all information for debugging
  console.log('Received message_ack with clientMessageId:', clientMessageId, 'and serverMessageId:', serverMessageId);
  
  // Create the update payload
  const payload = {
    clientMessageId: clientMessageId,
    messageId: serverMessageId, 
    status: status
  };
  
  console.log('Dispatching updateMessageStatus with:', payload);
  
  store.dispatch(updateMessageStatus(payload));

  // Check the store after update
  setTimeout(() => {
    const state = store.getState();
    console.log('Redux store after message_delivered:', state.chat.messages);
  }, 100);
};

/**
 * Handle message delivery confirmation
 */
const handleMessageDelivered = (data) => {
  const { messageId, deliveredTo, timestamp } = data;
  console.log("ui handleMessageDelivered", data);
  
  store.dispatch(
    updateMessageStatus({
      messageId,
      status: 'delivered',
      deliveredAt: timestamp,
      deliveredTo
    })
  );

  // Check the store after update
  setTimeout(() => {
    const state = store.getState();
    console.log('Redux store after message_delivered:', state.chat.messages);
  }, 100);
};

/**
 * Handle read receipt
 */
const handleReadReceipt = (data) => {
  const { messageId, readBy, timestamp } = data;
  
  store.dispatch(
    updateMessageStatus({
      messageId,
      status: 'read',
      readAt: timestamp,
      readBy
    })
  );
};

/**
 * Handle user status update
 */
const handleUserStatus = (data) => {
  const { userId, status, timestamp } = data;
  
  store.dispatch(
    updateUserStatus({
      userId,
      isOnline: status === 'online',
      lastSeen: status === 'offline' ? timestamp : null
    })
  );
};

/**
 * Handle group user status update
 */
const handleGroupUserStatus = (data) => {
  const { userId, groupId, status, timestamp } = data;
  
  // Update group member status in state
  // Implementation would depend on how you store group members in your state
  console.log(`User ${userId} is ${status} in group ${groupId}`);
};

/**
 * Handle typing indicator
 */
const handleTypingIndicator = (data) => {
  const { user, groupId, isGroup } = data;
  
  store.dispatch(
    updateTypingStatus({
      userId: user,
      conversationId: isGroup ? groupId : user,
      isGroup,
      isTyping: true
    })
  );
  
  // Clear typing indicator after a delay
  setTimeout(() => {
    store.dispatch(
      updateTypingStatus({
        userId: user,
        conversationId: isGroup ? groupId : user,
        isGroup,
        isTyping: false
      })
    );
  }, 3000);
};

/**
 * Handle socket error
 */
const handleError = (error) => {
  console.error('Socket error:', error);
  
  // Create error notification
  store.dispatch(
    addNotification({
      id: Math.random().toString(36).substr(2, 9),
      type: 'error',
      title: 'Error',
      message: error.message || 'An error occurred',
      timestamp: new Date().toISOString(),
      duration: 5000 // Auto-dismiss after 5 seconds
    })
  );
};

/**
 * Send a private message
 */
export const sendPrivateMessage = (to, message, attachments = [], replyToId = null) => {
  console.log("SEND private message", to, message, attachments);
  
  if (!socket || !isConnected) {
    console.error('Socket not connected');
    return false;
  }
  
  // Generate client message ID for tracking
  const clientMessageId = Math.random().toString(36).substr(2, 9);
  console.log('Generated clientMessageId for tracking:', clientMessageId);
  
  // Make sure attachments are properly formatted for the socket
  const formattedAttachments = attachments.map(att => ({
    id: att.id,
    fileName: att.fileName,
    fileType: att.fileType,
    fileSize: att.fileSize,
    filePath: att.filePath
  }));
  
  // Send message through socket
  socket.emit('private_message', {
    to,
    message,
    messageId: clientMessageId, // Send the clientMessageId to the server
    attachments: formattedAttachments,
    replyToId
  });
  
  // Store the clientMessageId for tracking
  // This maps the client ID to the conversation
  if (!window.messageTracker) {
    window.messageTracker = {};
  }
  window.messageTracker[clientMessageId] = { to, timestamp: Date.now() };
  
  return clientMessageId;
};

/**
 * Send a group message
 */
export const sendGroupMessage = (groupId, message, attachments = [], replyToId = null) => {
  console.log("SEND group message", groupId, message, attachments);
  
  if (!socket || !isConnected) {
    console.error('Socket not connected');
    return false;
  }
  
  // Generate a unique client message ID for tracking
  const clientMessageId = Math.random().toString(36).substr(2, 9);
  console.log('Generated clientMessageId for group message:', clientMessageId);
  
  // Format attachments properly
  const formattedAttachments = attachments.map(att => ({
    id: att.id,
    fileName: att.fileName,
    fileType: att.fileType,
    fileSize: att.fileSize,
    filePath: att.filePath
  }));
  
  // Send message to server with the client message ID and replyToId
  socket.emit('group_message', {
    groupId,
    message,
    messageId: clientMessageId,
    attachments: formattedAttachments,
    replyToId: replyToId // Add this line
  });
  
  // Store for tracking
  if (!window.messageTracker) {
    window.messageTracker = {};
  }
  window.messageTracker[clientMessageId] = { groupId, timestamp: Date.now() };
  
  return clientMessageId;
};

/**
 * Send delivery confirmation for a message
 */
export const sendDeliveryConfirmation = (messageId) => {
  if (!socket || !isConnected || !messageId) {
    return;
  }

  console.log("sendDeliveryConfirmation", messageId);
  
  socket.emit('message_delivered', { messageId });
};

/**
 * Send read receipt for a message
 */
export const sendReadReceipt = (messageId) => {
  if (!socket || !isConnected || !messageId) {
    return;
  }
  
  console.log("sendReadReceipt", messageId);

  socket.emit('read_receipt', { messageId });
};

/**
 * Send group read status
 */
export const sendGroupRead = (groupId) => {
  if (!socket || !isConnected || !groupId) {
    return;
  }
  
  socket.emit('group_read', { 
    groupId,
    lastRead: new Date().toISOString()
  });
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (to, isGroup = false) => {
  if (!socket || !isConnected || !to) {
    return;
  }
  
  socket.emit('typing', { to, isGroup });
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
  return isConnected;
};

/**
 * Get reconnect attempt count
 */
export const getReconnectAttempts = () => {
  return reconnectAttempts;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    isConnected = false;
  }
};

export default {
  initializeSocket,
  sendPrivateMessage,
  sendGroupMessage,
  sendDeliveryConfirmation,
  sendReadReceipt,
  sendGroupRead,
  sendTypingIndicator,
  isSocketConnected,
  getReconnectAttempts,
  disconnectSocket
};