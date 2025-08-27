const userModel = require('../models/userModel');
const ActivityLogger = require('../services/activityLogger');
const bcrypt = require('bcryptjs');

const adminController = {
  // User Management
  getAllUsers: (req, res, next) => {
    try {
      const users = userModel.getAllUsers();
      
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          suspended: user.suspended,
          created_at: user.created_at,
          updated_at: user.updated_at
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  getUserActivitySummary: (req, res, next) => {
    try {
      const summary = ActivityLogger.getUserActivitySummary();
      
      res.json({
        success: true,
        userActivity: summary
      });
    } catch (error) {
      next(error);
    }
  },

  // Activity Logs
  getActivityLogs: (req, res, next) => {
    try {
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        actionType: req.query.actionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : 100
      };

      const logs = ActivityLogger.getActivityLogs(filters);
      const stats = ActivityLogger.getActivityStats();

      res.json({
        success: true,
        logs,
        stats,
        count: logs.length
      });
    } catch (error) {
      next(error);
    }
  },

  clearActivityLogs: (req, res, next) => {
    try {
      // Clear all activity logs
      const result = ActivityLogger.clearAllLogs();

      res.json({
        success: true,
        message: 'All activity logs cleared successfully',
        cleared_count: result.cleared_count || 0
      });
    } catch (error) {
      next(error);
    }
  },

  // Password Management
  changeUserPassword: async (req, res, next) => {
    try {
      const { userId, newPassword } = req.body;
      const targetUserId = userId || req.user.id; // Allow changing own password if no userId specified

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // If changing another user's password, must be admin
      if (userId && userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can change other users passwords'
        });
      }

      // Get target user
      const targetUser = userModel.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const result = userModel.updatePassword(targetUserId, hashedPassword);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      // Log password change activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.PASSWORD_CHANGED,
        targetUserId === req.user.id 
          ? 'Changed own password' 
          : `Changed password for user: ${targetUser.name}`,
        req,
        { targetUserId, targetUserName: targetUser.name }
      );

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // User Suspension Management
  suspendUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Can't suspend another admin
      if (targetUser.role === 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Cannot suspend another administrator'
        });
      }

      // Can't suspend yourself
      if (parseInt(userId) === req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Cannot suspend your own account'
        });
      }

      // Suspend the user
      const result = userModel.suspendUser(userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to suspend user'
        });
      }

      // Log suspension activity
      ActivityLogger.log(
        req.user.id,
        'USER_SUSPENDED',
        `Suspended user: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email }
      );

      res.json({
        success: true,
        message: `User ${targetUser.name} has been suspended`
      });
    } catch (error) {
      next(error);
    }
  },

  unsuspendUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Unsuspend the user
      const result = userModel.unsuspendUser(userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to unsuspend user'
        });
      }

      // Log unsuspension activity
      ActivityLogger.log(
        req.user.id,
        'USER_UNSUSPENDED',
        `Unsuspended user: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email }
      );

      res.json({
        success: true,
        message: `User ${targetUser.name} has been unsuspended`
      });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Prevent deletion of admin users
      if (targetUser.role === 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete admin users'
        });
      }

      // Prevent self-deletion
      if (parseInt(userId) === req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      // Delete the user
      const result = userModel.deleteUser(userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to delete user'
        });
      }

      // Log deletion activity
      ActivityLogger.log(
        req.user.id,
        'USER_DELETED',
        `Deleted user: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email }
      );

      res.json({
        success: true,
        message: `User ${targetUser.name} has been permanently deleted`
      });
    } catch (error) {
      next(error);
    }
  },

  promoteToAdmin: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is already an admin
      if (targetUser.role === 'admin') {
        return res.status(400).json({
          success: false,
          error: 'User is already an admin'
        });
      }

      // Promote the user to admin
      const result = userModel.updateUserRole(userId, 'admin');

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to promote user to admin'
        });
      }

      // Log promotion activity
      ActivityLogger.log(
        req.user.id,
        'USER_PROMOTED',
        `Promoted user to admin: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email, newRole: 'admin' }
      );

      res.json({
        success: true,
        message: `${targetUser.name} has been promoted to admin successfully`
      });
    } catch (error) {
      next(error);
    }
  },

  // Export Functions
  exportActivityLogs: (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        actionType: req.query.actionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search
      };

      const logs = ActivityLogger.getActivityLogs(filters);

      // Log export activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.EXPORT_DATA,
        `Exported activity logs as ${format.toUpperCase()}`,
        req,
        { format, filters, recordCount: logs.length }
      );

      if (format === 'csv') {
        const csvContent = generateActivityLogsCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
      }
    } catch (error) {
      next(error);
    }
  },

  exportUserList: (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const users = userModel.getAllUsers();

      // Log export activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.EXPORT_DATA,
        `Exported user list as ${format.toUpperCase()}`,
        req,
        { format, recordCount: users.length }
      );

      if (format === 'csv') {
        const csvContent = generateUserListCSV(users);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=user-list.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
      }
    } catch (error) {
      next(error);
    }
  },

  exportTemplates: (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const documentTemplateModel = require('../models/documentTemplateModel');
      const templates = documentTemplateModel.getAll();

      // Log export activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.EXPORT_DATA,
        `Exported document templates as ${format.toUpperCase()}`,
        req,
        { format, recordCount: templates.length }
      );

      if (format === 'csv') {
        const csvContent = generateTemplatesCSV(templates);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=document-templates.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // Import Users from CSV
  importUsers: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file provided'
        });
      }

      const csvContent = req.file.buffer.toString('utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'CSV file is empty'
        });
      }

      // Parse header
      const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));

      // Validate required columns
      if (!header.includes('username') || !header.includes('email')) {
        return res.status(400).json({
          success: false,
          error: 'CSV must contain "username" and "email" columns'
        });
      }

      const results = {
        successful: 0,
        failed: 0,
        total: lines.length - 1,
        errors: [],
        successfulUsers: []
      };

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        const values = lines[i].split(',').map(val => val.trim().replace(/"/g, ''));

        if (values.length === 0 || values.every(val => !val)) {
          continue; // Skip empty lines
        }

        const row = {};
        header.forEach((col, index) => {
          row[col] = values[index] || '';
        });

        try {
          // Validate required fields
          if (!row.username || !row.email) {
            results.errors.push({
              line: lineNumber,
              message: 'Missing required username or email'
            });
            results.failed++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            results.errors.push({
              line: lineNumber,
              message: 'Invalid email format'
            });
            results.failed++;
            continue;
          }

          // Check if user already exists
          const existingUser = userModel.findByEmail(row.email);
          if (existingUser) {
            results.errors.push({
              line: lineNumber,
              message: 'User with this email already exists'
            });
            results.failed++;
            continue;
          }

          // Generate random password
          const randomPassword = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          // Create user
          const userData = {
            name: row.username,
            email: row.email,
            password: hashedPassword,
            role: 'agent' // Default role for imported users
          };

          const result = userModel.create(userData);

          if (result && result.lastInsertRowid) {
            results.successful++;
            results.successfulUsers.push({
              username: row.username,
              email: row.email,
              password: randomPassword
            });

            // Log user creation
            ActivityLogger.log(
              req.user.id,
              ActivityLogger.ACTION_TYPES.USER_IMPORTED,
              `Created user via CSV import: ${row.username} (${row.email})`,
              req,
              {
                importedUserId: result.lastInsertRowid,
                importedUserName: row.username,
                importedUserEmail: row.email,
                csvLine: lineNumber
              }
            );
          } else {
            results.errors.push({
              line: lineNumber,
              message: 'Failed to create user in database'
            });
            results.failed++;
          }
        } catch (error) {
          results.errors.push({
            line: lineNumber,
            message: error.message || 'Unknown error occurred'
          });
          results.failed++;
        }
      }

      // Log import activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.USER_IMPORTED,
        `Imported users from CSV: ${results.successful} successful, ${results.failed} failed`,
        req,
        {
          totalProcessed: results.total,
          successful: results.successful,
          failed: results.failed,
          filename: req.file.originalname
        }
      );

      res.json({
        success: true,
        message: 'CSV import completed',
        ...results
      });
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to generate random password
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each character type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Helper function to generate CSV for activity logs
function generateActivityLogsCSV(logs) {
  const headers = [
    'ID',
    'User Name',
    'User Email',
    'Action Type',
    'Description',
    'IP Address',
    'Date/Time'
  ];

  const rows = logs.map(log => [
    log.id,
    log.user_name || 'Unknown',
    log.user_email || 'Unknown',
    log.action_type,
    log.description,
    log.ip_address || 'N/A',
    new Date(log.created_at).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

// Helper function to generate CSV for user list
function generateUserListCSV(users) {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Role',
    'Created Date',
    'Last Updated'
  ];

  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.role,
    new Date(user.created_at).toLocaleString(),
    new Date(user.updated_at).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

// Helper function to generate CSV for document templates
function generateTemplatesCSV(templates) {
  const headers = [
    'ID',
    'Name',
    'Description',
    'Category',
    'File Name',
    'File Type',
    'File Size (bytes)',
    'Fields Mapped',
    'Created By',
    'Created Date',
    'Last Updated'
  ];

  const rows = templates.map(template => [
    template.id,
    template.name,
    template.description || 'N/A',
    template.category,
    template.file_name,
    template.file_type,
    template.file_size,
    template.fields_mapped ? 'Yes' : 'No',
    template.created_by,
    new Date(template.created_at).toLocaleString(),
    new Date(template.updated_at).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

module.exports = adminController;
