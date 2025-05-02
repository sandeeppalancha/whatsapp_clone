// client/src/services/pushNotificationService.js
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

  // Request permission to use push notifications
  try {
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      // Register with FCM/APNs
      await PushNotifications.register();
      setupPushListeners();
    } else {
      console.log('Push notification permission denied');
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

const setupPushListeners = () => {
  // Registration success event
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success:', token.value);
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
};

const sendTokenToServer = async (token) => {
  try {
    await apiClient.post('/users/push-token', { token });
    console.log('Push token sent to server');
  } catch (error) {
    console.error('Failed to send push token to server:', error);
  }
};

const processNotification = (notification) => {
  const { title, body, data } = notification;
  
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
};

const processNotificationAction = (action) => {
  const { notification } = action;
  const data = notification.data;
  
  // Handle notification tap based on type
  if (data.type === 'message') {
    // Navigate to the appropriate conversation
    // Navigation logic would depend on your router setup
    console.log('Navigate to conversation:', data.conversationId, 'isGroup:', data.isGroup);
    
    // Example navigation logic (to be implemented based on your routing)
    /*
    const history = useHistory(); // This would be in your component
    const conversationPath = data.isGroup === 'true' 
      ? `/groups/${data.conversationId}` 
      : `/chats/${data.conversationId}`;
    history.push(conversationPath);
    */
  }
};

export default {
  initializePushNotifications
};