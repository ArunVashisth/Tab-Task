const Project = require('../models/Project');
const Task = require('../models/Task');

const getMyProjectIds = async (userId) => {
  const projects = await Project.find({ 'members.user': userId }).select('_id');
  return projects.map(p => p._id);
};

const populateProject = (query) =>
  query
    .populate('createdBy', 'name email username')
    .populate('members.user', 'name email username');

const getAllProjects = async (req, res) => {
  try {
    const projects = await populateProject(
      Project.find({ 'members.user': req.user._id }).sort('-createdAt')
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await populateProject(
      Project.findOne({ _id: req.params.id, 'members.user': req.user._id })
    );
    if (!project) {
      const exists = await Project.exists({ _id: req.params.id });
      if (!exists) return res.status(404).json({ message: 'Project not found' });
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const project = await Project.create({
      title,
      description: description || '',
      color: color || '#2563EB',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    const populated = await populateProject(Project.findById(project._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberRole = project.getMemberRole(req.user._id);
    if (!memberRole) return res.status(403).json({ message: 'You are not a member of this project' });
    if (memberRole !== 'admin') return res.status(403).json({ message: 'Only project admins can edit this project' });
    const { title, description, color, status } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (color) updates.color = color;
    if (status) updates.status = status;
    const updated = await populateProject(
      Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberRole = project.getMemberRole(req.user._id);
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    if (!isCreator && memberRole !== 'admin') {
      return res.status(403).json({ message: 'Only the project creator or admin can delete this project' });
    }
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or member' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const callerRole = project.getMemberRole(req.user._id);
    if (callerRole !== 'admin') {
      return res.status(403).json({ message: 'Only project admins can change member roles' });
    }
    const memberIndex = project.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) return res.status(404).json({ message: 'Member not found in project' });
    project.members[memberIndex].role = role;
    await project.save();
    const populated = await populateProject(Project.findById(project._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const callerRole = project.getMemberRole(req.user._id);
    const isSelf = req.params.userId === req.user._id.toString();
    if (!isSelf && callerRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }
    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllProjects, createProject, updateProject, deleteProject, getProjectById, updateMemberRole, removeMember };
