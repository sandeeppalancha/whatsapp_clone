// server/src/tasks/cleanupTempAttachments.js
const { Attachment } = require('../db/models');
const fs = require('fs');
const path = require('path');

const MAX_AGE_HOURS = 24; // Cleanup attachments older than 24 hours

async function cleanupTemporaryAttachments() {
  try {
    console.log('Running cleanup of temporary attachments...');
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - MAX_AGE_HOURS);
    
    // Find old temporary attachments
    const oldAttachments = await Attachment.findAll({
      where: {
        isTemporary: true,
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });
    
    console.log(`Found ${oldAttachments.length} temporary attachments to clean up`);
    
    // Delete files and records
    for (const attachment of oldAttachments) {
      try {
        // Delete file from filesystem
        const filePath = path.join(__dirname, '../../', attachment.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
        
        // Delete database record
        await attachment.destroy();
        console.log(`Deleted attachment record: ${attachment.id}`);
      } catch (err) {
        console.error(`Error cleaning up attachment ${attachment.id}:`, err);
      }
    }
    
    console.log('Temporary attachment cleanup completed');
  } catch (error) {
    console.error('Error during attachment cleanup:', error);
  }
}

module.exports = cleanupTemporaryAttachments;