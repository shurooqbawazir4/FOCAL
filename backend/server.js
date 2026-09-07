/**
 * FOCAL Backend Server
 * 
 * This is the main server file for the FOCAL application.
 * It sets up the Express server, middleware, and routes.
 * 
 * The server is organized into modular components:
 * - config/ - Configuration files
 * - middleware/ - Custom middleware
 * - routes/ - API route handlers
 * - controllers/ - Business logic
 * - utils/ - Utility functions
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import configuration
const { SERVER_CONFIG, CORS_CONFIG, SESSION_CONFIG } = require('./config/app');

// Import routes
const apiRoutes = require('./routes');

// Create Express app
const app = express();

// Middleware setup
app.use(cors(CORS_CONFIG));
app.use(express.json());
app.use(session(SESSION_CONFIG));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 FOCAL Server running on port ${SERVER_CONFIG.PORT}`);
  console.log(`📱 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${SERVER_CONFIG.PORT}/api`);
});

module.exports = app;