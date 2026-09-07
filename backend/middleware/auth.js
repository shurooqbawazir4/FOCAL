/**
 * Authentication Middleware
 * 
 * This file contains all authentication-related middleware functions.
 * It handles JWT token verification and user authentication.
 */

const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/app');
const { MESSAGES, STATUS_CODES } = require('../utils/constants');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.UNAUTHORIZED
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.UNAUTHORIZED
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    
    // Add user info to request object
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.TOKEN_EXPIRED
      });
    }
    
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      status: 'error',
      message: MESSAGES.ERROR.UNAUTHORIZED
    });
  }
};

/**
 * Check if user has specific role
 * @param {Array} allowedRoles - Array of allowed user roles
 * @returns {Function} Middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.UNAUTHORIZED
      });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        status: 'error',
        message: MESSAGES.ERROR.UNAUTHORIZED
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
};
