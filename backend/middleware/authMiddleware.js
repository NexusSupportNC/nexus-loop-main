const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userModel = require('../models/userModel');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Check if user is suspended
    if (user.suspended) {
      return res.status(403).json({
        error: 'Account suspended. Please contact an administrator.',
        suspended: true
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Update last active timestamp
    userModel.updateLastActive(user.id);

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
