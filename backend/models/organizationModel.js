const db = require('../database/config');

// Create organizations table
db.prepare(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )
`).run();

// Create user-organization relationship table (many-to-many)
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users (id),
    UNIQUE(user_id, organization_id)
  )
`).run();

console.log('Organizations and user_organizations tables initialized');

module.exports = {
  // Organization CRUD operations
  create: (orgData) => {
    const stmt = db.prepare(`
      INSERT INTO organizations (name, description, created_by) 
      VALUES (?, ?, ?)
    `);
    return stmt.run(orgData.name, orgData.description, orgData.created_by);
  },

  findById: (id) => {
    return db.prepare(`
      SELECT o.*, u.name as creator_name
      FROM organizations o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?
    `).get(id);
  },

  findAll: () => {
    return db.prepare(`
      SELECT o.*, u.name as creator_name,
             COUNT(uo.user_id) as member_count
      FROM organizations o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN user_organizations uo ON o.id = uo.organization_id
      GROUP BY o.id
      ORDER BY o.name ASC
    `).all();
  },

  update: (id, orgData) => {
    const stmt = db.prepare(`
      UPDATE organizations SET
        name = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(orgData.name, orgData.description, id);
  },

  delete: (id) => {
    // Use a transaction to ensure data integrity
    const deleteTransaction = db.transaction(() => {
      // First, remove all user assignments
      db.prepare('DELETE FROM user_organizations WHERE organization_id = ?').run(id);
      
      // Then delete the organization
      const result = db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
      return result;
    });

    return deleteTransaction();
  },

  // User-Organization relationship operations
  addUserToOrganization: (userId, organizationId, assignedBy) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_organizations (user_id, organization_id, assigned_by) 
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, organizationId, assignedBy);
  },

  removeUserFromOrganization: (userId, organizationId) => {
    const stmt = db.prepare(`
      DELETE FROM user_organizations 
      WHERE user_id = ? AND organization_id = ?
    `);
    return stmt.run(userId, organizationId);
  },

  getUsersInOrganization: (organizationId) => {
    return db.prepare(`
      SELECT u.id, u.name, u.email, u.role,
             uo.assigned_at, uo.assigned_by,
             assigner.name as assigned_by_name
      FROM user_organizations uo
      JOIN users u ON uo.user_id = u.id
      LEFT JOIN users assigner ON uo.assigned_by = assigner.id
      WHERE uo.organization_id = ?
      ORDER BY u.name ASC
    `).all(organizationId);
  },

  getOrganizationsForUser: (userId) => {
    return db.prepare(`
      SELECT o.id, o.name, o.description,
             uo.assigned_at, uo.assigned_by,
             assigner.name as assigned_by_name
      FROM user_organizations uo
      JOIN organizations o ON uo.organization_id = o.id
      LEFT JOIN users assigner ON uo.assigned_by = assigner.id
      WHERE uo.user_id = ?
      ORDER BY o.name ASC
    `).all(userId);
  },

  getUsersWithOrganizations: () => {
    return db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.last_active, u.suspended, u.created_at,
             GROUP_CONCAT(o.name) as organizations,
             GROUP_CONCAT(o.id) as organization_ids
      FROM users u
      LEFT JOIN user_organizations uo ON u.id = uo.user_id
      LEFT JOIN organizations o ON uo.organization_id = o.id
      GROUP BY u.id
      ORDER BY u.last_active DESC NULLS LAST, u.name ASC
    `).all();
  },

  searchUsersWithOrganizations: (searchTerm = '') => {
    if (!searchTerm) {
      return db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.last_active, u.suspended, u.created_at,
               GROUP_CONCAT(o.name) as organizations,
               GROUP_CONCAT(o.id) as organization_ids
        FROM users u
        LEFT JOIN user_organizations uo ON u.id = uo.user_id
        LEFT JOIN organizations o ON uo.organization_id = o.id
        GROUP BY u.id
        ORDER BY u.last_active DESC NULLS LAST, u.name ASC
      `).all();
    }

    return db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.last_active, u.suspended, u.created_at,
             GROUP_CONCAT(o.name) as organizations,
             GROUP_CONCAT(o.id) as organization_ids
      FROM users u
      LEFT JOIN user_organizations uo ON u.id = uo.user_id
      LEFT JOIN organizations o ON uo.organization_id = o.id
      WHERE u.name LIKE ? OR u.email LIKE ?
      GROUP BY u.id
      ORDER BY u.last_active DESC NULLS LAST, u.name ASC
    `).all(`%${searchTerm}%`, `%${searchTerm}%`);
  },

  getAvailableUsers: (organizationId) => {
    return db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE id NOT IN (
        SELECT user_id
        FROM user_organizations
        WHERE organization_id = ?
      )
      AND suspended = 0
      ORDER BY name ASC
    `).all(organizationId);
  }
};
