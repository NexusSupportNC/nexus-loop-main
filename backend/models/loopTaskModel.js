const db = require('../database/config');

// Create loop_tasks table
db.prepare(`
  CREATE TABLE IF NOT EXISTS loop_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loop_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date DATE,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loop_id) REFERENCES loops (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
  )
`).run();

module.exports = {
  listByLoop: (loopId) => {
    return db.prepare(`SELECT * FROM loop_tasks WHERE loop_id = ? ORDER BY completed ASC, COALESCE(due_date, '9999-12-31') ASC, created_at DESC`).all(loopId);
  },
  addTask: (loopId, title, dueDate, userId) => {
    const stmt = db.prepare(`INSERT INTO loop_tasks (loop_id, title, due_date, created_by) VALUES (?, ?, ?, ?)`);
    return stmt.run(loopId, title, dueDate || null, userId);
  },
  updateTask: (id, data) => {
    const stmt = db.prepare(`
      UPDATE loop_tasks SET
        title = COALESCE(?, title),
        due_date = COALESCE(?, due_date),
        completed = COALESCE(?, completed),
        completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `);
    return stmt.run(data.title ?? null, data.due_date ?? null, data.completed ?? null, data.completed ?? 0, id);
  },
  deleteTask: (id) => {
    return db.prepare(`DELETE FROM loop_tasks WHERE id = ?`).run(id);
  },
  getById: (id) => {
    return db.prepare(`SELECT * FROM loop_tasks WHERE id = ?`).get(id);
  }
};
