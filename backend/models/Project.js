const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  members: [memberSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold'],
    default: 'active'
  },
  color: {
    type: String,
    default: '#2563EB'
  }
}, { timestamps: true });

const resolveId = (val) => (val && val._id ? val._id.toString() : val ? val.toString() : null);

projectSchema.methods.hasMember = function(userId) {
  const uid = userId.toString();
  return this.members.some(m => resolveId(m.user) === uid);
};

projectSchema.methods.getMemberRole = function(userId) {
  const uid = userId.toString();
  const m = this.members.find(m => resolveId(m.user) === uid);
  return m ? m.role : null;
};

module.exports = mongoose.model('Project', projectSchema);
