const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Setup endpoint to update admin password
router.post('/setup/admin-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Find admin user
    const adminUser = userModel.findByEmail('admin@nexusrealtync.co');
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    userModel.updatePassword(adminUser.id, hashedPassword);

    res.json({
      success: true,
      message: 'Admin password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
