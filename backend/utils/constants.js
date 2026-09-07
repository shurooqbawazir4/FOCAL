/**
 * Application Constants
 * 
 * This file contains all the constants used throughout the application.
 * It helps keep magic numbers and strings organized in one place.
 */

// File Upload Constants
const FILE_CONSTANTS = {
  SUPPORTED_FILE_TYPES: [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  UPLOADS_DIR: 'uploads'
};

// User Types
const USER_TYPES = {
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    UPLOAD: 'File uploaded successfully',
    OTP_SENT: 'OTP sent successfully',
    OTP_VERIFIED: 'OTP verified successfully'
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid username or password',
    USER_NOT_FOUND: 'User not found',
    INVALID_OTP: 'Invalid OTP',
    EXPIRED_OTP: 'OTP has expired',
    FILE_TOO_LARGE: 'File size too large',
    UNSUPPORTED_FILE_TYPE: 'File type not supported',
    UPLOAD_FAILED: 'File upload failed',
    TOKEN_EXPIRED: 'Token has expired',
    UNAUTHORIZED: 'Unauthorized access'
  }
};

// HTTP Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  FILE_CONSTANTS,
  USER_TYPES,
  MESSAGES,
  STATUS_CODES
};
