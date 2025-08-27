const express = require('express');
const router = express.Router();
const loopController = require('../controllers/loopController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { uploadImages } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Loop CRUD operations
router.get('/', loopController.getLoops);
router.post('/', uploadImages, loopController.createLoop);
router.get('/stats', loopController.getDashboardStats);
router.get('/closing', loopController.getClosingLoops);
router.get('/export/csv', loopController.exportCSV);
router.get('/:id', loopController.getLoopById);
router.put('/:id', uploadImages, loopController.updateLoop);
router.get('/:id/export/pdf', loopController.exportPDF);

// Image routes (for debugging)
router.get('/test-images', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'loops');

  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      success: true,
      files: files,
      uploadsPath: uploadsDir,
      staticRoute: '/api/loops/images/'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      uploadsPath: uploadsDir
    });
  }
});

router.delete('/:id/images/:filename', loopController.deleteLoopImage);

// Admin only routes
router.delete('/:id', adminMiddleware, loopController.deleteLoop);
router.put('/:id/archive', adminMiddleware, loopController.archiveLoop);
router.put('/:id/unarchive', adminMiddleware, loopController.unarchiveLoop);

module.exports = router;
