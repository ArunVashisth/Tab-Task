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
    const userId = req.user._id; // ObjectId from Mongoose User document

    // All project IDs this user belongs to (as ObjectIds)
    const memberProjects = await Project.find({ 'members.user': userId }).select('_id members');

    // Separate into admin vs member-only projects
    const adminProjectIds = [];
    const memberOnlyProjectIds = [];

    for (const proj of memberProjects) {
      const membership = proj.members.find(m => m.user.toString() === userId.toString());
      if (membership && membership.role === 'admin') {
        adminProjectIds.push(proj._id);       // ObjectId
      } else {
        memberOnlyProjectIds.push(proj._id);  // ObjectId
      }
    }

    const { projectId, status, priority, assignedTo } = req.query;

    // Validate optional projectId filter belongs to user's projects
    const allMyProjectIds = [...adminProjectIds, ...memberOnlyProjectIds];
    if (projectId) {
      const isMember = allMyProjectIds.some(id => id.toString() === projectId);
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }
    }

    // Build visibility conditions:
    // Branch A — admin: see ALL tasks in their admin projects
    // Branch B — member: see ONLY tasks assigned to themselves
    let orConditions = [];

    if (adminProjectIds.length > 0) {
      const adminScope = projectId
        ? adminProjectIds.filter(id => id.toString() === projectId)
        : adminProjectIds;
      if (adminScope.length > 0) {
        orConditions.push({ projectId: { $in: adminScope } });
      }
    }

    const memberScope = projectId
      ? memberOnlyProjectIds.filter(id => id.toString() === projectId)
      : memberOnlyProjectIds;

    // Members only see tasks assigned to themselves (in member-only projects)
    // Also, even in admin projects, show tasks assigned to this user
    // (covered by the admin branch above, but safe to include for member-only scope)
    if (memberScope.length > 0) {
      orConditions.push({ projectId: { $in: memberScope }, assignedTo: userId });
    }

    // If user is admin in the filtered project, the adminScope branch already covers it.
    // If user is admin in NO project and filters by a member project, only their tasks show.
    // If there are no conditions at all, return empty.
    if (orConditions.length === 0) {
      return res.json([]);
    }

    const baseFilter = orConditions.length === 1 ? orConditions[0] : { $or: orConditions };

    if (status) baseFilter.status = status;
    if (priority) baseFilter.priority = priority;
    if (assignedTo && baseFilter.$or) {
      // Wrap existing filter so assignedTo applies on top
      const wrapped = { $and: [baseFilter, { assignedTo }] };
      const taskList = await populateTask(Task.find(wrapped).sort('-createdAt'));
      return res.json(taskList);
    }
    if (assignedTo) baseFilter.assignedTo = assignedTo;

    const taskList = await populateTask(Task.find(baseFilter).sort('-createdAt'));
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
      title,
      description,
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

    const isAdmin = memberRole === 'admin';
    const isAssignedToMe = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin) {
      // Regular members can only update tasks assigned to them
      if (!isAssignedToMe) {
        return res.status(403).json({ message: 'You can only update tasks that are assigned to you' });
      }
      // And they can only change the status field
      const keys = Object.keys(req.body);
      const hasDisallowed = keys.some(k => k !== 'status');
      if (hasDisallowed) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
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
