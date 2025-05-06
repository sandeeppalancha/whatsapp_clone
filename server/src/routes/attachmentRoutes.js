// server/src/routes/attachmentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateFileType } = require('../middlewares/fileValidationMiddleware.js');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes are protected
router.use(authenticate);

router.post('/', upload.single('file'), (req, res, next) => {
  console.log('POST /attachments route hit');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log("Important log message");
  process.stdout.write(""); // Force flush
  // Then call the controller
  attachmentController.uploadAttachment(req, res);
});

router.get('/:id', attachmentController.getAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

// New routes for S3 direct upload
router.post('/upload-url', attachmentController.getUploadUrl);
router.post('/register', attachmentController.registerAttachment);

module.exports = router;