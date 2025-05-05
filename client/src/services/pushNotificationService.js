// client/src/services/pushNotificationService.js - Fixed version
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { store } from '../redux/store';
import { addNotification } from '../redux/slices/uiSlice';
import { addMessage } from '../redux/slices/chatSlice';
import apiClient from './apiClient';

// Check if running on a native platform
const isNativePlatform = Capacitor.isNativePlatform();

export const initializePushNotifications = async () => {
  if (!isNativePlatform) {
    console.log('Push notifications are only available on native platforms');
    return;
  }
  
  try {
    console.log('Checking push notification availability...');
    
    // Check if the PushNotifications plugin is available
    if (typeof PushNotifications === 'undefined') {
      console.error('PushNotifications plugin is not available');
      return;
    }
    
    // Check if running on Android 13+ (API Level 33+)
    const deviceInfo = await Capacitor.getAppInfo();
    console.log('Device info:', deviceInfo);
    
    // Request permission to use push notifications
    console.log('Requesting push notification permission...');
    const result = await PushNotifications.requestPermissions();
    console.log('Permission request result:', result);
    
    if (result.receive === 'granted') {
      // Register with FCM/APNs
      console.log('Registering push notifications...');
      await PushNotifications.register();
      console.log('Push notifications registered successfully');
      
      // Set up event listeners
      setupPushListeners();
    } else {
      console.log('Push notification permission denied');
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    // Continue app execution even if push notifications fail
  }
};

const setupPushListeners = () => {
  try {
    console.log('Setting up push notification listeners...');
    
    // Remove any existing listeners to prevent duplicates
    PushNotifications.removeAllListeners();
    
    // Registration success event
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Send token to server
      sendTokenToServer(token.value);
    });

    // Registration error event
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration failed:', error);
    });

    // Push notification received event
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      
      // Process the notification data
      processNotification(notification);
    });

    // Push notification action performed event
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      
      // Process notification action (e.g., navigate to specific chat)
      processNotificationAction(action);
    });
    
    console.log('Push notification listeners set up successfully');
  } catch (error) {
    console.error('Error setting up push notification listeners:', error);
  }
};

const sendTokenToServer = async (token) => {
  try {
    console.log('Sending push token to server:', token);
    await apiClient.post('/users/push-token', { token });
    console.log('Push token sent to server successfully');
  } catch (error) {
    console.error('Failed to send push token to server:', error);
  }
};

const processNotification = (notification) => {
  try {
    console.log('Processing notification:', notification);
    const { title, body, data } = notification;
    
    if (!data) {
      console.log('No data in notification, skipping processing');
      return;
    }
    
    // Check notification type and process accordingly
    if (data.type === 'message') {
      // Create a redux notification
      store.dispatch(
        addNotification({
          id: data.messageId || Math.random().toString(36).substr(2, 9),
          type: 'message',
          title: title,
          message: body,
          senderId: data.senderId,
          conversationId: data.conversationId,
          isGroup: data.isGroup === 'true',
          timestamp: new Date().toISOString()
        })
      );
      
      // Add the message to the appropriate conversation
      store.dispatch(
        addMessage({
          conversationId: data.conversationId,
          isGroup: data.isGroup === 'true',
          message: {
            id: data.messageId || Math.random().toString(36).substr(2, 9),
            content: body,
            senderId: data.senderId,
            timestamp: new Date().toISOString(),
            status: 'received'
          }
        })
      );
    }
  } catch (error) {
    console.error('Error processing notification:', error);
  }
};

const processNotificationAction = (action) => {
  try {
    console.log('Processing notification action:', action);
    const { notification } = action;
    
    if (!notification || !notification.data) {
      console.log('No data in notification action, skipping processing');
      return;
    }
    
    const data = notification.data;
    
    // Handle notification tap based on type
    if (data.type === 'message') {
      console.log('Navigate to conversation:', data.conversationId, 'isGroup:', data.isGroup);
      // Navigation logic would be implemented in your router
    }
  } catch (error) {
    console.error('Error processing notification action:', error);
  }
};

export default {
  initializePushNotifications
};