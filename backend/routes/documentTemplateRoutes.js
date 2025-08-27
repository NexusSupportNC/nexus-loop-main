const express = require('express');
const router = express.Router();
const documentTemplateController = require('../controllers/documentTemplateController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// Template CRUD operations
router.get('/', documentTemplateController.getAllTemplates);
router.post('/upload', upload.single('templateFile'), documentTemplateController.uploadTemplate);
router.delete('/:id', documentTemplateController.deleteTemplate);
router.put('/:id/fields', documentTemplateController.updateTemplateFields);

// Template utilities
router.get('/stats', documentTemplateController.getTemplateStats);
router.get('/:id/preview', documentTemplateController.getTemplatePreview);
router.post('/:id/generate', documentTemplateController.generateDocument);

// Generated document management
router.get('/generated/:fileName', documentTemplateController.downloadGeneratedDocument);
router.get('/loop/:loopId/documents', documentTemplateController.getGeneratedDocuments);

module.exports = router;
