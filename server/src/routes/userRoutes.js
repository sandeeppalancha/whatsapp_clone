// server/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(authenticate);

router.get('/profile/:id', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/push-token', userController.storePushToken);
router.get('/search', userController.searchUsers);
router.get('/all', userController.getAllUsers);

// Add the new route for password update
router.put('/password', userController.changePassword);

module.exports = router;