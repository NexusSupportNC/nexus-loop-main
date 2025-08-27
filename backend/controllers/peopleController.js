const User = require('../models/userModel');

const peopleController = {
  // Get all users with search functionality
  getUsers: async (req, res) => {
    try {
      const { search } = req.query;
      const users = User.searchUsers(search);
      
      // Remove password from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json({ success: true, users: safeUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Error fetching users' });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = User.findById(id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ success: false, message: 'Error fetching user' });
    }
  }
};

module.exports = peopleController;
