const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure uploads directories exist
const uploadsImagesDir = path.join(__dirname, '..', 'uploads', 'loops');
const uploadsDocsDir = path.join(__dirname, '..', 'uploads', 'docs');
fs.ensureDirSync(uploadsImagesDir);
fs.ensureDirSync(uploadsDocsDir);

// Configure multer storage for images
const storageImages = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `loop-${uniqueSuffix}${extension}`);
  }
});

// Configure multer storage for documents
const storageDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDocsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilterImages = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for common document types
const allowedDocTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
]);
const fileFilterDocs = (req, file, cb) => {
  if (allowedDocTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported document type'), false);
  }
};

// Configure multer
const uploadImages = multer({
  storage: storageImages,
  fileFilter: fileFilterImages,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const uploadDocs = multer({
  storage: storageDocs,
  fileFilter: fileFilterDocs,
  limits: { fileSize: 15 * 1024 * 1024, files: 10 }
});

module.exports = {
  uploadImages: uploadImages.array('images', 5),
  uploadDocuments: uploadDocs.array('files', 10),
  uploadsImagesDir,
  uploadsDocsDir
};
