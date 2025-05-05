// server/src/middlewares/fileValidationMiddleware.js
const validFileTypes = [
  // Images
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  // Archives
  'application/zip',
  'application/x-rar-compressed'
];

const validateFileType = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  if (!validFileTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: 'Invalid file type. Please upload a valid file type.'
    });
  }
  
  next();
};

module.exports = {
  validateFileType
};