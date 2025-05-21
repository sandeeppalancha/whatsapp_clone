const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Track sent notifications to avoid rate limiting
const sentNotifications = new Map();
const MAX_NOTIFICATIONS_PER_MINUTE = 10;
const NOTIFICATION_RETENTION_MS = 60 * 1000; // 1 minute

// Firebase Admin instance
let firebaseApp = null;
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;
  
  try {
    // Try using service account file first
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        // Read file and validate
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        
        // Initialize with provided credentials
        if (!firebaseApp) {
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        }
        
        console.log('Firebase initialized successfully with service account file');
        firebaseInitialized = true;
        return true;
      } catch (jsonError) {
        console.error(`Error with service account file: ${jsonError.message}`);
        
        // If file exists but has issues, try environment variables instead
        return initializeFromEnv();
      }
    } else {
      console.log('Service account file not found, trying environment variables');
      return initializeFromEnv();
    }
  } catch (error) {
    console.error(`Firebase initialization error: ${error.message}`);
    return false;
  }
};

// Helper to initialize from environment variables
const initializeFromEnv = () => {
  try {
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      if (!firebaseApp) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
      }
      
      console.log('Firebase initialized with environment variables');
      firebaseInitialized = true;
      return true;
    } else {
      console.error('Cannot initialize Firebase - missing environment variables');
      return false;
    }
  } catch (envError) {
    console.error(`Environment variable initialization error: ${envError.message}`);
    return false;
  }
};

// Check for rate limiting and clean up old entries
const checkRateLimitAndTrack = (userId) => {
  const now = Date.now();
  
  // Clean up old entries
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_RETENTION_MS) {
      sentNotifications.delete(key);
    }
  }
  
  // Count recent notifications for this user
  const userKey = `user_${userId}`;
  let count = 0;
  
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (key.startsWith(userKey) && now - timestamp <= NOTIFICATION_RETENTION_MS) {
      count++;
    }
  }
  
  // Check if rate limited
  if (count >= MAX_NOTIFICATIONS_PER_MINUTE) {
    console.log(`Rate limiting notifications for user ${userId}: ${count} notifications in the last minute`);
    return false;
  }
  
  // Track this notification
  const notificationKey = `${userKey}_${now}`;
  sentNotifications.set(notificationKey, now);
  return true;
};

// Send push notification with better handling
const sendPushNotification = async (userId, token, notification, data = {}, platform = null) => {
  // Initialize Firebase if not already done
  if (!initializeFirebase()) {
    console.error('Cannot send push notification - Firebase not initialized');
    return false;
  }
  
  // Check rate limiting
  if (!checkRateLimitAndTrack(userId)) {
    console.log(`Push notification for user ${userId} was rate limited`);
    return false;
  }
  
  try {
    // Detect if this is an iOS device based on passed platform or token format
    const isIOS = platform === 'ios' || /^[a-fA-F0-9]{64}$/.test(token);
    
    console.log(`Sending push notification to user ${userId}${isIOS ? ' (iOS)' : ' (Android)'}, token: ${token.substring(0, 20)}...`);
    
    // Ensure all data values are strings as required by FCM
    const stringifiedData = Object.keys(data).reduce((result, key) => {
      result[key] = String(data[key]);
      return result;
    }, {});
    
    // Add timestamp to data to ensure uniqueness
    stringifiedData.timestamp = Date.now().toString();
    
    // Create a unique message ID for this notification
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create a message specific to the platform
    let message;
    
    if (isIOS) {
      // iOS-specific message (simpler configuration to test)
      message = {
        token,
        notification,
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              badge: 1,
              sound: 'default'
            }
          }
        },
        data: stringifiedData
      };
      
      console.log('Using iOS-specific message configuration');
    } else {
      // Android-specific message
      message = {
        token,
        notification,
        android: {
          priority: 'high',
          notification: {
            channelId: 'chat_messages',
            priority: 'high',
            defaultSound: true,
            visibility: 'public'
          }
        },
        data: stringifiedData
      };
    }
    
    // Send the notification
    const response = await admin.messaging().send(message);
    console.log(`Successfully sent notification to user ${userId}`, response);
    return response;
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    
    // Handle APNs-specific errors
    if (error.errorInfo && error.errorInfo.code === 'messaging/third-party-auth-error') {
      console.error('APNs authentication error. Please check your Apple Developer account and Firebase APNs setup.');
      
      // Log token information for debugging
      console.error(`Token details - Length: ${token.length}, Format: ${/^[a-fA-F0-9]{64}$/.test(token) ? 'APNs format' : 'FCM format'}`);
    }
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.error(`Invalid FCM token for user ${userId} - should be removed from database`);
    }
    
    return false;
  }
};

module.exports = {
  sendPushNotification,
  initializeFirebase
};