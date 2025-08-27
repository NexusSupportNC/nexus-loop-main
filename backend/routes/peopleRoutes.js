const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/people - Get all users with optional search
router.get('/', peopleController.getUsers);

// GET /api/people/:id - Get user by ID
router.get('/:id', peopleController.getUserById);

module.exports = router;
