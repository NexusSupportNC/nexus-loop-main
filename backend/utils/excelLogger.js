const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const logFilePath = './logs/loop-log.xlsx';

// Ensure logs directory exists
const ensureLogsDirectory = () => {
  const logsDir = path.dirname(logFilePath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

const excelLogger = {
  log: async (action, details) => {
    try {
      ensureLogsDirectory();

      const workbook = new ExcelJS.Workbook();
      let worksheet;

      // Try to read existing file
      try {
        await workbook.xlsx.readFile(logFilePath);
        worksheet = workbook.getWorksheet('Activity Log');
      } catch (error) {
        // File doesn't exist, create new workbook
        worksheet = workbook.addWorksheet('Activity Log');
      }

      // Add headers if worksheet is empty
      if (!worksheet || worksheet.rowCount === 0) {
        worksheet = workbook.addWorksheet('Activity Log');
        const headerRow = worksheet.addRow([
          'Timestamp',
          'Action',
          'Loop ID',
          'User',
          'Details'
        ]);
        
        // Style the header row
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        });
      }

      // Add the log entry
      const newRow = worksheet.addRow([
        details.timestamp || new Date().toISOString(),
        action,
        details.id || 'N/A',
        details.creator || details.updater || details.deleter || details.archiver || 'System',
        JSON.stringify(details, null, 2)
      ]);

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // Cap at 50 characters
      });

      // Save the file
      await workbook.xlsx.writeFile(logFilePath);
      console.log(`Activity logged: ${action} for Loop ID: ${details.id}`);
    } catch (error) {
      console.error('Excel logging error:', error);
      // Don't throw error to prevent breaking the main functionality
    }
  },

  getActivityLog: async () => {
    try {
      ensureLogsDirectory();
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(logFilePath);
      const worksheet = workbook.getWorksheet('Activity Log');
      
      if (!worksheet) {
        return [];
      }

      const activities = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          activities.push({
            timestamp: row.getCell(1).value,
            action: row.getCell(2).value,
            loopId: row.getCell(3).value,
            user: row.getCell(4).value,
            details: row.getCell(5).value
          });
        }
      });

      return activities.reverse(); // Most recent first
    } catch (error) {
      console.error('Error reading activity log:', error);
      return [];
    }
  }
};

module.exports = excelLogger;
