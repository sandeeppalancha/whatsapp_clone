// server/src/utils/fileUtils.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Get file type category based on mime type
 */
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) return 'document';
  if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) return 'spreadsheet';
  return 'file';
};

/**
 * Generate a secure filename
 */
const generateSecureFilename = (originalName) => {
  const fileExt = path.extname(originalName);
  return `${uuidv4()}${fileExt}`;
};

/**
 * Calculate hash of file for integrity checks
 */
const calculateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = (userId) => {
  const baseUploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }
  
  if (userId) {
    const userDir = path.join(baseUploadDir, userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }
  
  return baseUploadDir;
};

/**
 * Save file to disk
 */
const saveFileToDisk = (buffer, filePath) => {
  fs.writeFileSync(filePath, buffer);
};

/**
 * Delete file from disk
 */
const deleteFileFromDisk = (filePath) => {
  const fullPath = path.join(__dirname, '../..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

/**
 * Get file size in human-readable format
 */
const getHumanReadableSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

module.exports = {
  getFileCategory,
  generateSecureFilename,
  calculateFileHash,
  ensureUploadDir,
  saveFileToDisk,
  deleteFileFromDisk,
  getHumanReadableSize
};