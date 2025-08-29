const db = require('../database/config');

// Create loop_documents table
db.prepare(`
  CREATE TABLE IF NOT EXISTS loop_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loop_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER,
    mimetype TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loop_id) REFERENCES loops (id),
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
  )
`).run();

module.exports = {
  listByLoop: (loopId) => {
    return db.prepare(`SELECT * FROM loop_documents WHERE loop_id = ? ORDER BY created_at DESC`).all(loopId);
  },
  addDocument: (loopId, file, userId) => {
    const stmt = db.prepare(`
      INSERT INTO loop_documents (loop_id, filename, original_name, size, mimetype, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(loopId, file.filename, file.originalname, file.size, file.mimetype, userId);
  },
  deleteDocument: (id) => {
    return db.prepare(`DELETE FROM loop_documents WHERE id = ?`).run(id);
  },
  getById: (id) => {
    return db.prepare(`SELECT * FROM loop_documents WHERE id = ?`).get(id);
  }
};
