const Task = require('../models/Task');
const Project = require('../models/Project');

const populateTask = (query) =>
  query
    .populate('assignedTo', 'name email username')
    .populate('projectId', 'title color')
    .populate('createdBy', 'name');

const getMyProjectIds = async (userId) => {
  const projects = await Project.find({ 'members.user': userId }).select('_id');
  return projects.map(p => p._id);
};

const getAllTasks = async (req, res) => {
  try {
    const myProjectIds = await getMyProjectIds(req.user._id);
    const { projectId, status, priority, assignedTo } = req.query;
    const filter = { projectId: { $in: myProjectIds } };
    if (projectId) {
      if (!myProjectIds.some(id => id.toString() === projectId)) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }
      filter.projectId = projectId;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    const taskList = await populateTask(Task.find(filter).sort('-createdAt'));
    res.json(taskList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and project are required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberRole = project.getMemberRole(req.user._id);
    if (!memberRole) return res.status(403).json({ message: 'You are not a member of this project' });
    if (memberRole !== 'admin') return res.status(403).json({ message: 'Only project admins can create tasks' });
    const newTask = await Task.create({
      title, description,
      projectId,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdBy: req.user._id
    });
    const populated = await populateTask(Task.findById(newTask._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberRole = project.getMemberRole(req.user._id);
    if (!memberRole) return res.status(403).json({ message: 'You are not a member of this project' });
    if (memberRole === 'member') {
      const keys = Object.keys(req.body);
      const hasDisallowed = keys.some(k => !['status'].includes(k));
      if (hasDisallowed) return res.status(403).json({ message: 'Members can only update task status' });
    }
    const updated = await populateTask(
      Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberRole = project.getMemberRole(req.user._id);
    if (memberRole !== 'admin') return res.status(403).json({ message: 'Only project admins can delete tasks' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
