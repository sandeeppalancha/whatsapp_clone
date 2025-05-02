// server/src/db/sync.js
'use strict';

require('dotenv').config();
const db = require('./models');

// Options for syncing
const syncOptions = {
  // Set to true to drop tables and recreate them (BE CAREFUL with this in production!)
  force: process.argv.includes('--force'),
  
  // Set to true to alter tables instead of dropping (safer option)
  alter: process.argv.includes('--alter'),
  
  // Log all SQL statements
  logging: console.log
};

/**
 * Sync database models with database
 * @param {boolean} closeConnection - Whether to close the connection after sync
 */
async function syncDatabase(closeConnection = true) {
  try {
    // First test the connection
    console.log('Testing database connection...');
    await db.sequelize.authenticate();
    console.log('Database connection established successfully!');
    
    // Choose sync method based on options
    if (syncOptions.force) {
      console.log('WARNING: Force sync selected - this will DROP ALL TABLES and recreate them!');
      console.log('You have 5 seconds to abort (CTRL+C) if this is not what you want...');
      
      // Wait 5 seconds to give user time to abort
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Force syncing database models...');
      await db.sequelize.sync({ force: true });
      console.log('Database models force synced successfully!');
    } else if (syncOptions.alter) {
      console.log('Altering database tables to match models...');
      await db.sequelize.sync({ alter: true });
      console.log('Database models altered successfully!');
    } else {
      console.log('Syncing database models (creating tables if they don\'t exist)...');
      await db.sequelize.sync();
      console.log('Database models synced successfully!');
    }
    
    console.log('Database sync complete!');
    
    // Only close connection if requested
    if (closeConnection) {
      await db.sequelize.close();
      console.log('Database connection closed');
    }
    
    return true;
  } catch (error) {
    console.error('Database sync error:', error);
    
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
  // Print usage information
  console.log('Database Sync Utility');
  console.log('Usage:');
  console.log('  node sync.js         - Create tables if they don\'t exist (safe)');
  console.log('  node sync.js --alter - Alter existing tables to match models');
  console.log('  node sync.js --force - DROP ALL TABLES and recreate them (DANGEROUS)');
  console.log('');
  
  // Run the sync function
  syncDatabase(true) // Close connection when running as standalone script
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = syncDatabase;
}