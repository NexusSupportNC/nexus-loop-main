const fs = require('fs-extra');
const path = require('path');

const imageUtils = {
  // Convert uploaded files to database format
  processUploadedImages: (files) => {
    if (!files || files.length === 0) return null;
    
    return JSON.stringify(files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date().toISOString()
    })));
  },

  // Parse images from database
  parseImages: (imagesJson) => {
    if (!imagesJson) return [];
    
    try {
      return JSON.parse(imagesJson);
    } catch (error) {
      console.error('Error parsing images JSON:', error);
      return [];
    }
  },

  // Get image file path
  getImagePath: (filename) => {
    return path.join(__dirname, '..', 'uploads', 'loops', filename);
  },

  // Delete image files
  deleteImages: async (imagesJson) => {
    if (!imagesJson) return;

    try {
      const images = JSON.parse(imagesJson);
      for (const image of images) {
        const filePath = imageUtils.getImagePath(image.filename);
        await fs.remove(filePath);
      }
    } catch (error) {
      console.error('Error deleting images:', error);
    }
  },

  // Check if file exists
  imageExists: (filename) => {
    const filePath = imageUtils.getImagePath(filename);
    return fs.existsSync(filePath);
  },

  // Get image URL for frontend
  getImageUrl: (filename) => {
    return `/uploads/loops/${filename}`;
  }
};

module.exports = imageUtils;
