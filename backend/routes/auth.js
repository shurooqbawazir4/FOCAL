/**
 * Authentication Routes
 * 
 * This file contains all authentication-related routes.
 * It handles login, OTP verification, logout, and user profile endpoints.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  login,
  verifyOtp,
  getProfile,
  verifyToken: verifyTokenController,
  logout
} = require('../controllers/authController');

// Public routes (no authentication required)
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

// Protected routes (authentication required)
router.get('/me', verifyToken, getProfile);
router.post('/verify-token', verifyToken, verifyTokenController);
router.post('/logout', verifyToken, logout);

module.exports = router;
