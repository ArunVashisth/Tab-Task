const express = require('express');
const router = express.Router();
const { signup, verifyOTP, resendOTP, login, getMe, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('passport');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;
