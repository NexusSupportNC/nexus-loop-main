const csvExport = {
  generateCSV: (loops) => {
    if (!loops || loops.length === 0) {
      return 'No data available';
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Type',
      'Property Address',
      'Client Name',
      'Client Email',
      'Client Phone',
      'Sale Amount',
      'Status',
      'Start Date',
      'End Date',
      'Creator',
      'Created At',
      'Updated At',
      'Tags',
      'Notes'
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      
      // If the value contains comma, newline, or double quote, wrap in quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        // Escape existing double quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };

    // Create header row
    const csvRows = [headers.join(',')];

    // Add data rows
    loops.forEach(loop => {
      const row = [
        escapeCSV(loop.id),
        escapeCSV(loop.type),
        escapeCSV(loop.property_address),
        escapeCSV(loop.client_name),
        escapeCSV(loop.client_email),
        escapeCSV(loop.client_phone),
        escapeCSV(loop.sale),
        escapeCSV(loop.status),
        escapeCSV(loop.start_date),
        escapeCSV(loop.end_date),
        escapeCSV(loop.creator_name),
        escapeCSV(loop.created_at),
        escapeCSV(loop.updated_at),
        escapeCSV(loop.tags),
        escapeCSV(loop.notes)
      ];
      
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  },

  generateStatsCSV: (stats) => {
    const headers = ['Metric', 'Value'];
    const csvRows = [headers.join(',')];

    // Add stats data
    const statsData = [
      ['Total Loops', stats.total || 0],
      ['Active Loops', stats.active || 0],
      ['Closing Loops', stats.closing || 0],
      ['Closed Loops', stats.closed || 0],
      ['Total Sales Amount', stats.total_sales || 0],
      ['Loops Closing Soon', stats.closing_soon || 0]
    ];

    statsData.forEach(([metric, value]) => {
      csvRows.push(`"${metric}","${value}"`);
    });

    return csvRows.join('\n');
  }
};

module.exports = csvExport;
