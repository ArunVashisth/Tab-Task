const User = require('../models/User');
const Project = require('../models/Project');
const path = require('path');
const fs = require('fs');

const getAllUsers = async (req, res) => {
  try {
    const myProjects = await Project.find({ 'members.user': req.user._id }).select('members');
    const collaboratorIds = new Set();
    myProjects.forEach(project => {
      project.members.forEach(m => {
        const uid = m.user.toString();
        if (uid !== req.user._id.toString()) collaboratorIds.add(uid);
      });
    });
    const users = await User.find({ _id: { $in: [...collaboratorIds] } })
      .select('-password')
      .sort('name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMeWithProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .select('title color members createdBy')
      .populate('members.user', 'name email username');
    const projectsWithRole = projects.map(p => {
      const me = p.members.find(m => m.user._id.toString() === req.user._id.toString());
      return { _id: p._id, title: p.title, color: p.color, myRole: me ? me.role : 'member' };
    });
    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt
      },
      projects: projectsWithRole
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, username } = req.body;
    const updates = { name, email };
    if (username !== undefined) {
      if (username && username.length > 0) {
        if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
          return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
        }
        const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
        if (existing) return res.status(400).json({ message: 'Username already taken' });
        updates.username = username.toLowerCase();
      } else {
        updates.username = null;
      }
    }
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Username already taken' });
    res.status(500).json({ message: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.user._id);
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    const updated = await User.findById(req.user._id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    user.avatar = '';
    await user.save();
    const updated = await User.findById(req.user._id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, getMeWithProjects, updateProfile, updatePassword, uploadAvatar, deleteAvatar };
