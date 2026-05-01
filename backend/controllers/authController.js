const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username || null,
  email: user.email,
  role: user.role,
  avatar: user.avatar || '',
  createdAt: user.createdAt
});

const signup = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    
    // Check if user already exists in main collection
    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    
    if (username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }

    const otp = generateOTP();
    
    // Store in OTP collection (pending signup)
    // Replace any previous pending signup for this email
    await OTP.findOneAndDelete({ email: email.toLowerCase() });
    
    await OTP.create({
      name,
      email: email.toLowerCase(),
      password, // Store plain text temporarily (auto-deleted in 10 mins)
      role: role || 'member',
      otp
    });

    try {
      await sendEmail({
        email: email.toLowerCase(),
        subject: 'Your Tab Task Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Verify your account</h2>
            <p>Welcome to Tab Task! Use the code below to verify your email address. This code will expire in 10 minutes.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; color: #111827; margin: 24px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `
      });
      res.status(201).json({ message: 'OTP sent to email', email });
    } catch (err) {
      console.error('Email error:', err);
      res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const otpDoc = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Now that OTP is verified, create the real User
    // The User model's pre-save hook will hash the password automatically
    const newUser = new User({
      name: otpDoc.name,
      email: otpDoc.email,
      password: otpDoc.password,
      role: otpDoc.role
    });

    await newUser.save();

    // Delete the OTP doc
    await OTP.deleteOne({ _id: otpDoc._id });

    const token = signToken(newUser._id);
    res.json({ token, user: formatUser(newUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otpDoc = await OTP.findOne({ email: email.toLowerCase() });
    
    if (!otpDoc) return res.status(404).json({ message: 'No pending signup found. Please sign up again.' });

    const otp = generateOTP();
    otpDoc.otp = otp;
    await otpDoc.save();

    await sendEmail({
      email: otpDoc.email,
      subject: 'Your New Verification Code',
      html: `<p>Your new verification code is: <b>${otp}</b></p>`
    });

    res.json({ message: 'New OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const foundUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!foundUser) {
      // Check if they have a pending signup in the OTP collection
      const pendingUser = await OTP.findOne({ email: email.toLowerCase() });
      if (pendingUser) {
        // Compare password with the pending one
        const isMatch = await bcrypt.compare(password, pendingUser.password);
        if (isMatch) {
          // Send fresh OTP
          const newOtp = generateOTP();
          pendingUser.otp = newOtp;
          await pendingUser.save();
          
          await sendEmail({
            email: pendingUser.email,
            subject: 'Your New Verification Code',
            html: `<p>Your new verification code is: <b>${newOtp}</b></p>`
          });

          return res.status(403).json({ 
            message: 'Account not verified. A fresh OTP has been sent to your email.',
            isUnverified: true,
            email: pendingUser.email
          });
        }
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!(await foundUser.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(foundUser._id);
    res.json({ token, user: formatUser(foundUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(formatUser(req.user));
};

module.exports = { signup, verifyOTP, resendOTP, login, getMe };
