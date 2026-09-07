/**
 * Application Configuration
 * 
 * This file contains all application-level configuration constants
 * and settings that are used throughout the application.
 */

require('dotenv').config();

// Server Configuration
const SERVER_CONFIG = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// CORS Configuration
const CORS_CONFIG = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3001',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

// Session Configuration
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || 'focal-session-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax' // Allow cross-origin requests from same site
  }
};

// File Upload Configuration
const FILE_CONFIG = {
  UPLOADS_DIR: 'uploads'
};

// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'focal-jwt-secret-key',
  expiresIn: '24h'
};

// Email Configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

module.exports = {
  SERVER_CONFIG,
  CORS_CONFIG,
  SESSION_CONFIG,
  FILE_CONFIG,
  JWT_CONFIG,
  EMAIL_CONFIG
};
