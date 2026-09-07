const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getInstructorStats,
  getInstructorProfile,
  getInstructorCourses,
  getCourseSections,
  getTopCourses,
  getSessionHistory,
  getCurrentUser,
  getRealTimeAttention,
  startMonitoring,
  stopMonitoring,
  getAvailableCourses,
  debugDatabase
} = require('../controllers/instructorDashboardController');

/**
 * Instructor Dashboard Routes
 * All routes require authentication and instructor role
 */

// Get instructor profile
router.get('/profile', verifyToken, getInstructorProfile);

// Get instructor's courses
router.get('/courses', verifyToken, getInstructorCourses);

// Get sections for a course
router.get('/courses/:courseId/sections', verifyToken, getCourseSections);

// Get instructor statistics
router.get('/stats', verifyToken, getInstructorStats);

// Get top performing courses
router.get('/top-courses', verifyToken, getTopCourses);

// Get session history for instructor
router.get('/sessions', verifyToken, getSessionHistory);

// Get current user
router.get('/me', verifyToken, getCurrentUser);

// Get real-time attention data for a specific class
router.get('/attention/:classId', verifyToken, getRealTimeAttention);

// Start monitoring a class
router.post('/start-monitoring', verifyToken, startMonitoring);

// Stop monitoring a class
router.post('/stop-monitoring/:classId', verifyToken, stopMonitoring);

// Get available courses for the instructor (legacy endpoint)
router.get('/available-courses', verifyToken, getAvailableCourses);

// Debug endpoint to check database data
router.get('/debug', verifyToken, debugDatabase);

module.exports = router;
