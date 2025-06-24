const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.get('/', auth(['admin', 'student']), paymentController.getPayments);
router.put('/process/:id', auth(['admin']), paymentController.processPayment);
router.put('/refund/:id', auth(['admin']), paymentController.refundPayment);

module.exports = router;
