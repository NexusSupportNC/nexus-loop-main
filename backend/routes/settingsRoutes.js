const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get user settings (notification preferences)
router.get('/', settingsController.getUserSettings);

// Update notification preferences (admin only)
router.put('/notifications', adminMiddleware, settingsController.updateNotificationPreferences);

module.exports = router;
