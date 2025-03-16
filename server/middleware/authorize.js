/**
 * Middleware to check if user has one of the required roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
module.exports = (roles) => {
  return (req, res, next) => {
    // If no roles required or roles is empty, continue
    if (!roles || roles.length === 0) {
      return next();
    }

    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ msg: 'Forbidden: No role assigned' });
    }

    // Check if user's role is in the allowed roles array
    if (Array.isArray(roles) && roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ msg: 'Forbidden: Insufficient permissions' });
  };
}; 