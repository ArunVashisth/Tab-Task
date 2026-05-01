const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  // Role the invitee will have in the project upon accepting
  projectRole: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Prevent duplicate pending invites (same from+to+project)
invitationSchema.index({ from: 1, to: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', invitationSchema);
