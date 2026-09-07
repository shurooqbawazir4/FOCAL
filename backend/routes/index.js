/**
 * Main Routes Index
 * 
 * This file combines all route modules into a single router.
 * It serves as the main entry point for all API routes.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const uploadRoutes = require('./upload');
const instructorDashboardRoutes = require('./instructorDashboard');
const adminRoutes = require('./admin');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'FOCAL API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/instructor', instructorDashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/', uploadRoutes); // Upload routes are at root level

module.exports = router;
