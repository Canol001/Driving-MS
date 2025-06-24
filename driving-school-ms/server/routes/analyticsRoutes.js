const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

router.get('/', auth(['admin']), analyticsController.getAnalytics);

module.exports = router;
