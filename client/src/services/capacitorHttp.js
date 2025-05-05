import { CapacitorHttp } from '@capacitor/core';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// When making API calls, use:
export const makeCapacitorHttpPostCall = async (url, method, payload) => {
  try {
    const response = await CapacitorHttp.post({
      url: `${BACKEND_URL}/api${url}`, // /auth/login',
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload,
      ssl: {
        verify: false
      }
    });
    return response;
  } catch (error) {
    console.error('API error:', error);
  }
};