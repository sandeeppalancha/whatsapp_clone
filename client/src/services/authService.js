// client/src/services/authService.js
import apiClient from './apiClient';

const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

const logout = () => {
  localStorage.removeItem('token');
  return Promise.resolve();
};

const getCurrentUser = () => {
  return apiClient.get('/auth/me');
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
};
