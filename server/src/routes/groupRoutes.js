// server/src/routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(authenticate);

router.post('/', groupController.createGroup);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/members', groupController.addMember);
router.delete('/:id/members/:memberId', groupController.removeMember);

module.exports = router;