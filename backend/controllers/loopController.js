const loopModel = require('../models/loopModel');
const excelLogger = require('../utils/excelLogger');
const csvExport = require('../utils/csvExport');
const pdfGenerator = require('../utils/pdfGenerator');
const imageUtils = require('../utils/imageUtils');
const emailNotificationService = require('../services/emailNotificationService');
const ActivityLogger = require('../services/activityLogger');
const db = require('../database/config');

const loopDocumentModel = require('../models/loopDocumentModel');
const loopTaskModel = require('../models/loopTaskModel');

const loopController = {
  createLoop: async (req, res, next) => {
    try {
      const loopData = {
        ...req.body,
        creator_id: req.user.id
      };

      if (loopData.details && typeof loopData.details !== 'string') {
        loopData.details = JSON.stringify(loopData.details);
      }

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
        archived: req.query.archived === 'true' ? true : false,
        end_month: req.query.end_month
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
      if (updateData.details && typeof updateData.details !== 'string') {
        updateData.details = JSON.stringify(updateData.details);
      }

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

      // Merge with existing loop values to support partial updates and preserve NOT NULL fields
      const mergedData = {
        type: typeof updateData.type !== 'undefined' ? updateData.type : loop.type,
        sale: typeof updateData.sale !== 'undefined' ? updateData.sale : loop.sale,
        start_date: typeof updateData.start_date !== 'undefined' ? updateData.start_date : loop.start_date,
        end_date: typeof updateData.end_date !== 'undefined' ? updateData.end_date : loop.end_date,
        tags: typeof updateData.tags !== 'undefined' ? updateData.tags : loop.tags,
        status: typeof updateData.status !== 'undefined' ? updateData.status : loop.status,
        property_address: typeof updateData.property_address !== 'undefined' ? updateData.property_address : loop.property_address,
        client_name: typeof updateData.client_name !== 'undefined' ? updateData.client_name : loop.client_name,
        client_email: typeof updateData.client_email !== 'undefined' ? updateData.client_email : loop.client_email,
        client_phone: typeof updateData.client_phone !== 'undefined' ? updateData.client_phone : loop.client_phone,
        notes: typeof updateData.notes !== 'undefined' ? updateData.notes : loop.notes,
        images: typeof updateData.images !== 'undefined' ? updateData.images : loop.images,
        participants: typeof updateData.participants !== 'undefined' ? updateData.participants : loop.participants,
        details: typeof updateData.details !== 'undefined' ? updateData.details : loop.details
      };

      const result = loopModel.updateLoop(id, mergedData);

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

  // Documents
  listDocuments: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const docs = loopDocumentModel.listByLoop(id);
      res.json({ success: true, documents: docs });
    } catch (error) { next(error); }
  },

  uploadDocuments: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const files = req.files || [];
      for (const file of files) {
        loopDocumentModel.addDocument(parseInt(id), file, req.user.id);
      }
      ActivityLogger.log(req.user.id, 'DOCUMENT_UPLOADED', `Uploaded ${files.length} document(s) to loop ${id}` , req, { loopId: parseInt(id), count: files.length });
      res.json({ success: true, message: 'Documents uploaded', uploaded: files.length });
    } catch (error) { next(error); }
  },

  deleteDocument: (req, res, next) => {
    try {
      const { id, docId } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const doc = loopDocumentModel.getById(docId);
      if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
      loopDocumentModel.deleteDocument(docId);
      ActivityLogger.log(req.user.id, 'DOCUMENT_DELETED', `Deleted document ${docId} from loop ${id}` , req, { loopId: parseInt(id), docId: parseInt(docId) });
      res.json({ success: true, message: 'Document deleted' });
    } catch (error) { next(error); }
  },

  // Tasks
  listTasks: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const tasks = loopTaskModel.listByLoop(id);
      res.json({ success: true, tasks });
    } catch (error) { next(error); }
  },

  addTask: (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, due_date } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ success: false, error: 'Task title is required' });
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const r = loopTaskModel.addTask(parseInt(id), title.trim(), due_date || null, req.user.id);
      ActivityLogger.log(req.user.id, 'TASK_CREATED', `Created task in loop ${id}: ${title.trim()}`, req, { loopId: parseInt(id), title: title.trim(), due_date: due_date || null });
      res.status(201).json({ success: true, taskId: r.lastInsertRowid });
    } catch (error) { next(error); }
  },

  updateTask: (req, res, next) => {
    try {
      const { id, taskId } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const payload = { title: req.body.title, due_date: req.body.due_date, completed: req.body.completed };
      loopTaskModel.updateTask(taskId, payload);
      ActivityLogger.log(req.user.id, 'TASK_UPDATED', `Updated task ${taskId} in loop ${id}`, req, { loopId: parseInt(id), taskId: parseInt(taskId), changes: payload });
      res.json({ success: true, message: 'Task updated' });
    } catch (error) { next(error); }
  },

  deleteTask: (req, res, next) => {
    try {
      const { id, taskId } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      loopTaskModel.deleteTask(taskId);
      ActivityLogger.log(req.user.id, 'TASK_DELETED', `Deleted task ${taskId} in loop ${id}`, req, { loopId: parseInt(id), taskId: parseInt(taskId) });
      res.json({ success: true, message: 'Task deleted' });
    } catch (error) { next(error); }
  },

  // Compliance
  requestComplianceReview: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      db.prepare(`UPDATE loops SET compliance_status = 'pending', compliance_requested_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
      ActivityLogger.log(req.user.id, 'COMPLIANCE_REQUESTED', `Requested compliance review for loop ${id}`, req, { loopId: parseInt(id) });
      res.json({ success: true, message: 'Compliance review requested' });
    } catch (error) { next(error); }
  },

  approveCompliance: (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Only admins can approve compliance' });
      const { id } = req.params;
      db.prepare(`UPDATE loops SET compliance_status = 'approved', compliance_reviewed_at = CURRENT_TIMESTAMP, compliance_reviewer_id = ? WHERE id = ?`).run(req.user.id, id);
      ActivityLogger.log(req.user.id, 'COMPLIANCE_APPROVED', `Approved compliance for loop ${id}`, req, { loopId: parseInt(id) });
      res.json({ success: true, message: 'Compliance approved' });
    } catch (error) { next(error); }
  },

  denyCompliance: (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Only admins can deny compliance' });
      const { id } = req.params;
      db.prepare(`UPDATE loops SET compliance_status = 'denied', compliance_reviewed_at = CURRENT_TIMESTAMP, compliance_reviewer_id = ? WHERE id = ?`).run(req.user.id, id);
      ActivityLogger.log(req.user.id, 'COMPLIANCE_DENIED', `Denied compliance for loop ${id}`, req, { loopId: parseInt(id) });
      res.json({ success: true, message: 'Compliance denied' });
    } catch (error) { next(error); }
  },

  // Loop activity for creators/admins
  getLoopActivity: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);
      if (!loop) return res.status(404).json({ success: false, error: 'Loop not found' });
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const ActivityLoggerService = require('../services/activityLogger');
      const logs = ActivityLoggerService.getActivityLogs({ loopId: parseInt(id), limit: 100 });
      res.json({ success: true, logs, count: logs.length });
    } catch (error) { next(error); }
  },

  getClosingLoops: (req, res, next) => {
    try {
      // For non-admin users, only show their own loops
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const closingLoops = loopModel.getClosingLoops(userId);

      res.json({
        success: true,
        loops: closingLoops,
        count: closingLoops.length
      });
    } catch (error) {
      next(error);
    }
  },

  getOverdueLoops: (req, res, next) => {
    try {
      // For non-admin users, only show their own loops
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const overdueLoops = loopModel.getOverdueLoops(userId);

      res.json({
        success: true,
        loops: overdueLoops,
        count: overdueLoops.length
      });
    } catch (error) {
      next(error);
    }
  },

  getDashboardStats: (req, res, next) => {
    try {
      const stats = loopModel.getLoopStats();
      // For non-admin users, only show their own loops in stats
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const closingLoops = loopModel.getClosingLoops(userId);

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
