const jwt = require('jsonwebtoken');
const { findAdminById, findUserById } = require('../routes/loginControllers/authsqlc');

const protect = (allowedType = 'any') => {
  return async (req, res, next) => {
    try {
      let token;
      
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'You are not logged in. Please log in to access this resource.'
        });
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const resolvedType = decoded.type || 'user'; // admin vs user
      
      // Enforce model type restrictions if not 'any'
      if (allowedType !== 'any' && allowedType !== resolvedType) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.'
        });
      }
      
      let user;
      if (resolvedType === 'admin') {
        user = await findAdminById(decoded.id);
      } else {
        user = await findUserById(decoded.id);
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.'
        });
      }
      
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }
      
      req.user = user;
      req.userType = resolvedType;
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your token has expired. Please log in again.'
        });
      }
      next(error);
    }
  };
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (req.userType === 'admin') {
      if (req.user.is_super_admin) {
        return next();
      }
      if (req.user.permissions && req.user.permissions[resource] === action) {
        return next();
      }
    } else {
      const { permissions, app_role } = req.user;
      const userPermissions = [...permissions.admin, ...permissions.staff];
      
      if (userPermissions.includes(resource)) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: `You don't have permission to ${action} ${resource}`
    });
  };
};

module.exports = { protect, restrictTo, checkPermission };