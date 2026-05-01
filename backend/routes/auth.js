const express = require('express');
const router = express.Router();
const { signup, verifyOTP, resendOTP, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
