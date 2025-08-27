const fs = require('fs-extra');
const path = require('path');
const documentTemplateModel = require('../models/documentTemplateModel');
const loopModel = require('../models/loopModel');

class DocumentGenerationService {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'uploads', 'generated');
    fs.ensureDirSync(this.outputDir);
  }

  /**
   * Generate a document from a template and loop data
   * @param {number} templateId - The template ID
   * @param {number} loopId - The loop ID to get data from
   * @param {number} userId - The user generating the document
   * @returns {Object} Generated document info
   */
  async generateDocument(templateId, loopId, userId) {
    try {
      // Get template and loop data
      const template = documentTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const loop = loopModel.getLoopById(loopId);
      if (!loop) {
        throw new Error('Loop not found');
      }

      // Parse field mappings
      const fieldMappings = template.field_mappings ? JSON.parse(template.field_mappings) : [];
      
      if (fieldMappings.length === 0) {
        throw new Error('Template has no field mappings defined');
      }

      // Check if template file exists
      if (!await fs.pathExists(template.file_path)) {
        throw new Error('Template file not found');
      }

      // Generate output filename
      const timestamp = Date.now();
      const outputFileName = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${loop.id}_${timestamp}.${template.file_type}`;
      const outputPath = path.join(this.outputDir, outputFileName);

      if (template.file_type === 'pdf') {
        return await this.generatePDFDocument(template, loop, fieldMappings, outputPath);
      } else {
        // For Word documents, we'll do simple text replacement for now
        return await this.generateWordDocument(template, loop, fieldMappings, outputPath);
      }
    } catch (error) {
      console.error('Document generation error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF document with field replacement
   * For now, this is a placeholder - in production you'd use libraries like pdf-lib
   */
  async generatePDFDocument(template, loop, fieldMappings, outputPath) {
    // For now, copy the template and return it
    // In production, you would use pdf-lib or similar to fill form fields
    await fs.copy(template.file_path, outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: path.basename(outputPath),
      fileType: 'pdf',
      generatedAt: new Date().toISOString(),
      templateName: template.name,
      loopId: loop.id,
      message: 'PDF generated (template copied - field replacement requires pdf-lib library)'
    };
  }

  /**
   * Generate Word document with field replacement
   * For simple text replacement in document content
   */
  async generateWordDocument(template, loop, fieldMappings, outputPath) {
    try {
      // Read the template file
      let content = await fs.readFile(template.file_path, 'utf8');
      
      // Replace mapped fields with actual data
      fieldMappings.forEach(mapping => {
        const placeholder = new RegExp(`{{${mapping.name}}}`, 'g');
        const value = this.getLoopFieldValue(loop, mapping.loopField, mapping.type);
        content = content.replace(placeholder, value);
      });

      // Write the generated document
      await fs.writeFile(outputPath, content);

      return {
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
        fileType: template.file_type,
        generatedAt: new Date().toISOString(),
        templateName: template.name,
        loopId: loop.id,
        fieldsReplaced: fieldMappings.length
      };
    } catch (error) {
      // If text replacement fails, fall back to copying template
      await fs.copy(template.file_path, outputPath);
      
      return {
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
        fileType: template.file_type,
        generatedAt: new Date().toISOString(),
        templateName: template.name,
        loopId: loop.id,
        message: 'Document generated (template copied - field replacement failed)'
      };
    }
  }

  /**
   * Get formatted value from loop data based on field type
   */
  getLoopFieldValue(loop, fieldName, fieldType) {
    let value = loop[fieldName] || '';

    switch (fieldType) {
      case 'currency':
        return value ? `$${parseFloat(value).toLocaleString()}` : '$0';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'number':
        return value ? parseFloat(value).toString() : '0';
      default:
        return value.toString();
    }
  }

  /**
   * Get list of generated documents for a loop
   */
  async getGeneratedDocumentsForLoop(loopId) {
    const files = await fs.readdir(this.outputDir);
    const loopFiles = files.filter(file => file.includes(`_${loopId}_`));
    
    return Promise.all(loopFiles.map(async (fileName) => {
      const filePath = path.join(this.outputDir, fileName);
      const stats = await fs.stat(filePath);
      
      return {
        fileName,
        filePath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    }));
  }

  /**
   * Delete a generated document
   */
  async deleteGeneratedDocument(fileName) {
    const filePath = path.join(this.outputDir, fileName);
    if (await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  }
}

module.exports = new DocumentGenerationService();
