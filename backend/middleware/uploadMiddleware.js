const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'loops');
fs.ensureDirSync(uploadsDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `loop-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
  }
});

module.exports = {
  uploadImages: upload.array('images', 5),
  uploadsDir
};
