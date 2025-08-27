const User = require('../models/userModel');
const Organization = require('../models/organizationModel');

const peopleController = {
  // Get all users with search functionality
  getUsers: async (req, res) => {
    try {
      const { search } = req.query;
      const users = Organization.searchUsersWithOrganizations(search);

      // Remove password from response and format organization data
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;

        // Parse organization data
        if (safeUser.organizations && safeUser.organization_ids) {
          const orgNames = safeUser.organizations.split(',');
          const orgIds = safeUser.organization_ids.split(',');

          safeUser.organizationList = orgNames.map((name, index) => ({
            id: parseInt(orgIds[index]),
            name: name
          })).filter(org => org.name); // Filter out empty names
        } else {
          safeUser.organizationList = [];
        }

        // Remove the raw organization fields
        delete safeUser.organizations;
        delete safeUser.organization_ids;

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
