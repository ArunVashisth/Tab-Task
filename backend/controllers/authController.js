const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
    const existingEmail = await User.findOne({ email: email?.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    if (username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'member' : role || 'member');
    const newUser = await User.create({
      name,
      username: username ? username.toLowerCase() : undefined,
      email,
      password,
      role: assignedRole
    });
    const token = signToken(newUser._id);
    res.status(201).json({ token, user: formatUser(newUser) });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'username' ? 'Username' : 'Email'} already taken` });
    }
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const foundUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!foundUser || !(await foundUser.comparePassword(password))) {
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

module.exports = { signup, login, getMe };
