const express = require('express');
const router = express.Router();

// Middlewares
const auth = require('../middlewares/authMiddleware');

// Route modules (modularized)
const userRoutes = require('./userRoutes'); // 👈 import the user routes
const paymentRoutes = require('./paymentRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Controllers
const courseController = require('../controllers/courseController');
const bookingController = require('../controllers/bookingController');
const instructorController = require('../controllers/instructorController');

// Debug log to make sure controllers are loaded correctly
console.log('Loaded courseController:', Object.keys(courseController));
console.log('Loaded bookingController:', Object.keys(bookingController));
console.log('Loaded instructorController:', Object.keys(instructorController));

// Mount /users from userRoutes
router.use('/users', userRoutes); // ✅ now /api/users will work
// Mount routes
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);

/* ────────────── COURSE ROUTES ────────────── */
router.get('/courses', auth(['student', 'instructor', 'admin']), courseController.getCourses);
router.post('/courses', auth(['admin']), courseController.createCourse);
router.put('/courses/:id', auth(['admin']), courseController.updateCourse);
router.delete('/courses/:id', auth(['admin']), courseController.deleteCourse);
router.get('/instructor/overview', auth(['instructor']), instructorController.getOverview);

/* ────────────── BOOKING ROUTES ────────────── */
router.get('/bookings', auth(['student', 'instructor', 'admin']), bookingController.getBookings);
router.post('/bookings', auth(['student', 'admin']), bookingController.createBooking);
router.put('/bookings/:id', auth(['student', 'instructor', 'admin']), bookingController.updateBooking);
router.delete('/bookings/:id', auth(['admin']), bookingController.deleteBooking);

/* ────────────── INSTRUCTOR ROUTES ────────────── */
router.get('/instructor/schedule', auth(['instructor']), instructorController.getSchedule);
router.put('/instructor/lesson', auth(['instructor']), instructorController.updateLessonStatus);
router.post('/instructor/report', auth(['instructor']), instructorController.reportIssue);
router.put('/instructor/availability', auth(['instructor']), instructorController.updateAvailability);
router.get('/instructor/notifications', auth(['instructor']), instructorController.getNotifications);
router.get('/instructor/student/:studentId', auth(['instructor']), instructorController.getStudentProfile);
router.post('/instructor/message', auth(['instructor']), instructorController.sendMessage);

module.exports = router;
