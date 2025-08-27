const loopModel = require('../models/loopModel');
const excelLogger = require('../utils/excelLogger');
const csvExport = require('../utils/csvExport');
const pdfGenerator = require('../utils/pdfGenerator');
const imageUtils = require('../utils/imageUtils');
const emailNotificationService = require('../services/emailNotificationService');
const ActivityLogger = require('../services/activityLogger');

const loopController = {
  createLoop: async (req, res, next) => {
    try {
      const loopData = {
        ...req.body,
        creator_id: req.user.id
      };

      // Process uploaded images
      if (req.files && req.files.length > 0) {
        loopData.images = imageUtils.processUploadedImages(req.files);
      }

      // Validate required fields
      if (!loopData.type || !loopData.property_address) {
        return res.status(400).json({
          success: false,
          error: 'Type and property address are required'
        });
      }

      const result = loopModel.createLoop(loopData);
      const createdLoop = { ...loopData, id: result.lastInsertRowid };

      // Log the creation
      await excelLogger.log('NEW_LOOP', {
        id: result.lastInsertRowid,
        type: loopData.type,
        creator: req.user.name,
        property_address: loopData.property_address,
        timestamp: new Date().toISOString()
      });

      // Log loop creation activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.LOOP_CREATED,
        `Created new ${loopData.type} loop for ${loopData.property_address}`,
        req,
        { loopId: result.lastInsertRowid, type: loopData.type, property_address: loopData.property_address }
      );

      // Send email notification to admins
      try {
        await emailNotificationService.sendNewLoopNotification(createdLoop, req.user);
      } catch (emailError) {
        console.error('Failed to send new loop notification email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Loop created successfully',
        loopId: result.lastInsertRowid
      });
    } catch (error) {
      next(error);
    }
  },

  getLoops: (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        archived: req.query.archived === 'true' ? true : false
      };

      // If user is not admin, only show their loops
      if (req.user.role !== 'admin') {
        filters.creator_id = req.user.id;
      }

      const loops = loopModel.getAllLoops(filters);

      // Parse images for all loops
      const loopsWithImages = loops.map(loop => ({
        ...loop,
        imageList: imageUtils.parseImages(loop.images)
      }));

      res.json({
        success: true,
        loops: loopsWithImages,
        count: loopsWithImages.length
      });
    } catch (error) {
      next(error);
    }
  },

  getLoopById: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check if user has permission to view this loop
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Parse images for frontend
      const loopWithImages = {
        ...loop,
        imageList: imageUtils.parseImages(loop.images)
      };

      res.json({
        success: true,
        loop: loopWithImages
      });
    } catch (error) {
      next(error);
    }
  },

  updateLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const updateData = { ...req.body };

      // Handle image updates
      if (req.files && req.files.length > 0) {
        // If replacing images, delete old ones
        if (loop.images && req.body.replaceImages === 'true') {
          await imageUtils.deleteImages(loop.images);
        }

        // Process new images
        const newImages = imageUtils.processUploadedImages(req.files);

        if (req.body.replaceImages === 'true') {
          updateData.images = newImages;
        } else {
          // Append to existing images
          const existingImages = imageUtils.parseImages(loop.images);
          const newImagesArray = imageUtils.parseImages(newImages);
          const combinedImages = [...existingImages, ...newImagesArray];
          updateData.images = JSON.stringify(combinedImages);
        }
      }

      const result = loopModel.updateLoop(id, updateData);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found or no changes made'
        });
      }

      // Get updated loop for email notification
      const updatedLoop = loopModel.getLoopById(id);

      // Log the update
      await excelLogger.log('UPDATED_LOOP', {
        id: parseInt(id),
        updater: req.user.name,
        changes: req.body,
        timestamp: new Date().toISOString()
      });

      // Log loop update activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.LOOP_UPDATED,
        `Updated ${updatedLoop.type} loop for ${updatedLoop.property_address}`,
        req,
        { loopId: parseInt(id), changes: req.body }
      );

      // Send email notification to admins
      try {
        await emailNotificationService.sendUpdatedLoopNotification(updatedLoop, req.user, req.body);
      } catch (emailError) {
        console.error('Failed to send updated loop notification email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'Loop updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  deleteLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Only admins can delete loops
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can delete loops'
        });
      }

      // Delete associated images
      if (loop.images) {
        await imageUtils.deleteImages(loop.images);
      }

      const result = loopModel.deleteLoop(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Log the deletion
      await excelLogger.log('DELETED_LOOP', {
        id: parseInt(id),
        deleter: req.user.name,
        loop_data: loop,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Loop deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  archiveLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Only admins can archive loops
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can archive loops'
        });
      }

      const result = loopModel.archiveLoop(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Log the archival
      await excelLogger.log('ARCHIVED_LOOP', {
        id: parseInt(id),
        archiver: req.user.name,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Loop archived successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  unarchiveLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Only admins can unarchive loops
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can unarchive loops'
        });
      }

      const result = loopModel.unarchiveLoop(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Log the unarchival
      await excelLogger.log('UNARCHIVED_LOOP', {
        id: parseInt(id),
        unarchiver: req.user.name,
        timestamp: new Date().toISOString()
      });

      // Log loop unarchival activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.LOOP_UNARCHIVED || 'LOOP_UNARCHIVED',
        `Restored loop ${id} from archive`,
        req,
        { loopId: parseInt(id) }
      );

      res.json({
        success: true,
        message: 'Loop restored from archive successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  exportCSV: (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type,
        search: req.query.search
      };

      // If user is not admin, only export their loops
      if (req.user.role !== 'admin') {
        filters.creator_id = req.user.id;
      }

      const loops = loopModel.getAllLoops(filters);
      const csvContent = csvExport.generateCSV(loops);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=loops.csv');
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  },

  exportPDF: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const pdfBuffer = await pdfGenerator.generatePDF(loop);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=loop-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },

  getClosingLoops: (req, res, next) => {
    try {
      const closingLoops = loopModel.getClosingLoops();

      res.json({
        success: true,
        loops: closingLoops,
        count: closingLoops.length
      });
    } catch (error) {
      next(error);
    }
  },

  getDashboardStats: (req, res, next) => {
    try {
      const stats = loopModel.getLoopStats();
      const closingLoops = loopModel.getClosingLoops();

      res.json({
        success: true,
        stats: {
          ...stats,
          closing_soon: closingLoops.length
        }
      });
    } catch (error) {
      next(error);
    }
  },



  deleteLoopImage: async (req, res, next) => {
    try {
      const { id, filename } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (!loop.images) {
        return res.status(404).json({
          success: false,
          error: 'No images found for this loop'
        });
      }

      const images = imageUtils.parseImages(loop.images);
      const imageToDelete = images.find(img => img.filename === filename);

      if (!imageToDelete) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      // Remove image from filesystem
      const imagePath = imageUtils.getImagePath(filename);
      await imageUtils.deleteImages(JSON.stringify([imageToDelete]));

      // Update database
      const updatedImages = images.filter(img => img.filename !== filename);
      const updateData = {
        ...loop,
        images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : null
      };

      loopModel.updateLoop(id, updateData);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = loopController;
