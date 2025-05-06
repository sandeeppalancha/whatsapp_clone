import apiClient from './apiClient';
import axios from 'axios';

/**
 * Upload file directly to S3 using pre-signed URL
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} - Upload result
 */
const uploadToS3 = async (file, onProgress = () => {}) => {
  try {
    // Step 1: Get the pre-signed URL from your backend
    const response = await apiClient.post('/attachments/upload-url', {
      fileName: file.name,
      fileType: file.type
    });
    
    const { uploadUrl, fileKey, fileUrl } = response.data;
    
    // Step 2: Upload directly to S3 with progress tracking
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    });
    
    // Step 3: Create a record in your database
    const attachmentData = await apiClient.post('/attachments/register', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: fileUrl,
      fileKey: fileKey
    });
    
    return attachmentData.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload file through the server (alternative method)
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} - Upload result
 */
const uploadThroughServer = async (file, onProgress = () => {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete an attachment
 * @param {string} attachmentId - The attachment ID to delete
 * @returns {Promise<Object>} - Delete result
 */
const deleteAttachment = async (attachmentId) => {
  return apiClient.delete(`/attachments/${attachmentId}`);
};

export default {
  uploadToS3,
  uploadThroughServer,
  deleteAttachment
};