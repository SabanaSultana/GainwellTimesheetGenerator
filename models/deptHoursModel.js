const mongoose = require('mongoose');

const DEPARTMENTS = [
  'Mechanical and System Integration',
  'Virtual Manufacturing',
  'Smart Manufacturing',
  'Electrical and Automation',
  'Hydraulic',
  'Engineering & System',
  'Head of Engineering',
];

const deptHoursSchema = new mongoose.Schema(
  {
    project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    totalHours: { type: Number, required: true, min: 0 },
    setBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

deptHoursSchema.index({ project: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('DeptHours', deptHoursSchema);
