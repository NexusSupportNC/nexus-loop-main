const Organization = require('../models/organizationModel');

const organizationController = {
  // Get all organizations
  getOrganizations: async (req, res) => {
    try {
      const organizationsData = Organization.findAll();
      // Format organizations to include userCount
      const organizations = organizationsData.map(org => ({
        ...org,
        userCount: org.member_count || 0
      }));
      res.json({ success: true, organizations });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ success: false, message: 'Error fetching organizations' });
    }
  },

  // Get organization by ID
  getOrganizationById: async (req, res) => {
    try {
      const { id } = req.params;
      const organization = Organization.findById(id);
      
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Get users in this organization
      const users = Organization.getUsersInOrganization(id);
      
      res.json({ 
        success: true, 
        organization: {
          ...organization,
          users
        }
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ success: false, message: 'Error fetching organization' });
    }
  },

  // Create new organization
  createOrganization: async (req, res) => {
    try {
      const { name, description, userIds } = req.body;
      const createdBy = req.user.id;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Organization name is required' });
      }

      // Create organization
      const result = Organization.create({
        name: name.trim(),
        description: description || '',
        created_by: createdBy
      });

      const organizationId = result.lastInsertRowid;

      // Add users to organization if provided
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        for (const userId of userIds) {
          try {
            Organization.addUserToOrganization(userId, organizationId, createdBy);
          } catch (userError) {
            console.warn(`Failed to add user ${userId} to organization:`, userError);
          }
        }
      }

      // Fetch the created organization with users
      const organization = Organization.findById(organizationId);
      const users = Organization.getUsersInOrganization(organizationId);

      res.status(201).json({ 
        success: true, 
        message: 'Organization created successfully',
        organization: {
          ...organization,
          users
        }
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ success: false, message: 'Organization name already exists' });
      } else {
        res.status(500).json({ success: false, message: 'Error creating organization' });
      }
    }
  },

  // Update organization
  updateOrganization: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Organization name is required' });
      }

      // Check if organization exists
      const existingOrg = Organization.findById(id);
      if (!existingOrg) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Update organization
      Organization.update(id, {
        name: name.trim(),
        description: description || ''
      });

      // Fetch updated organization
      const organization = Organization.findById(id);
      const users = Organization.getUsersInOrganization(id);

      res.json({ 
        success: true, 
        message: 'Organization updated successfully',
        organization: {
          ...organization,
          users
        }
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ success: false, message: 'Organization name already exists' });
      } else {
        res.status(500).json({ success: false, message: 'Error updating organization' });
      }
    }
  },

  // Delete organization
  deleteOrganization: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if organization exists
      const existingOrg = Organization.findById(id);
      if (!existingOrg) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Delete organization (this will also remove all user assignments due to CASCADE)
      Organization.delete(id);

      res.json({ 
        success: true, 
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      res.status(500).json({ success: false, message: 'Error deleting organization' });
    }
  },

  // Add user to organization
  addUserToOrganization: async (req, res) => {
    try {
      const { id } = req.params; // organization id
      const { userId } = req.body;
      const assignedBy = req.user.id;

      // Validate input
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      // Check if organization exists
      const organization = Organization.findById(id);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Add user to organization
      Organization.addUserToOrganization(userId, id, assignedBy);

      // Get updated user list
      const users = Organization.getUsersInOrganization(id);

      res.json({ 
        success: true, 
        message: 'User added to organization successfully',
        users
      });
    } catch (error) {
      console.error('Error adding user to organization:', error);
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ success: false, message: 'User is already in this organization' });
      } else {
        res.status(500).json({ success: false, message: 'Error adding user to organization' });
      }
    }
  },

  // Remove user from organization
  removeUserFromOrganization: async (req, res) => {
    try {
      const { id, userId } = req.params; // organization id and user id

      // Check if organization exists
      const organization = Organization.findById(id);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Remove user from organization
      Organization.removeUserFromOrganization(userId, id);

      // Get updated user list
      const users = Organization.getUsersInOrganization(id);

      res.json({ 
        success: true, 
        message: 'User removed from organization successfully',
        users
      });
    } catch (error) {
      console.error('Error removing user from organization:', error);
      res.status(500).json({ success: false, message: 'Error removing user from organization' });
    }
  },

  // Get available users (not in the organization)
  getAvailableUsers: async (req, res) => {
    try {
      const { id } = req.params; // organization id

      // Check if organization exists
      const organization = Organization.findById(id);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      const users = Organization.getAvailableUsers(id);
      
      res.json({ success: true, users });
    } catch (error) {
      console.error('Error fetching available users:', error);
      res.status(500).json({ success: false, message: 'Error fetching available users' });
    }
  },

  // Get users in organization
  getOrganizationUsers: async (req, res) => {
    try {
      const { id } = req.params; // organization id

      // Check if organization exists
      const organization = Organization.findById(id);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      const users = Organization.getUsersInOrganization(id);
      
      res.json({ success: true, users });
    } catch (error) {
      console.error('Error fetching organization users:', error);
      res.status(500).json({ success: false, message: 'Error fetching organization users' });
    }
  }
};

module.exports = organizationController;
