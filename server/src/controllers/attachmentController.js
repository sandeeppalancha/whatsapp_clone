// server/src/controllers/attachmentController.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Attachment, Message } = require('../db/models');
const crypto = require('crypto');

// Helper to check file type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) return 'document';
  if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) return 'spreadsheet';
  return 'file';
};

// Generate a secure filename
const generateSecureFilename = (originalName) => {
  const fileExt = path.extname(originalName);
  return `${uuidv4()}${fileExt}`;
};

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
    
    // Check file size (limit to 50MB for example)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: 'File too large. Maximum file size is 50MB.'
      });
    }
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create user-specific directory for better organization
    const userDir = path.join(uploadDir, userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    const filePath = path.join(userDir, secureFilename);
    
    // Calculate file hash for integrity checks
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    // Save file
    fs.writeFileSync(filePath, file.buffer);
    
    // Determine file type for frontend display
    const fileType = getFileType(file.mimetype);
    
    // Create database record
    const attachment = await Attachment.create({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileCategory: fileType, // Add this field to the model
      fileSize: file.size,
      filePath: `/uploads/${userId}/${secureFilename}`, // Store path relative to API root
      fileHash: fileHash,
      uploadedBy: userId
    });
    
    res.status(201).json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileCategory: fileType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath,
      fileHash: fileHash,
      uploadedAt: attachment.createdAt
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      message: 'Server error while uploading attachment'
    });
  }
};

/**
 * Get attachment details
 */
exports.getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await Attachment.findByPk(id, {
      include: [
        {
          model: Message,
          as: 'message',
          attributes: ['id', 'groupId', 'receiverId', 'senderId']
        }
      ]
    });
    
    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }
    
    // Check permission
    const userId = req.user.id;
    const message = attachment.message;
    
    // Check if user has access to this attachment
    if (message) {
      // For private messages, only sender and receiver can access
      if (message.receiverId && message.receiverId !== userId && message.senderId !== userId) {
        return res.status(403).json({
          message: 'You do not have permission to access this attachment'
        });
      }
      
      // For group messages, check if user is in group (simplified - would need group membership check)
      if (message.groupId) {
        // This would need a proper check with group membership
        // For now, assume access is allowed in this example
      }
    }
    
    // Return attachment metadata
    res.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileCategory: getFileType(attachment.fileType), // Calculate if field doesn't exist
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
    
    const attachment = await Attachment.findByPk(id, {
      include: [
        {
          model: Message,
          as: 'message',
          attributes: ['id', 'senderId']
        }
      ]
    });
    
    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }
    
    // Check if user has permission (only uploader or message sender can delete)
    if (attachment.uploadedBy !== userId && 
        (!attachment.message || attachment.message.senderId !== userId)) {
      return res.status(403).json({
        message: 'You do not have permission to delete this attachment'
      });
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