const db = require('../database/config');
const bcrypt = require('bcryptjs');

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'agent',
    notify_on_new_loops BOOLEAN DEFAULT 1,
    notify_on_updated_loops BOOLEAN DEFAULT 1,
    suspended BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Migration: Add notification preference columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasNotifyNewLoops = tableInfo.some(column => column.name === 'notify_on_new_loops');
  const hasNotifyUpdatedLoops = tableInfo.some(column => column.name === 'notify_on_updated_loops');
  const hasSuspended = tableInfo.some(column => column.name === 'suspended');
  const hasLastActive = tableInfo.some(column => column.name === 'last_active');

  if (!hasNotifyNewLoops) {
    console.log('Adding notify_on_new_loops column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN notify_on_new_loops BOOLEAN DEFAULT 1').run();
    console.log('notify_on_new_loops column added successfully');
  }

  if (!hasNotifyUpdatedLoops) {
    console.log('Adding notify_on_updated_loops column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN notify_on_updated_loops BOOLEAN DEFAULT 1').run();
    console.log('notify_on_updated_loops column added successfully');
  }

  if (!hasSuspended) {
    console.log('Adding suspended column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN suspended BOOLEAN DEFAULT 0').run();
    console.log('suspended column added successfully');
  }

  if (!hasLastActive) {
    console.log('Adding last_active column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN last_active DATETIME').run();
    console.log('last_active column added successfully');

    // Initialize last_active for existing users
    console.log('Initializing last_active for existing users...');
    db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE last_active IS NULL').run();
    console.log('last_active initialized for existing users');
  }
} catch (error) {
  console.error('Error during user migration:', error);
}

// Insert default users if table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  // Insert admin user
  db.prepare(`
    INSERT INTO users (name, email, password, role) 
    VALUES (?, ?, ?, ?)
  `).run('Admin User', 'admin@nexusrealtync.co', hashedPassword, 'admin');
  
  // Insert agent user
  db.prepare(`
    INSERT INTO users (name, email, password, role) 
    VALUES (?, ?, ?, ?)
  `).run('Agent Smith', 'agent@nexusrealtync.co', hashedPassword, 'agent');
}

module.exports = {
  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  
  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  
  create: (userData) => {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role) 
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(userData.name, userData.email, userData.password, userData.role || 'agent');
  },
  
  getAllAgents: () => {
    return db.prepare('SELECT id, name, email FROM users WHERE role = ?').all('agent');
  },

  updateNotificationPreferences: (id, preferences) => {
    const stmt = db.prepare(`
      UPDATE users SET
        notify_on_new_loops = ?,
        notify_on_updated_loops = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(preferences.notify_on_new_loops, preferences.notify_on_updated_loops, id);
  },

  getAdminsWithNotifications: (notificationType) => {
    const column = notificationType === 'new' ? 'notify_on_new_loops' : 'notify_on_updated_loops';
    return db.prepare(`
      SELECT id, name, email FROM users
      WHERE role = 'admin' AND ${column} = 1
    `).all();
  },

  getAllUsers: () => {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  updatePassword: (id, hashedPassword) => {
    const stmt = db.prepare(`
      UPDATE users SET
        password = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(hashedPassword, id);
  },

  suspendUser: (id) => {
    const stmt = db.prepare(`
      UPDATE users SET
        suspended = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  unsuspendUser: (id) => {
    const stmt = db.prepare(`
      UPDATE users SET
        suspended = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  updateUserRole: (id, role) => {
    const stmt = db.prepare(`
      UPDATE users SET
        role = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(role, id);
  },

  updateLastActive: (id) => {
    const stmt = db.prepare(`
      UPDATE users SET
        last_active = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  searchUsers: (searchTerm = '') => {
    if (!searchTerm) {
      return db.prepare(`
        SELECT id, name, email, role, last_active, suspended, created_at
        FROM users
        ORDER BY last_active DESC NULLS LAST, name ASC
      `).all();
    }

    return db.prepare(`
      SELECT id, name, email, role, last_active, suspended, created_at
      FROM users
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY last_active DESC NULLS LAST, name ASC
    `).all(`%${searchTerm}%`, `%${searchTerm}%`);
  },

  deleteUser: (id) => {
    // Use a transaction to ensure data integrity
    const deleteTransaction = db.transaction(() => {
      // First, delete activity logs associated with this user
      db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(id);

      // Set creator_id to NULL for loops created by this user
      // This preserves the loops but removes the creator reference
      db.prepare('UPDATE loops SET creator_id = NULL WHERE creator_id = ?').run(id);

      // Set created_by to NULL for document templates created by this user
      // This preserves the templates but removes the creator reference
      db.prepare('UPDATE document_templates SET created_by = NULL WHERE created_by = ?').run(id);

      // Finally, delete the user
      const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return result;
    });

    return deleteTransaction();
  }
};
