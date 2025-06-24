const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, courseController.getCourses);
router.post('/', authMiddleware, courseController.createCourse);

module.exports = router;