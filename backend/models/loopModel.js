const db = require('../database/config');

// Create loops table
db.prepare(`
  CREATE TABLE IF NOT EXISTS loops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    sale REAL,
    creator_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATE,
    end_date DATE,
    tags TEXT,
    status TEXT DEFAULT 'active',
    property_address TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    notes TEXT,
    images TEXT,
    archived BOOLEAN DEFAULT 0,
    FOREIGN KEY (creator_id) REFERENCES users (id)
  )
`).run();

// Migration: Add images column if it doesn't exist
try {
  // Check if images column exists
  const tableInfo = db.prepare("PRAGMA table_info(loops)").all();
  console.log('Current loops table columns:', tableInfo.map(col => col.name));
  const hasImagesColumn = tableInfo.some(column => column.name === 'images');

  if (!hasImagesColumn) {
    console.log('Adding images column to loops table...');
    db.prepare('ALTER TABLE loops ADD COLUMN images TEXT').run();
    console.log('Images column added successfully');
  } else {
    console.log('Images column already exists in loops table');
  }
} catch (error) {
  console.error('Error during migration:', error);
  // If migration fails, try again
  try {
    console.log('Attempting to add images column with ALTER TABLE...');
    db.prepare('ALTER TABLE loops ADD COLUMN images TEXT').run();
    console.log('Images column added on retry');
  } catch (retryError) {
    console.error('Retry failed:', retryError);
  }
}

module.exports = {
  createLoop: (loopData) => {
    const stmt = db.prepare(`
      INSERT INTO loops (
        type, sale, creator_id, start_date, end_date, tags, status,
        property_address, client_name, client_email, client_phone, notes, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      loopData.type,
      loopData.sale,
      loopData.creator_id,
      loopData.start_date,
      loopData.end_date,
      loopData.tags,
      loopData.status || 'active',
      loopData.property_address,
      loopData.client_name,
      loopData.client_email,
      loopData.client_phone,
      loopData.notes,
      loopData.images
    );
  },

  getAllLoops: (filters = {}) => {
    let query = `
      SELECT l.*, u.name as creator_name
      FROM loops l
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE l.archived = ?
    `;
    const params = [filters.archived ? 1 : 0];

    if (filters.status) {
      query += ' AND l.status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND l.type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      query += ' AND (l.property_address LIKE ? OR l.client_name LIKE ? OR l.tags LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.creator_id) {
      query += ' AND l.creator_id = ?';
      params.push(filters.creator_id);
    }

    // Handle sorting
    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order || 'desc';

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['created_at', 'updated_at', 'end_date', 'sale', 'status', 'type'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    query += ` ORDER BY l.${validSortField} ${validSortOrder.toUpperCase()}`;

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params);
  },

  getLoopById: (id) => {
    return db.prepare(`
      SELECT l.*, u.name as creator_name 
      FROM loops l 
      LEFT JOIN users u ON l.creator_id = u.id 
      WHERE l.id = ?
    `).get(id);
  },

  updateLoop: (id, loopData) => {
    const stmt = db.prepare(`
      UPDATE loops SET
        type = ?, sale = ?, start_date = ?, end_date = ?, tags = ?,
        status = ?, property_address = ?, client_name = ?, client_email = ?,
        client_phone = ?, notes = ?, images = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      loopData.type,
      loopData.sale,
      loopData.start_date,
      loopData.end_date,
      loopData.tags,
      loopData.status,
      loopData.property_address,
      loopData.client_name,
      loopData.client_email,
      loopData.client_phone,
      loopData.notes,
      loopData.images,
      id
    );
  },

  deleteLoop: (id) => {
    return db.prepare('DELETE FROM loops WHERE id = ?').run(id);
  },

  archiveLoop: (id) => {
    return db.prepare('UPDATE loops SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  unarchiveLoop: (id) => {
    return db.prepare('UPDATE loops SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  getClosingLoops: () => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return db.prepare(`
      SELECT l.*, u.name as creator_name 
      FROM loops l 
      LEFT JOIN users u ON l.creator_id = u.id 
      WHERE l.end_date BETWEEN ? AND ? 
      AND l.status IN ('active', 'closing') 
      AND l.archived = 0
    `).all(today, threeDaysFromNow);
  },

  getLoopStats: () => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'closing' THEN 1 END) as closing,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        SUM(sale) as total_sales
      FROM loops 
      WHERE archived = 0
    `).get();
    
    return stats;
  }
};
