// client/src/services/authService.js
import apiClient from './apiClient';
import {  makeCapacitorHttpPostCall } from './capacitorHttp';

const login = (credentials) => {
  // return apiClient.post('/auth/login', credentials);
  return makeCapacitorHttpPostCall('/auth/login', 'POST', credentials)
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
