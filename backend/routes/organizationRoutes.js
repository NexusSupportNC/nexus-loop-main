const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/organizations - Get all organizations
router.get('/', organizationController.getOrganizations);

// GET /api/organizations/:id - Get organization by ID
router.get('/:id', organizationController.getOrganizationById);

// POST /api/organizations - Create new organization (admin only)
router.post('/', adminMiddleware, organizationController.createOrganization);

// PUT /api/organizations/:id - Update organization (admin only)
router.put('/:id', adminMiddleware, organizationController.updateOrganization);

// DELETE /api/organizations/:id - Delete organization (admin only)
router.delete('/:id', adminMiddleware, organizationController.deleteOrganization);

// GET /api/organizations/:id/users - Get users in organization
router.get('/:id/users', organizationController.getOrganizationUsers);

// GET /api/organizations/:id/available-users - Get available users for organization (admin only)
router.get('/:id/available-users', adminMiddleware, organizationController.getAvailableUsers);

// POST /api/organizations/:id/users - Add user to organization (admin only)
router.post('/:id/users', adminMiddleware, organizationController.addUserToOrganization);

// DELETE /api/organizations/:id/users/:userId - Remove user from organization (admin only)
router.delete('/:id/users/:userId', adminMiddleware, organizationController.removeUserFromOrganization);

module.exports = router;
