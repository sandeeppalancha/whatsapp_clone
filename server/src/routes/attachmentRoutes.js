// server/src/routes/attachmentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes are protected
router.use(authenticate);

router.post('/', upload.single('file'), attachmentController.uploadAttachment);
router.get('/:id', attachmentController.getAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;