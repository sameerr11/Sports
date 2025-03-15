const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

// Middleware to authenticate JWT token
exports.auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Set user from payload
    req.user = decoded.user;
    
    // Check if user still exists and is active
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ msg: 'User no longer exists or is inactive' });
    }
    
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user has admin role
exports.admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check if user has support role
exports.support = (req, res, next) => {
  if (req.user.role !== 'support' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Support privileges required.' });
  }
  next();
};

// Middleware to check if user has admin or support role
exports.adminOrSupport = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ msg: 'Access denied. Admin or Support privileges required.' });
  }
  next();
};

// Middleware to check if user has supervisor role
exports.supervisor = (req, res, next) => {
  if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Supervisor privileges required.' });
  }
  next();
};

// Middleware to check if user has coach role
exports.coach = (req, res, next) => {
  if (req.user.role !== 'coach' && req.user.role !== 'supervisor' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Coach privileges required.' });
  }
  next();
};

// Middleware to check if user has player role
exports.player = (req, res, next) => {
  if (req.user.role !== 'player' && req.user.role !== 'coach' && req.user.role !== 'supervisor' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Player privileges required.' });
  }
  next();
};

// Middleware to check if user has parent role
exports.parent = (req, res, next) => {
  if (req.user.role !== 'parent' && req.user.role !== 'coach' && req.user.role !== 'supervisor' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Parent privileges required.' });
  }
  next();
};

// Middleware to check if user has accounting role
exports.accounting = (req, res, next) => {
  if (req.user.role !== 'accounting' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Accounting privileges required.' });
  }
  next();
}; 