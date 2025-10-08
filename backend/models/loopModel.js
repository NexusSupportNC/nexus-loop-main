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
    participants TEXT,
    archived BOOLEAN DEFAULT 0,
    compliance_status TEXT DEFAULT 'none',
    compliance_requested_at DATETIME,
    compliance_reviewed_at DATETIME,
    compliance_reviewer_id INTEGER,
    FOREIGN KEY (creator_id) REFERENCES users (id),
    FOREIGN KEY (compliance_reviewer_id) REFERENCES users (id)
  )
`).run();

// Migration: Add images and participants columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(loops)").all();
  console.log('Current loops table columns:', tableInfo.map(col => col.name));
  const hasImagesColumn = tableInfo.some(column => column.name === 'images');
  const hasParticipantsColumn = tableInfo.some(column => column.name === 'participants');

  if (!hasImagesColumn) {
    console.log('Adding images column to loops table...');
    db.prepare('ALTER TABLE loops ADD COLUMN images TEXT').run();
    console.log('Images column added successfully');
  } else {
    console.log('Images column already exists in loops table');
  }

  if (!hasParticipantsColumn) {
    console.log('Adding participants column to loops table...');
    db.prepare('ALTER TABLE loops ADD COLUMN participants TEXT').run();
    console.log('Participants column added successfully');
  } else {
    console.log('Participants column already exists in loops table');
  }

  // Compliance columns
  const hasComplianceStatus = tableInfo.some(column => column.name === 'compliance_status');
  if (!hasComplianceStatus) {
    console.log('Adding compliance columns to loops table...');
    db.prepare("ALTER TABLE loops ADD COLUMN compliance_status TEXT DEFAULT 'none'").run();
    db.prepare('ALTER TABLE loops ADD COLUMN compliance_requested_at DATETIME').run();
    db.prepare('ALTER TABLE loops ADD COLUMN compliance_reviewed_at DATETIME').run();
    db.prepare('ALTER TABLE loops ADD COLUMN compliance_reviewer_id INTEGER').run();
    console.log('Compliance columns added successfully');
  }

  // Details JSON column
  const hasDetailsColumn = tableInfo.some(column => column.name === 'details');
  if (!hasDetailsColumn) {
    console.log('Adding details column to loops table...');
    db.prepare('ALTER TABLE loops ADD COLUMN details TEXT').run();
    console.log('Details column added successfully');
  }
} catch (error) {
  console.error('Error during migration:', error);
  // Attempt to add columns individually
  try { db.prepare('ALTER TABLE loops ADD COLUMN images TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE loops ADD COLUMN participants TEXT').run(); } catch (e) {}
  try { db.prepare("ALTER TABLE loops ADD COLUMN compliance_status TEXT DEFAULT 'none'").run(); } catch (e) {}
  try { db.prepare('ALTER TABLE loops ADD COLUMN compliance_requested_at DATETIME').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE loops ADD COLUMN compliance_reviewed_at DATETIME').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE loops ADD COLUMN compliance_reviewer_id INTEGER').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE loops ADD COLUMN details TEXT').run(); } catch (e) {}
}

module.exports = {
  createLoop: (loopData) => {
    const stmt = db.prepare(`
      INSERT INTO loops (
        type, sale, creator_id, start_date, end_date, tags, status,
        property_address, client_name, client_email, client_phone, notes, images, participants, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      loopData.images,
      loopData.participants,
      loopData.details || null
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

    if (filters.end_month === 'current') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query += ' AND l.end_date BETWEEN ? AND ?';
      params.push(firstDay, lastDay);
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
        client_phone = ?, notes = ?, images = ?, participants = ?, details = ?, updated_at = CURRENT_TIMESTAMP
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
      loopData.participants,
      loopData.details || null,
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

  getClosingLoops: (userId = null) => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT l.*, u.name as creator_name
      FROM loops l
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE l.end_date BETWEEN ? AND ?
      AND l.status IN ('active', 'closing')
      AND l.archived = 0
    `;

    let params = [today, threeDaysFromNow];

    if (userId) {
      query += ' AND l.creator_id = ?';
      params.push(userId);
    }

    return db.prepare(query).all(...params);
  },

  getOverdueLoops: (userId = null) => {
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT l.*, u.name as creator_name
      FROM loops l
      LEFT JOIN users u ON l.creator_id = u.id
      WHERE l.end_date < ?
      AND l.status IN ('active', 'closing')
      AND l.archived = 0
    `;

    let params = [today];

    if (userId) {
      query += ' AND l.creator_id = ?';
      params.push(userId);
    }

    return db.prepare(query).all(...params);
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
