const express = require('express');
const router = express.Router();
const {
  getAllProjects, createProject, updateProject, deleteProject,
  getProjectById, updateMemberRole, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllProjects);
router.post('/', createProject);           // any authenticated user can create a project
router.get('/:id', getProjectById);
router.put('/:id', updateProject);         // project admin only (enforced in controller)
router.delete('/:id', deleteProject);      // project creator/admin (enforced in controller)

router.put('/:id/members/:userId/role', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
