// client/src/services/userService.js
import apiClient from './apiClient';

/**
 * Get user profile
 */
const getProfile = (userId) => {
  return apiClient.get(`/users/profile/${userId}`);
};

/**
 * Update user profile
 */
const updateProfile = (userData) => {
  return apiClient.put('/users/profile', userData);
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  return apiClient.post('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Change password
 */
const changePassword = (passwordData) => {
  return apiClient.put('/users/password', passwordData);
};

/**
 * Store push notification token
 */
const storePushToken = (token) => {
  return apiClient.post('/users/push-token', { token });
};

/**
 * Get user status
 */
const getUserStatus = (userId) => {
  return apiClient.get(`/users/${userId}/status`);
};

/**
 * Block a user
 */
const blockUser = (userId) => {
  return apiClient.post(`/users/${userId}/block`);
};

/**
 * Unblock a user
 */
const unblockUser = (userId) => {
  return apiClient.delete(`/users/${userId}/block`);
};

/**
 * Get blocked users
 */
const getBlockedUsers = () => {
  return apiClient.get('/users/blocked');
};

/**
 * Search users by username or email
 */
const searchUsers = (query) => {
  return apiClient.get('/users/search', { params: { query } });
};

export default {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  storePushToken,
  getUserStatus,
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers
};