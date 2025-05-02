// server/setup-db.js
'use strict';

require('dotenv').config();
const db = require('./src/db/models');
const syncDatabase = require('./src/db/sync');
const initializeData = require('./src/db/init-data');

/**
 * Setup database - sync models and initialize with test data
 */
async function setupDatabase() {
  try {
    // Don't close connection after sync if we're also initializing data
    const keepConnectionOpen = process.argv.includes('--init-data');
    
    const syncSuccess = await syncDatabase(!keepConnectionOpen);
    
    if (!syncSuccess) {
      console.error('Database sync failed. Aborting setup.');
      
      // Make sure connection is closed if sync failed but didn't close it
      if (keepConnectionOpen) {
        await db.sequelize.close();
      }
      
      return false;
    }
    
    // Initialize data if requested
    if (process.argv.includes('--init-data')) {
      console.log('Initializing database with test data...');
      // Always close connection after initializing data
      const initSuccess = await initializeData(true);
      
      if (!initSuccess) {
        console.error('Data initialization failed.');
        return false;
      }
      
      console.log('Test data initialized successfully!');
    }
    
    console.log('Database setup complete!');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    
    // Ensure connection is closed
    try {
      await db.sequelize.close();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
    
    return false;
  }
}

// Print usage information
console.log('Database Setup Utility');
console.log('Usage:');
console.log('  node setup-db.js                  - Sync database models (safe)');
console.log('  node setup-db.js --alter          - Alter existing tables');
console.log('  node setup-db.js --force          - Drop all tables and recreate them');
console.log('  node setup-db.js --force --init-data - Drop tables, recreate, and add test data');
console.log('');

// Run the setup function
setupDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });