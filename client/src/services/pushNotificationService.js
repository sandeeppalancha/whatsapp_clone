import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import userService from './userService';

// Store the token locally for reuse
let currentFCMToken = null;
let devicePlatform = null;

const checkForExistingToken = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    console.log('Checking for existing FCM token...');
    
    // For iOS, trigger a manual token check if available
    // This is a no-op if the message handler doesn't exist
    if (devicePlatform === 'ios' && 
        window.webkit && 
        window.webkit.messageHandlers && 
        window.webkit.messageHandlers.checkFCMToken) {
      try {
        window.webkit.messageHandlers.checkFCMToken.postMessage({});
        console.log('Requested token check from native iOS code');
      } catch (e) {
        console.log('Native message handler not available:', e);
      }
    }
  } catch (error) {
    console.error('Error checking for existing token:', error);
    return null;
  }
};

const setupNativeBridgeListeners = () => {
  // Prevent duplicate event listeners
  window.removeEventListener('FCMToken', onFCMTokenReceived);
  
  // Listen for direct FCM token events from native iOS bridge
  window.addEventListener('FCMToken', onFCMTokenReceived);
  
  console.log('Native bridge listeners set up');
};

// Separate handler function to avoid duplicating code
function onFCMTokenReceived(event) {
  if (event.detail && event.detail.token) {
    console.log('Received FCM token from native bridge:', event.detail.token);
    
    // Store token on server with iOS platform info
    userService.storePushToken({
      token: event.detail.token,
      platform: devicePlatform || 'ios' // Fallback to ios if not set
    }).then(() => {
      console.log('Successfully stored token from native bridge');
      // Update the global token variable for reuse
      currentFCMToken = event.detail.token;
    }).catch(error => {
      console.error('Failed to store token from native bridge:', error);
    });
  }
}

export const initializePushNotifications = async () => {
  try {
    // First check if we're on a native platform
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications are only available on native platforms');
      return;
    }
    
    console.log('Initializing push notifications...');
    
    // Get device info to detect platform
    const deviceInfo = await Device.getInfo();
    devicePlatform = deviceInfo.platform;
    console.log(`Device platform: ${devicePlatform}`);
    
    // Set up platform-specific listeners early
    setupNativeBridgeListeners();
    
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
      console.log(`Push registration success on ${devicePlatform}:`, token.value);
      currentFCMToken = token.value;
      
      // Store token on server with platform info
      try {
        await userService.storePushToken({
          token: token.value,
          platform: devicePlatform
        });
        console.log('Push token stored on server');
      } catch (error) {
        console.error('Failed to store push token on server:', error);
      }
    });
    
    // Registration error event
    PushNotifications.addListener('registrationError', (error) => {
      console.error(`Push registration failed on ${devicePlatform}:`, error);
    });
    
    // Notification received in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log(`Push notification received in foreground on ${devicePlatform}:`, notification);
      
      // iOS and Android have slightly different notification structures
      const formattedNotification = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {}
      };
      
      // Create local notification for foreground state
      createLocalNotification(formattedNotification);
    });
    
    // Notification action performed (clicked)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log(`Push notification action performed on ${devicePlatform}:`, action);
      
      // Handle notification data structure differences between iOS and Android
      const notificationData = action.notification.data;
      
      // Handle navigation based on notification data
      if (notificationData) {
        handleNotificationNavigation(notificationData);
      }
    });
    
    // Register with FCM/APNs
    console.log('Registering push notifications...');
    await PushNotifications.register();
    console.log('Push notifications registered');

    // Check for existing token as a fallback (especially for iOS)
    if (devicePlatform === 'ios') {
      await checkForExistingToken();
    }
    
  } catch (error) {
    console.error('Push notification initialization error:', error);
  }
};

// Show local notification for foreground state
const createLocalNotification = async (notification) => {
  console.log("createLocalNotification");
  
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
        console.log(`Refreshed FCM token on ${devicePlatform}:`, token.value);
        currentFCMToken = token.value;
        
        // Update on server with platform info (fixed to include platform)
        try {
          await userService.storePushToken({
            token: token.value,
            platform: devicePlatform
          });
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