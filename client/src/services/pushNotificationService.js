// client/src/services/pushNotificationService.js

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import userService from './userService';

// Store the token locally for reuse
let currentFCMToken = null;

export const initializePushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native platforms');
    return;
  }
  
  try {
    console.log('Initializing push notifications...');
    
    // Check permissions first
    const permissionStatus = await PushNotifications.checkPermissions();
    console.log('Current permission status:', permissionStatus);
    
    if (permissionStatus.receive !== 'granted') {
      console.log('Requesting push notification permission...');
      const requestResult = await PushNotifications.requestPermissions();
      console.log('Permission request result:', requestResult);
      
      if (requestResult.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }
    }
    
    // Remove any existing listeners to prevent duplicates
    PushNotifications.removeAllListeners();
    
    // Registration event
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success:', token.value);
      
      // Store token on server
      try {
        await userService.storePushToken(token.value);
        console.log('Push token stored on server');
      } catch (error) {
        console.error('Failed to store push token on server:', error);
      }
    });
    
    // Registration error event
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration failed:', error);
    });
    
    // Notification received in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received in foreground:', notification);
      
      // Important: When the app is in the foreground, FCM doesn't show notifications
      // We need to manually create a local notification
      createLocalNotification(notification);
    });
    
    // Notification action performed (clicked)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      
      // Handle navigation based on notification data
      if (action.notification && action.notification.data) {
        handleNotificationNavigation(action.notification.data);
      }
    });
    
    // Register with FCM/APNs
    console.log('Registering push notifications...');
    await PushNotifications.register();
    console.log('Push notifications registered');
    
  } catch (error) {
    console.error('Push notification initialization error:', error);
  }
};

// Show local notification for foreground state
const createLocalNotification = async (notification) => {
  if (!notification) return;
  
  try {
    const { title, body, data } = notification;
    
    // Generate a unique ID for this notification
    const notificationId = Math.floor(Math.random() * 100000);
    
    // Schedule a local notification
    await PushNotifications.schedule({
      notifications: [
        {
          title: title || 'New Message',
          body: body || 'You have a new message',
          id: notificationId,
          sound: true,
          attachments: null,
          actionTypeId: '',
          extra: data
        }
      ]
    });
    
    console.log('Local notification created for foreground app');
  } catch (error) {
    console.error('Error creating local notification:', error);
  }
};
// Handle notification click action
export const handleNotificationNavigation = (data) => {
  if (!data) return;
  
  try {
    console.log('Handling notification navigation with data:', data);
    
    // Extract navigation info
    const type = data.type;
    const conversationId = data.conversationId;
    const isGroup = data.isGroup === 'true';
    
    if (type === 'message' && conversationId) {
      // Construct the path
      const path = isGroup ? `/group/${conversationId}` : `/chat/${conversationId}`;
      
      console.log('Navigating to conversation:', path);
      
      // Navigate to the conversation
      // Use setTimeout to ensure app is ready
      setTimeout(() => {
        window.location.href = path;
      }, 300);
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
};

// A function to manually check and refresh token
export const refreshFCMToken = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    // This will trigger the registration process again
    await PushNotifications.register();
    
    // Wait for token from the registration listener
    return new Promise((resolve) => {
      const tokenListener = PushNotifications.addListener('registration', async (token) => {
        console.log('Refreshed FCM token:', token.value);
        currentFCMToken = token.value;
        
        // Update on server
        try {
          await userService.storePushToken(token.value);
          console.log('Refreshed token stored on server');
        } catch (err) {
          console.error('Failed to store refreshed token:', err);
        }
        
        // Clean up listener and resolve
        tokenListener.remove();
        resolve(token.value);
      });
      
      // Add timeout
      setTimeout(() => {
        tokenListener.remove();
        resolve(null);
        console.log('Token refresh timed out');
      }, 10000);
    });
  } catch (error) {
    console.error('Error refreshing FCM token:', error);
    return null;
  }
};