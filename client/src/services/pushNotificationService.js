// client/src/services/pushNotificationService.js

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import userService from './userService';

export const initializePushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native platforms');
    return;
  }
  
  try {
    // Request permission
    const permissionStatus = await PushNotifications.requestPermissions();
    
    if (permissionStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }
    
    // Register with the native platform
    await PushNotifications.register();
    
    // Listen for registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      // Send token to server
      try {
        await userService.storePushToken(token.value);
        console.log('Push token sent to server successfully');
      } catch (error) {
        console.error('Failed to send push token to server:', error);
      }
    });
    
    // Handle notification received when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      // Convert to local notification or handle directly in UI
      handleNotification(notification, false);
    });
    
    // Handle notification click when app was in background
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      handleNotification(action.notification, true);
    });
    
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

// Helper to handle incoming notifications
const handleNotification = (notification, wasClicked) => {
  const { title, body, data } = notification;
  
  // Navigate to appropriate screen based on notification type
  if (wasClicked && data) {
    const { type, conversationId, isGroup } = data;
    
    if (type === 'message') {
      // Use window.location for navigation when app is closed
      // In a real app, you'd use a more sophisticated navigation strategy
      const path = isGroup === 'true' ? `/group/${conversationId}` : `/chat/${conversationId}`;
      window.location.href = path;
    }
  }
};