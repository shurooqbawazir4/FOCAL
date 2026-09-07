/**
 * File Upload Middleware
 * 
 * This file contains all file upload-related middleware functions.
 * It handles file validation, storage, and processing.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_CONFIG } = require('../config/app');
const { FILE_CONSTANTS, MESSAGES } = require('../utils/constants');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', FILE_CONFIG.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (FILE_CONSTANTS.SUPPORTED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(MESSAGES.ERROR.UNSUPPORTED_FILE_TYPE), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_CONSTANTS.MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

/**
 * Error handling middleware for file uploads
 * @param {Error} error - Multer error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: MESSAGES.ERROR.FILE_TOO_LARGE
      });
    }
  }
  
  if (error.message === MESSAGES.ERROR.UNSUPPORTED_FILE_TYPE) {
    return res.status(400).json({
      status: 'error',
      message: MESSAGES.ERROR.UNSUPPORTED_FILE_TYPE
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
