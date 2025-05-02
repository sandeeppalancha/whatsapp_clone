// server/src/controllers/attachmentController.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Attachment } = require('../db/models');

/**
 * Upload file attachment
 */
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const file = req.file;
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file
    fs.writeFileSync(filePath, file.buffer);
    
    // Create database record
    const attachment = await Attachment.create({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: `/uploads/${fileName}`, // Store path relative to API root
      uploadedBy: userId
    });
    
    res.status(201).json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      message: 'Server error while uploading attachment'
    });
  }
};

/**
 * Get attachment
 */
exports.getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await Attachment.findByPk(id);
    
    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }
    
    // Return attachment metadata
    res.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath,
      createdAt: attachment.createdAt
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({
      message: 'Server error while getting attachment'
    });
  }
};

/**
 * Delete attachment
 */
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const attachment = await Attachment.findByPk(id);
    
    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }
    
    // Check ownership or message ownership
    // This would need to be expanded for proper security
    if (attachment.uploadedBy !== userId) {
      // Check if the attachment is in a message owned by the user
      // This is a simplified check - in a real app you'd check if the attachment belongs to a message sent by this user
      const hasAccess = await checkAttachmentAccess(userId, id);
      
      if (!hasAccess) {
        return res.status(403).json({
          message: 'You do not have permission to delete this attachment'
        });
      }
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '../..', attachment.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete database record
    await attachment.destroy();
    
    res.json({
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      message: 'Server error while deleting attachment'
    });
  }
};

/**
 * Helper function to check if user has access to an attachment
 */
async function checkAttachmentAccess(userId, attachmentId) {
  try {
    // This is a placeholder for a proper check
    // In a real application, you would check if the attachment belongs to a message sent by the user
    // or a message in a conversation or group where the user is a participant
    return true;
  } catch (error) {
    console.error('Check attachment access error:', error);
    return false;
  }
}