const userModel = require('../models/userModel');

const settingsController = {
  getUserSettings: (req, res, next) => {
    try {
      const user = userModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Return notification preferences
      res.json({
        success: true,
        settings: {
          notify_on_new_loops: Boolean(user.notify_on_new_loops),
          notify_on_updated_loops: Boolean(user.notify_on_updated_loops)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  updateNotificationPreferences: async (req, res, next) => {
    try {
      const { notify_on_new_loops, notify_on_updated_loops } = req.body;

      // Validate input
      if (typeof notify_on_new_loops !== 'boolean' || typeof notify_on_updated_loops !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid notification preferences. Must be boolean values.'
        });
      }

      // Only admins can update notification preferences
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can configure email notifications'
        });
      }

      const result = userModel.updateNotificationPreferences(req.user.id, {
        notify_on_new_loops,
        notify_on_updated_loops
      });

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found or no changes made'
        });
      }

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        settings: {
          notify_on_new_loops,
          notify_on_updated_loops
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingsController;
