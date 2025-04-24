// Role checking middleware functions

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Check if user has any of the specified roles
exports.hasRoles = (allowedRoles) => {
  return (req, res, next) => {
    // If no role is provided in the array or user has no role
    if (!allowedRoles || !Array.isArray(allowedRoles) || !req.user || !req.user.role) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      // Special case: admins always have access unless explicitly excluded
      if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
      }
    }
    
    next();
  };
}; 