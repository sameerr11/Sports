// Middleware to check if user has any of the specified roles
const roles = (allowedRoles) => {
  return (req, res, next) => {
    // If no role is provided in the array or user has no role
    if (!allowedRoles || !Array.isArray(allowedRoles) || !req.user || !req.user.role) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role) && !allowedRoles.includes('*')) {
      // Also check if user is admin (admins always have access)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
      }
    }
    
    next();
  };
};

module.exports = roles; 