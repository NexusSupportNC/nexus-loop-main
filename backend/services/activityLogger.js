const db = require('../database/config');

// Create activity logs table
db.prepare(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    additional_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`).run();

class ActivityLogger {
  static log(userId, actionType, description, req = null, additionalData = null) {
    try {
      const stmt = db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, ip_address, user_agent, additional_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const ipAddress = req ? (req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']) : null;
      const userAgent = req ? req.headers['user-agent'] : null;
      const dataJson = additionalData ? JSON.stringify(additionalData) : null;
      
      stmt.run(userId, actionType, description, ipAddress, userAgent, dataJson);
      
      console.log(`Activity logged: ${actionType} - ${description} (User: ${userId})`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static getActivityLogs(filters = {}) {
    try {
      let query = `
        SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.userId) {
        query += ' AND al.user_id = ?';
        params.push(filters.userId);
      }

      if (filters.actionType) {
        query += ' AND al.action_type = ?';
        params.push(filters.actionType);
      }

      if (filters.startDate) {
        query += ' AND al.created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND al.created_at <= ?';
        params.push(filters.endDate);
      }

      if (filters.search) {
        query += ' AND (al.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY al.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return [];
    }
  }

  static getActivityStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today_activities,
          COUNT(CASE WHEN DATE(created_at) >= ? THEN 1 END) as week_activities,
          COUNT(CASE WHEN action_type = 'LOGIN' THEN 1 END) as total_logins,
          COUNT(CASE WHEN action_type = 'LOOP_CREATED' THEN 1 END) as total_loop_created,
          COUNT(CASE WHEN action_type = 'LOOP_UPDATED' THEN 1 END) as total_loop_updated
        FROM activity_logs
      `).get(today, thisWeek);
      
      return stats;
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return {};
    }
  }

  static getUserActivitySummary() {
    try {
      return db.prepare(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COUNT(al.id) as total_activities,
          MAX(al.created_at) as last_activity,
          COUNT(CASE WHEN al.action_type = 'LOGIN' THEN 1 END) as login_count,
          COUNT(CASE WHEN al.action_type = 'LOOP_CREATED' THEN 1 END) as loops_created,
          COUNT(CASE WHEN al.action_type = 'LOOP_UPDATED' THEN 1 END) as loops_updated
        FROM users u
        LEFT JOIN activity_logs al ON u.id = al.user_id
        GROUP BY u.id, u.name, u.email, u.role
        ORDER BY last_activity DESC
      `).all();
    } catch (error) {
      console.error('Failed to get user activity summary:', error);
      return [];
    }
  }

  static clearAllLogs() {
    try {
      const result = db.prepare('DELETE FROM activity_logs').run();
      console.log(`Cleared ${result.changes} activity logs`);
      return { cleared_count: result.changes };
    } catch (error) {
      console.error('Failed to clear activity logs:', error);
      throw error;
    }
  }

  // Activity type constants
  static get ACTION_TYPES() {
    return {
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
      LOOP_CREATED: 'LOOP_CREATED',
      LOOP_UPDATED: 'LOOP_UPDATED',
      LOOP_DELETED: 'LOOP_DELETED',
      LOOP_ARCHIVED: 'LOOP_ARCHIVED',
      LOOP_UNARCHIVED: 'LOOP_UNARCHIVED',
      PASSWORD_CHANGED: 'PASSWORD_CHANGED',
      SETTINGS_UPDATED: 'SETTINGS_UPDATED',
      EXPORT_DATA: 'EXPORT_DATA',
      USER_SUSPENDED: 'USER_SUSPENDED',
      USER_UNSUSPENDED: 'USER_UNSUSPENDED',
      USER_DELETED: 'USER_DELETED',
      USER_IMPORTED: 'USER_IMPORTED',
      TEMPLATE_UPLOADED: 'TEMPLATE_UPLOADED',
      TEMPLATE_DELETED: 'TEMPLATE_DELETED',
      TEMPLATE_FIELDS_MAPPED: 'TEMPLATE_FIELDS_MAPPED',
      DOCUMENT_GENERATED: 'DOCUMENT_GENERATED'
    };
  }
}

module.exports = ActivityLogger;
