const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Specific role middlewares
const requireClient = authorize('client');
const requireLawyer = authorize('lawyer');
const requireAdmin = authorize('admin');
const requireLawyerOrAdmin = authorize('lawyer', 'admin');

// Ownership middleware - check if user owns the resource
const requireOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.userId && resource.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      // For cases, check if user is the client or assigned lawyer
      if (resource.clientId && resource.clientId.toString() !== req.user._id.toString()) {
        if (resource.lawyerId && resource.lawyerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to access this case.'
          });
        }
      }

      req.resource = resource;
      next();

    } catch (error) {
      console.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

// Rate limiting middleware for sensitive operations
const rateLimit = require('express-rate-limit');

const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();

  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  auth,
  authorize,
  requireClient,
  requireLawyer,
  requireAdmin,
  requireLawyerOrAdmin,
  requireOwnership,
  sensitiveOperationLimiter,
  optionalAuth
}; 