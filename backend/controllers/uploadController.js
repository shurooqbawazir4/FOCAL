/**
 * Upload Controller
 * 
 * This file contains all file upload-related controller functions.
 * It handles file processing, validation, and flashcard generation.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { MESSAGES, STATUS_CODES } = require('../utils/constants');

// Convert exec to async function
const execAsync = util.promisify(exec);

/**
 * Process file with Python script
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Processing result
 */
const processFileWithPython = async (filePath, mimeType) => {
  try {
    let scriptPath;
    let scriptArgs;

    // Determine which Python script to use based on file type
    if (mimeType === 'application/pdf') {
      scriptPath = path.join(__dirname, '..', 'python_processor.py');
      scriptArgs = [scriptPath, filePath, mimeType, process.env.OPENAI_API_KEY];
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      scriptPath = path.join(__dirname, '..', 'python_processor.py');
      scriptArgs = [scriptPath, filePath, mimeType, process.env.OPENAI_API_KEY];
    } else if (mimeType.startsWith('image/')) {
      scriptPath = path.join(__dirname, '..', 'python_processor.py');
      scriptArgs = [scriptPath, filePath, mimeType, process.env.OPENAI_API_KEY];
    } else {
      throw new Error('Unsupported file type for processing');
    }

    console.log('🐍 Running Python script:', scriptArgs);

    // Execute Python script
    const { stdout, stderr } = await execAsync(`python3 ${scriptArgs.join(' ')}`);

    if (stderr) {
      console.error('Python script stderr:', stderr);
    }

    console.log('🐍 Python script output:', stdout);

    // Parse the output
    const result = JSON.parse(stdout);
    
    if (!result.flashcards || !Array.isArray(result.flashcards)) {
      throw new Error('Invalid response from Python script');
    }

    return result;

  } catch (error) {
    console.error('Python processing error:', error);
    throw new Error(`File processing failed: ${error.message}`);
  }
};

/**
 * Handle file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFile = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        status: 'error',
        message: 'No file uploaded. Please select a file to process.' 
      });
    }

    const uploadedFile = req.file;
    const originalFilename = req.file.originalname;
    const filePath = uploadedFile.path;
    const mimeType = uploadedFile.mimetype;

    console.log('📄 File upload received:', {
      originalName: originalFilename,
      mimetype: mimeType,
      size: `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`,
      path: filePath
    });

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        status: 'error',
        message: 'Uploaded file not found. Please try again.' 
      });
    }

    try {
      // Process file with Python script
      const result = await processFileWithPython(filePath, mimeType);
      
      const processingTime = Date.now() - startTime;
      
      // Clean up uploaded file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('⚠️  Warning: Could not delete uploaded file:', err.message);
        } else {
          console.log('🗑️  Cleaned up uploaded file:', path.basename(filePath));
        }
      });

      // Return successful response
      res.json({
        status: 'success',
        message: MESSAGES.SUCCESS.UPLOAD,
        data: {
          flashcards: result.flashcards,
          originalFilename: originalFilename,
          processingTime: `${processingTime}ms`,
          fileType: mimeType,
          flashcardCount: result.flashcards.length
        }
      });

    } catch (processingError) {
      console.error('File processing error:', processingError);
      
      // Clean up uploaded file on error
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('⚠️  Warning: Could not delete uploaded file after error:', err.message);
        }
      });

      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: `File processing failed: ${processingError.message}`
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: MESSAGES.ERROR.UPLOAD_FAILED
    });
  }
};

/**
 * Handle YouTube URL processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processYouTube = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'YouTube URL is required'
      });
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid YouTube URL'
      });
    }

    console.log('🎥 Processing YouTube URL:', url);

    // Process YouTube URL with Python script with timeout
    const scriptPath = path.join(__dirname, '..', 'youtube_processor.py');
    const command = `python3 "${scriptPath}" "${url}" "${process.env.OPENAI_API_KEY}"`;
    
    let result;
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 180000 }); // 3 minutes timeout

      if (stderr) {
        console.error('YouTube processing stderr:', stderr);
      }

      console.log('🎥 YouTube processing output:', stdout);

      // Parse the output
      result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'YouTube processing failed');
      }
      
      if (!result.flashcards || !Array.isArray(result.flashcards)) {
        throw new Error('Invalid response from YouTube processing script');
      }
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        throw new Error('YouTube processing timed out. Please try with a shorter video.');
      }
      throw error;
    }

    res.json({
      status: 'success',
      message: MESSAGES.SUCCESS.UPLOAD,
      data: {
        flashcards: result.flashcards,
        originalUrl: url,
        flashcardCount: result.flashcards.length
      }
    });

  } catch (error) {
    console.error('YouTube processing error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: `YouTube processing failed: ${error.message}`
    });
  }
};

module.exports = {
  uploadFile,
  processYouTube
};
