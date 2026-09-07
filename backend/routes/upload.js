/**
 * Upload Routes
 * 
 * This file contains all file upload-related routes.
 * It handles file uploads and YouTube URL processing.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadFile, processYouTube } = require('../controllers/uploadController');

// File upload route (protected)
router.post('/upload', verifyToken, upload.single('file'), handleUploadError, uploadFile);

// YouTube processing route (protected)
router.post('/youtube', verifyToken, processYouTube);

module.exports = router;
