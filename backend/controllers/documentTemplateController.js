const documentTemplateModel = require('../models/documentTemplateModel');
const ActivityLogger = require('../services/activityLogger');
const documentGenerationService = require('../services/documentGenerationService');
const fs = require('fs-extra');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'templates');
fs.ensureDirSync(uploadsDir);

const documentTemplateController = {
  // Get all document templates
  getAllTemplates: (req, res, next) => {
    try {
      const templates = documentTemplateModel.getAll();
      
      res.json({
        success: true,
        templates: templates.map(template => ({
          ...template,
          field_mappings: template.field_mappings ? JSON.parse(template.field_mappings) : []
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload a new document template
  uploadTemplate: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const { name, description, category } = req.body;

      if (!name || !category) {
        return res.status(400).json({
          success: false,
          error: 'Template name and category are required'
        });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file to disk
      await fs.writeFile(filePath, req.file.buffer);

      // Determine file type
      const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'doc';

      // Save template info to database
      const templateData = {
        name,
        description: description || '',
        category,
        file_path: filePath,
        file_name: req.file.originalname,
        file_type: fileType,
        file_size: req.file.size,
        created_by: req.user.id
      };

      const result = documentTemplateModel.create(templateData);

      // Log template upload
      ActivityLogger.log(
        req.user.id,
        'TEMPLATE_UPLOADED',
        `Uploaded document template: ${name}`,
        req,
        { 
          templateId: result.lastInsertRowid,
          templateName: name,
          fileType: fileType,
          fileSize: req.file.size
        }
      );

      res.json({
        success: true,
        message: 'Template uploaded successfully',
        template: {
          id: result.lastInsertRowid,
          ...templateData
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a document template
  deleteTemplate: async (req, res, next) => {
    try {
      const { id } = req.params;
      const template = documentTemplateModel.getById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Delete file from disk
      try {
        await fs.unlink(template.file_path);
      } catch (fileError) {
        console.error('Error deleting template file:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      const result = documentTemplateModel.delete(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Log template deletion
      ActivityLogger.log(
        req.user.id,
        'TEMPLATE_DELETED',
        `Deleted document template: ${template.name}`,
        req,
        { 
          templateId: parseInt(id),
          templateName: template.name
        }
      );

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update template field mappings
  updateTemplateFields: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fields } = req.body;

      const template = documentTemplateModel.getById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const result = documentTemplateModel.updateFieldMappings(id, fields);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to update template fields'
        });
      }

      // Log field mapping update
      ActivityLogger.log(
        req.user.id,
        'TEMPLATE_FIELDS_MAPPED',
        `Updated field mappings for template: ${template.name}`,
        req,
        { 
          templateId: parseInt(id),
          templateName: template.name,
          fieldsCount: fields.length
        }
      );

      res.json({
        success: true,
        message: 'Template fields updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get template for preview
  getTemplatePreview: async (req, res, next) => {
    try {
      const { id } = req.params;
      const template = documentTemplateModel.getById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Check if file exists
      if (!await fs.pathExists(template.file_path)) {
        return res.status(404).json({
          success: false,
          error: 'Template file not found'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', template.file_type === 'pdf' ? 'application/pdf' : 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${template.file_name}"`);

      // Stream the file
      const fileStream = fs.createReadStream(template.file_path);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  // Generate document from template
  generateDocument: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { loopId } = req.body;

      if (!loopId) {
        return res.status(400).json({
          success: false,
          error: 'Loop ID is required'
        });
      }

      const template = documentTemplateModel.getById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Generate the document
      const result = await documentGenerationService.generateDocument(
        parseInt(id),
        parseInt(loopId),
        req.user.id
      );

      // Log document generation
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.DOCUMENT_GENERATED,
        `Generated document from template: ${template.name} for loop ${loopId}`,
        req,
        {
          templateId: parseInt(id),
          templateName: template.name,
          loopId: parseInt(loopId),
          generatedFileName: result.fileName
        }
      );

      res.json({
        success: true,
        message: 'Document generated successfully',
        document: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Download generated document
  downloadGeneratedDocument: async (req, res, next) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', 'generated', fileName);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Generated document not found'
        });
      }

      // Set appropriate headers
      const fileExtension = path.extname(fileName).toLowerCase();
      const contentType = fileExtension === '.pdf' ? 'application/pdf' : 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  // Get generated documents for a loop
  getGeneratedDocuments: async (req, res, next) => {
    try {
      const { loopId } = req.params;
      const documents = await documentGenerationService.getGeneratedDocumentsForLoop(parseInt(loopId));

      res.json({
        success: true,
        documents
      });
    } catch (error) {
      next(error);
    }
  },

  // Get template statistics
  getTemplateStats: (req, res, next) => {
    try {
      const stats = documentTemplateModel.getStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = documentTemplateController;
