const express = require('express');
const router = express.Router();
const { getAllUsers, getMeWithProjects, updateProfile, updatePassword, uploadAvatar, deleteAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', getAllUsers);
router.get('/me-with-projects', getMeWithProjects);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);

module.exports = router;
