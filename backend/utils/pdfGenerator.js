const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs');
const imageUtils = require('./imageUtils');

const pdfGenerator = {
  generatePDF: async (loop) => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set up fonts and colors
      const primaryColor = [0, 123, 255]; // Blue
      const textColor = [51, 51, 51]; // Dark gray
      const lightGray = [128, 128, 128];
      
      let yPosition = 20;
      const leftMargin = 20;
      const rightMargin = 190;
      
      // Helper function to add text with word wrapping
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text || '', maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Real Estate Transaction Loop', leftMargin, 20);
      
      // Reset text color
      doc.setTextColor(...textColor);
      yPosition = 45;
      
      // Loop ID and Status
      doc.setFontSize(16);
      doc.text(`Loop #${loop.id}`, leftMargin, yPosition);
      
      // Status badge
      const statusColors = {
        'active': [40, 167, 69],
        'closing': [255, 193, 7],
        'closed': [108, 117, 125],
        'cancelled': [220, 53, 69]
      };
      
      const statusColor = statusColors[loop.status] || [108, 117, 125];
      doc.setFillColor(...statusColor);
      doc.roundedRect(rightMargin - 30, yPosition - 8, 25, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(loop.status.toUpperCase(), rightMargin - 27, yPosition - 2);
      
      doc.setTextColor(...textColor);
      yPosition += 20;
      
      // Property Information Section
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text('Property Information', leftMargin, yPosition);
      yPosition += 10;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      
      // Property details
      const propertyInfo = [
        ['Type:', loop.type || 'N/A'],
        ['Address:', loop.property_address || 'N/A'],
        ['Sale Amount:', loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A']
      ];
      
      propertyInfo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, leftMargin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition = addWrappedText(value, leftMargin + 35, yPosition, 120);
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // Client Information Section
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text('Client Information', leftMargin, yPosition);
      yPosition += 10;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      
      const clientInfo = [
        ['Name:', loop.client_name || 'N/A'],
        ['Email:', loop.client_email || 'N/A'],
        ['Phone:', loop.client_phone || 'N/A']
      ];
      
      clientInfo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, leftMargin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition = addWrappedText(value, leftMargin + 25, yPosition, 130);
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // Timeline Section
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text('Timeline', leftMargin, yPosition);
      yPosition += 10;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      
      const timelineInfo = [
        ['Start Date:', loop.start_date || 'N/A'],
        ['End Date:', loop.end_date || 'N/A'],
        ['Created:', new Date(loop.created_at).toLocaleDateString()],
        ['Last Updated:', new Date(loop.updated_at).toLocaleDateString()],
        ['Creator:', loop.creator_name || 'N/A']
      ];
      
      timelineInfo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, leftMargin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition = addWrappedText(value, leftMargin + 35, yPosition, 120);
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // Tags Section
      if (loop.tags) {
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('Tags', leftMargin, yPosition);
        yPosition += 10;
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        yPosition = addWrappedText(loop.tags, leftMargin, yPosition, 150);
        yPosition += 15;
      }
      
      // Notes Section
      if (loop.notes) {
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('Notes', leftMargin, yPosition);
        yPosition += 10;

        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        yPosition = addWrappedText(loop.notes, leftMargin, yPosition, 150);
        yPosition += 15;
      }

      // Images Section
      if (loop.images) {
        try {
          const images = imageUtils.parseImages(loop.images);
          if (images.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text('Property Images', leftMargin, yPosition);
            yPosition += 15;

            let imagesPerRow = 2;
            let imageWidth = 70;
            let imageHeight = 50;

            for (let i = 0; i < images.length && i < 6; i++) { // Limit to 6 images
              const image = images[i];
              const imagePath = imageUtils.getImagePath(image.filename);

              if (fs.existsSync(imagePath)) {
                try {
                  // Read image as base64
                  const imageBuffer = fs.readFileSync(imagePath);

                  // Detect image format from file extension or mimetype
                  let imageFormat = 'JPEG';
                  const ext = path.extname(image.filename).toLowerCase();
                  if (ext === '.png' || image.mimetype === 'image/png') {
                    imageFormat = 'PNG';
                  } else if (ext === '.gif' || image.mimetype === 'image/gif') {
                    imageFormat = 'GIF';
                  }

                  const base64 = imageBuffer.toString('base64');

                  // Calculate position
                  const col = i % imagesPerRow;
                  const row = Math.floor(i / imagesPerRow);
                  const x = leftMargin + (col * (imageWidth + 10));
                  const y = yPosition + (row * (imageHeight + 15));

                  // Check if we need a new page
                  if (y + imageHeight > 270) {
                    doc.addPage();
                    yPosition = 20;
                    const newY = yPosition + (row * (imageHeight + 15));
                    doc.addImage(base64, imageFormat, x, newY, imageWidth, imageHeight);

                    // Add image caption
                    doc.setFontSize(8);
                    doc.setTextColor(...lightGray);
                    doc.text(image.originalName || `Image ${i + 1}`, x, newY + imageHeight + 8);
                  } else {
                    doc.addImage(base64, imageFormat, x, y, imageWidth, imageHeight);

                    // Add image caption
                    doc.setFontSize(8);
                    doc.setTextColor(...lightGray);
                    doc.text(image.originalName || `Image ${i + 1}`, x, y + imageHeight + 8);
                  }
                } catch (imageError) {
                  console.error(`Error processing image ${image.filename}:`, imageError);
                }
              }
            }

            // Update yPosition to after images
            const rows = Math.ceil(Math.min(images.length, 6) / imagesPerRow);
            yPosition += (rows * (imageHeight + 15)) + 10;
          }
        } catch (imagesError) {
          console.error('Error processing images for PDF:', imagesError);
        }
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setTextColor(...lightGray);
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()}`, leftMargin, pageHeight - 10);
      doc.text('Real Estate Transaction Management System', rightMargin - 60, pageHeight - 10);
      
      // Return PDF as buffer
      return Buffer.from(doc.output('arraybuffer'));
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  generateLoopListPDF: async (loops, title = 'Loop Report') => {
    try {
      const doc = new jsPDF();
      const primaryColor = [0, 123, 255];
      const textColor = [51, 51, 51];
      
      let yPosition = 20;
      const leftMargin = 20;
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(title, leftMargin, 20);
      
      doc.setTextColor(...textColor);
      yPosition = 45;
      
      // Table headers
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      const headers = ['ID', 'Type', 'Property', 'Status', 'Sale', 'Creator'];
      const colWidths = [15, 25, 60, 20, 25, 35];
      let xPosition = leftMargin;
      
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      
      yPosition += 10;
      doc.setFont(undefined, 'normal');
      
      // Table data
      loops.forEach((loop) => {
        if (yPosition > 270) { // New page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        xPosition = leftMargin;
        const rowData = [
          loop.id.toString(),
          loop.type || '',
          (loop.property_address || '').substring(0, 25),
          loop.status || '',
          loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : '',
          (loop.creator_name || '').substring(0, 15)
        ];
        
        rowData.forEach((data, index) => {
          doc.text(data, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        
        yPosition += 8;
      });
      
      return Buffer.from(doc.output('arraybuffer'));
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF list');
    }
  }
};

module.exports = pdfGenerator;
