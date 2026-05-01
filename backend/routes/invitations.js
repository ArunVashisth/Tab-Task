const express = require('express');
const router = express.Router();
const { sendInvite, getMyInvitations, getSentInvitations, respondToInvite, searchUsers } = require('../controllers/invitationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/mine', getMyInvitations);
router.get('/sent', getSentInvitations);
router.get('/search', searchUsers);
router.post('/send', sendInvite);
router.put('/:id/respond', respondToInvite);

module.exports = router;
