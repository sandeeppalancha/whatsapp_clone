// client/src/services/socketService.js
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

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
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
  socket.on('read_receipt', handleReadReceipt);

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
  const { id, groupId, from, sender, message, attachments, timestamp } = data;
  
  // Add message to redux store
  store.dispatch(
    addMessage({
      conversationId: groupId,
      isGroup: true,
      message: {
        id: id || Math.random().toString(36).substr(2, 9),
        content: message,
        senderId: from,
        sender: sender,
        attachments: attachments || [],
        timestamp: timestamp || new Date().toISOString(),
        status: 'received'
      }
    })
  );
  
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
 * Handle message acknowledgement
 */
const handleMessageAck = (data) => {
  const { clientMessageId, messageId, status } = data;
  
  store.dispatch(
    updateMessageStatus({ 
      clientMessageId,
      messageId, 
      status 
    })
  );
};

/**
 * Handle read receipt
 */
const handleReadReceipt = (data) => {
  const { messageId, readBy, timestamp } = data;
  
  store.dispatch(
    markMessageAsRead({
      messageId,
      readBy,
      readAt: timestamp
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
export const sendPrivateMessage = (to, message, attachments = []) => {
  if (!socket || !isConnected) {
    console.error('Socket not connected');
    return false;
  }
  
  const messageId = Math.random().toString(36).substr(2, 9);
  
  socket.emit('private_message', {
    to,
    message,
    messageId,
    attachments: attachments.map(att => ({ id: att.id }))
  });
  
  return messageId;
};

/**
 * Send a group message
 */
export const sendGroupMessage = (groupId, message, attachments = []) => {
  if (!socket || !isConnected) {
    console.error('Socket not connected');
    return false;
  }
  
  const messageId = Math.random().toString(36).substr(2, 9);
  
  socket.emit('group_message', {
    groupId,
    message,
    messageId,
    attachments: attachments.map(att => ({ id: att.id }))
  });
  
  return messageId;
};

/**
 * Send read receipt for a message
 */
export const sendReadReceipt = (messageId) => {
  if (!socket || !isConnected || !messageId) {
    return;
  }
  
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
  sendReadReceipt,
  sendGroupRead,
  sendTypingIndicator,
  isSocketConnected,
  getReconnectAttempts,
  disconnectSocket
};