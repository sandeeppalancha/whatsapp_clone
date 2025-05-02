// server/src/db/init-data.js
'use strict';

require('dotenv').config();
const db = require('./models');
const bcrypt = require('bcrypt');

// Initial test users
const testUsers = [
  {
    username: 'user1',
    email: 'user1@example.com',
    password: 'password123',
    status: 'Available',
    isOnline: true
  },
  {
    username: 'user2',
    email: 'user2@example.com',
    password: 'password123',
    status: 'Busy',
    isOnline: false
  },
  {
    username: 'user3',
    email: 'user3@example.com',
    password: 'password123',
    status: 'At work',
    isOnline: true
  }
];

// Initial test groups
const testGroups = [
  {
    name: 'Test Group 1',
    description: 'A test group for development'
  },
  {
    name: 'Test Group 2',
    description: 'Another test group'
  }
];

/**
 * Initialize database with test data
 * @param {boolean} closeConnection - Whether to close the connection after init
 */
async function initializeData(closeConnection = true) {
  try {
    console.log('Initializing database with test data...');
    
    // Create users
    console.log('Creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      // Hash password manually (bypassing the model hook for simplicity)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const user = await db.User.create({
        ...userData,
        password: hashedPassword
      });
      
      createdUsers.push(user);
      console.log(`Created user: ${user.username} (ID: ${user.id})`);
    }
    
    // Make users contacts of each other
    console.log('Setting up contacts between users...');
    await createdUsers[0].addContact(createdUsers[1]);
    await createdUsers[0].addContact(createdUsers[2]);
    await createdUsers[1].addContact(createdUsers[0]);
    console.log('Contacts set up successfully');
    
    // Create groups
    console.log('Creating test groups...');
    for (const groupData of testGroups) {
      const group = await db.Group.create({
        ...groupData,
        adminId: createdUsers[0].id
      });
      
      // Add members to group
      await group.addMembers([
        createdUsers[0].id,
        createdUsers[1].id,
        createdUsers[2].id
      ]);
      
      console.log(`Created group: ${group.name} (ID: ${group.id})`);
    }
    
    // Create some test messages
    console.log('Creating test messages...');
    
    // Private message between user1 and user2
    await db.Message.create({
      content: 'Hello user2, how are you?',
      senderId: createdUsers[0].id,
      receiverId: createdUsers[1].id
    });
    
    await db.Message.create({
      content: 'I\'m good, thanks for asking!',
      senderId: createdUsers[1].id,
      receiverId: createdUsers[0].id
    });
    
    // Get the first group
    const group = await db.Group.findOne();
    
    // Group messages
    await db.Message.create({
      content: 'Welcome to the group everyone!',
      senderId: createdUsers[0].id,
      groupId: group.id
    });
    
    await db.Message.create({
      content: 'Thanks for adding me!',
      senderId: createdUsers[1].id,
      groupId: group.id
    });
    
    console.log('Test messages created successfully');
    
    console.log('Database initialization complete!');
    
    // Only close connection if requested
    if (closeConnection) {
      await db.sequelize.close();
      console.log('Database connection closed');
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    
    // Only close connection if requested
    if (closeConnection) {
      try {
        await db.sequelize.close();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
    
    return false;
  }
}

// Execute the function if this file is run directly
if (require.main === module) {
  initializeData(true) // Close connection when running as standalone script
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = initializeData;
}