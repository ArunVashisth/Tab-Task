const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const User = require('../models/User');

// POST /api/invitations/send
// Inviter must be a project admin to send invite
const sendInvite = async (req, res) => {
  try {
    const { query, projectId, projectRole, message } = req.body;
    if (!query || !projectId) {
      return res.status(400).json({ message: 'User query and project are required' });
    }

    // Find the target user globally (by email or username)
    const target = await User.findOne({
      $or: [
        { email: query.toLowerCase() },
        { username: query.toLowerCase() }
      ]
    });
    if (!target) {
      return res.status(404).json({ message: 'No user found with that email or username' });
    }
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    // Check project exists and caller is a member with admin role
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const callerRole = project.getMemberRole(req.user._id);
    if (!callerRole) return res.status(403).json({ message: 'You are not a member of this project' });
    if (callerRole !== 'admin') return res.status(403).json({ message: 'Only project admins can send invitations' });

    // Check if already a member
    if (project.hasMember(target._id)) {
      return res.status(400).json({ message: 'This user is already a member of the project' });
    }

    const assignedRole = ['admin', 'member'].includes(projectRole) ? projectRole : 'member';

    // Handle re-invite (reset a rejected invite to pending)
    const existing = await Invitation.findOne({ from: req.user._id, to: target._id, projectId });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'An invitation is already pending for this user' });
      }
      // Re-invite allowed if previously rejected
      existing.status = 'pending';
      existing.projectRole = assignedRole;
      existing.message = message || '';
      await existing.save();
      const populated = await existing.populate([
        { path: 'from', select: 'name username email' },
        { path: 'to', select: 'name username email' },
        { path: 'projectId', select: 'title color' }
      ]);
      return res.status(200).json(populated);
    }

    const invite = await Invitation.create({
      from: req.user._id,
      to: target._id,
      projectId,
      projectRole: assignedRole,
      message: message || ''
    });
    const populated = await invite.populate([
      { path: 'from', select: 'name username email' },
      { path: 'to', select: 'name username email' },
      { path: 'projectId', select: 'title color' }
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/mine — pending invitations received by current user
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name username email')
      .populate('projectId', 'title color')
      .sort('-createdAt');
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/sent — invitations sent by current user
const getSentInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ from: req.user._id })
      .populate('to', 'name username email')
      .populate('projectId', 'title color')
      .sort('-createdAt');
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invitations/:id/respond — accept or reject
const respondToInvite = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    const invite = await Invitation.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invitation not found' });
    if (invite.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation has already been responded to' });
    }

    invite.status = status;
    await invite.save();

    if (status === 'accepted') {
      const project = await Project.findById(invite.projectId);
      if (project && !project.hasMember(req.user._id)) {
        project.members.push({ user: req.user._id, role: invite.projectRole || 'member' });
        await project.save();
      }
    }

    const populated = await invite.populate([
      { path: 'from', select: 'name username email' },
      { path: 'projectId', select: 'title color' }
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/search?q= — search ALL users (so you can invite anyone)
// Returns basic info only, not sensitive data
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('name username email').limit(8);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendInvite, getMyInvitations, getSentInvitations, respondToInvite, searchUsers };
