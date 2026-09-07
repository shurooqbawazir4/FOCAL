const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const {
  getAdminStats,
  getCoursesWithPerformance,
  getCourseSections,
  getAttentionAggregate
} = require('../controllers/adminController');

// All admin routes require auth and admin role
router.use(verifyToken, checkRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/courses', getCoursesWithPerformance);
router.get('/courses/:courseId/sections', getCourseSections);
router.post('/attention/aggregate/:courseId', getAttentionAggregate);

module.exports = router;


