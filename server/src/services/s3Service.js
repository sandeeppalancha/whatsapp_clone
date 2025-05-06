// server/src/services/s3Service.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS SDK with your credentials
AWS.config?.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 service object
const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalFilename - Original filename
 * @param {string} mimetype - File mime type
 * @returns {Promise<Object>} - Upload result with file URL
 */
const uploadFile = async (fileBuffer, originalFilename, mimetype) => {
  try {
    // Generate a unique filename
    console.log("upload file", originalFilename);
    
    const fileExt = path.extname(originalFilename);
    const fileName = `uploads/${uuidv4()}${fileExt}`;
    
    // Set up S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
      ACL: 'public-read' // Make the file publicly accessible
    };
    
    // Upload to S3
    const uploadResult = await s3.upload(params).promise();
    
    return {
      fileName: originalFilename,
      fileKey: fileName,
      fileUrl: uploadResult.Location,
      fileType: mimetype
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete a file from S3
 * @param {string} fileKey - S3 file key to delete
 * @returns {Promise<Object>} - Delete result
 */
const deleteFile = async (fileKey) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: fileKey
    };
    
    return await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate a pre-signed URL for direct browser upload
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mime type
 * @returns {Object} - Pre-signed URL details
 */
const getPresignedUrl = (filename, mimetype) => {
  const fileExt = path.extname(filename);
  const fileKey = `uploads/${uuidv4()}${fileExt}`;
  
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    ContentType: mimetype,
    Expires: 60 * 5 // URL expires in 5 minutes
  };
  
  const uploadUrl = s3.getSignedUrl('putObject', params);
  
  return {
    uploadUrl,
    fileKey,
    fileUrl: `https://${bucketName}.s3.amazonaws.com/${fileKey}`
  };
};

module.exports = {
  uploadFile,
  deleteFile,
  getPresignedUrl
};