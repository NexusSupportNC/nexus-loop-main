const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userModel = require('../models/userModel');
const ActivityLogger = require('../services/activityLogger');

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please provide email and password' 
        });
      }

      // Find user by email
      const user = userModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'This user does not exist'
        });
      }

      // Check if user is suspended
      if (user.suspended) {
        return res.status(403).json({
          success: false,
          error: 'Account suspended. Please contact an administrator.',
          suspended: true
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      // Log successful login
      ActivityLogger.log(user.id, ActivityLogger.ACTION_TYPES.LOGIN, `User logged in`, req);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  register: async (req, res, next) => {
    try {
      const { name, email, password, role = 'agent' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please provide name, email, and password' 
        });
      }

      // Check if user already exists
      const existingUser = userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'User already exists with this email' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = userModel.create({
        name,
        email,
        password: hashedPassword,
        role
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: result.lastInsertRowid, 
          email, 
          role 
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: result.lastInsertRowid,
          name,
          email,
          role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getProfile: (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  }
};

module.exports = authController;
