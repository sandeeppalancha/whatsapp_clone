// server/src/controllers/attachmentController.js
const { Attachment, Message } = require('../db/models');
const s3Service = require('../services/s3Service');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper to determine file type category
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) return 'document';
  if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) return 'spreadsheet';
  return 'file';
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
    
    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    console.log("Upload result", uploadResult);
    
    
    // Create database record
    const attachment = await Attachment.create({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      uploadedBy: userId,
      isTemporary: true // Mark as temporary until associated with a message
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
      
      // For group messages, check if user is in group
      // This would need a proper group membership check in a real app
      if (message.groupId) {
        // Implement group membership check here
      }
    }
    
    // Return attachment metadata
    res.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileCategory: getFileType(attachment.fileType),
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
    if (attachment.uploadedBy !== userId) {
      // Check if the attachment is in a message owned by the user
      const hasAccess = await checkAttachmentAccess(userId, id);
      
      if (!hasAccess) {
        return res.status(403).json({
          message: 'You do not have permission to delete this attachment'
        });
      }
    }
    
    // Delete file from S3
    if (attachment.fileKey) {
      await s3Service.deleteFile(attachment.fileKey);
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
 * Get pre-signed URL for direct browser upload to S3
 */
exports.getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        message: 'File name and type are required'
      });
    }
    
    const uploadData = s3Service.getPresignedUrl(fileName, fileType);
    
    res.json(uploadData);
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({
      message: 'Server error while generating upload URL'
    });
  }
};

/**
 * Register a file uploaded directly to S3 from the browser
 */
exports.registerAttachment = async (req, res) => {
  try {
    const { fileName, fileType, fileSize, filePath, fileKey } = req.body;
    const userId = req.user.id;
    
    if (!fileName || !fileType || !fileSize || !filePath || !fileKey) {
      return res.status(400).json({
        message: 'Missing required attachment information'
      });
    }
    
    // Create database record
    const attachment = await Attachment.create({
      fileName,
      fileType,
      fileSize,
      filePath,
      fileKey,
      uploadedBy: userId,
      isTemporary: true
    });
    
    res.status(201).json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath
    });
  } catch (error) {
    console.error('Register attachment error:', error);
    res.status(500).json({
      message: 'Server error while registering attachment'
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
    
    // Example implementation:
    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: Message,
          as: 'message',
          attributes: ['id', 'senderId', 'receiverId', 'groupId']
        }
      ]
    });
    
    if (!attachment || !attachment.message) return false;
    
    const message = attachment.message;
    
    // Check if user is sender or receiver of the message
    if (message.senderId === userId || message.receiverId === userId) {
      return true;
    }
    
    // For group messages, check if user is a member of the group
    if (message.groupId) {
      // In a real app, implement group membership check here
      return true; // Simplification for this example
    }
    
    return false;
  } catch (error) {
    console.error('Check attachment access error:', error);
    return false;
  }
}