// server/src/services/firebaseService.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Track sent notifications to avoid rate limiting
const sentNotifications = new Map();
const MAX_NOTIFICATIONS_PER_MINUTE = 10;
const NOTIFICATION_RETENTION_MS = 60 * 1000; // 1 minute

// Initialize Firebase Admin 
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;
  
  try {
    // Try using service account file first
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase initialized with service account file');
    } 
    // Fall back to environment variables if file doesn't exist
    else if (process.env.FIREBASE_PROJECT_ID && 
             process.env.FIREBASE_CLIENT_EMAIL && 
             process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log('Firebase initialized with environment variables');
    } else {
      console.error('No Firebase credentials found. Push notifications will not work!');
      return false;
    }
    
    firebaseInitialized = true;
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
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
const sendPushNotification = async (userId, token, notification, data = {}) => {
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
    console.log(`Sending push notification to user ${userId}, token: ${token.substring(0, 20)}...`);
    
    // Ensure all data values are strings as required by FCM
    const stringifiedData = Object.keys(data).reduce((result, key) => {
      result[key] = String(data[key]);
      return result;
    }, {});
    
    // Add timestamp to data to ensure uniqueness
    stringifiedData.timestamp = Date.now().toString();
    
    // Create a unique message ID for this notification
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Prepare the message with appropriate configuration for Android and iOS
    const message = {
      token,
      notification,
      data: stringifiedData,
      android: {
        priority: 'high',
        ttl: 86400 * 1000, // 1 day in milliseconds
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          defaultSound: true,
          visibility: 'public'
        },
        // Move collapseKey to the android section where it belongs
        collapseKey: messageId
      },
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-collapse-id': messageId // For iOS collapse behavior
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true
          }
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log(`Successfully sent notification to user ${userId}`, response);
    return response;
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.error(`Invalid FCM token for user ${userId} - should be removed from database`);
      
      // Here you could call a function to remove the invalid token
      // await removeInvalidToken(userId);
    }
    
    return false;
  }
};

module.exports = {
  sendPushNotification,
  initializeFirebase
};