// client/src/services/chatService.js
import apiClient from './apiClient';

// Existing methods
const getContacts = () => {
  return apiClient.get('/contacts');
};

const addContact = (contactData) => {
  return apiClient.post('/contacts', contactData);
};

const removeContact = (contactId) => {
  return apiClient.delete(`/contacts/${contactId}`);
};

const getConversations = () => {
  return apiClient.get('/conversations');
};

const getMessages = (conversationId, isGroup = false) => {
  const endpoint = isGroup 
    ? `/messages/group/${conversationId}` 
    : `/messages/private/${conversationId}`;
  return apiClient.get(endpoint);
};

const createGroup = (groupData) => {
  return apiClient.post('/groups', groupData);
};

const updateGroup = (groupId, groupData) => {
  return apiClient.put(`/groups/${groupId}`, groupData);
};

const addUserToGroup = (groupId, userId) => {
  return apiClient.post(`/groups/${groupId}/members`, { userId });
};

const removeUserFromGroup = (groupId, userId) => {
  return apiClient.delete(`/groups/${groupId}/members/${userId}`);
};

// New methods
const markMessageAsRead = (messageId) => {
  return apiClient.put(`/messages/${messageId}/read`);
};

const markGroupMessagesAsRead = (groupId) => {
  return apiClient.put(`/messages/group/${groupId}/read`);
};

const getUnreadMessageCount = () => {
  return apiClient.get('/messages/unread');
};

const sendTypingIndicator = (conversationId, isGroup) => {
  // This is typically handled via socket.io, but we can add an API endpoint as backup
  return apiClient.post('/typing-indicator', { conversationId, isGroup });
};

const getUserStatus = (userId) => {
  return apiClient.get(`/users/${userId}/status`);
};

const getUserProfile = (userId) => {
  return apiClient.get(`/users/profile/${userId}`);
};

const searchUsers = (query) => {
  return apiClient.get('/users/search', { params: { query } });
};

const uploadAttachment = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiClient.post('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress
  });
};

// Get attachment by ID
const getAttachment = (attachmentId) => {
  return apiClient.get(`/attachments/${attachmentId}`);
};

// Delete attachment by ID
const deleteAttachment = (attachmentId) => {
  return apiClient.delete(`/attachments/${attachmentId}`);
};

// Additional method to get attachment URL
const getAttachmentUrl = (filePath) => {
  return process.env.REACT_APP_BACKEND_URL + filePath;
};

const reportMessage = (messageId, reason) => {
  return apiClient.post(`/messages/${messageId}/report`, { reason });
};

const blockUser = (userId) => {
  return apiClient.post(`/users/${userId}/block`);
};

const unblockUser = (userId) => {
  return apiClient.delete(`/users/${userId}/block`);
};

const getBlockedUsers = () => {
  return apiClient.get('/users/blocked');
};

// Get group details
const getGroup = (groupId) => {
  return apiClient.get(`/groups/${groupId}`);
};

// Add member to group
const addGroupMember = (groupId, userId) => {
  return apiClient.post(`/groups/${groupId}/members`, { userId });
};

// Remove member from group
const removeGroupMember = (groupId, userId) => {
  return apiClient.delete(`/groups/${groupId}/members/${userId}`);
};

// Leave group
const leaveGroup = (groupId) => {
  return apiClient.delete(`/groups/${groupId}/members/me`);
};

// Delete group (admin only)
const deleteGroup = (groupId) => {
  return apiClient.delete(`/groups/${groupId}`);
};

const getAllUsers = () => {
  return apiClient.get('/users/all');
};

const forwardMessage = ({ messageId, to, isGroup }) => {
  return apiClient.post('/messages/forward', {
    messageId,
    to,
    isGroup
  });
};

export default {
  // Existing methods
  getContacts,
  addContact,
  removeContact,
  getConversations,
  getMessages,
  createGroup,
  updateGroup,
  addUserToGroup,
  removeUserFromGroup,
  uploadAttachment,
  getAttachmentUrl,
  getAllUsers,
  
  // New methods
  markMessageAsRead,
  markGroupMessagesAsRead,
  getUnreadMessageCount,
  sendTypingIndicator,
  getUserStatus,
  getUserProfile,
  searchUsers,
  getAttachment,
  deleteAttachment,
  reportMessage,
  blockUser,
  unblockUser,
  getBlockedUsers,
  createGroup,
  getGroup,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
  forwardMessage
};