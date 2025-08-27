const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/activity', adminController.getUserActivitySummary);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);
router.delete('/activity-logs', adminController.clearActivityLogs);

// Password Management
router.put('/change-password', adminController.changeUserPassword);

// User Suspension Management
router.put('/users/:userId/suspend', adminController.suspendUser);
router.put('/users/:userId/unsuspend', adminController.unsuspendUser);

// User Deletion
router.delete('/users/:userId', adminController.deleteUser);

// Role Management
router.put('/users/:userId/promote', adminController.promoteToAdmin);

// Export Functions
router.get('/export/activity-logs', adminController.exportActivityLogs);
router.get('/export/users', adminController.exportUserList);
router.get('/export/templates', adminController.exportTemplates);

// Import Functions
router.post('/import/users', upload.single('csvFile'), adminController.importUsers);

// Document Templates (using sub-router)
const documentTemplateRoutes = require('./documentTemplateRoutes');
router.use('/templates', documentTemplateRoutes);

module.exports = router;
