// server/src/services/firebaseService.js

const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-service-account.json'); // You'll need to create this

// Initialize Firebase Admin with your service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Send push notification to a device
 * @param {string} token - The FCM token
 * @param {object} notification - The notification payload
 * @param {object} data - Additional data to send
 */
const sendPushNotification = async (token, notification, data = {}) => {
  try {
    const message = {
      token,
      notification,
      data: Object.keys(data).reduce((acc, key) => {
        // FCM data field must be strings
        acc[key] = String(data[key]);
        return acc;
      }, {}),
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('Successfully sent push notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification
};