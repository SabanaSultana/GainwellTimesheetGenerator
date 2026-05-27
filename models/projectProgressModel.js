const mongoose = require('mongoose');

const DEPARTMENTS = [
  'Mechanical And System Integration',
  'Virtual Engineering Manufacturing',
  'Lean Manufacturing & Tool Design',
  'Electrical And Automation',
  'Hydraulics System Design',
  'Digital Tech. & Program Management',
];

const projectProgressSchema = new mongoose.Schema(
  {
    project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    progress:   { type: Number, required: true, min: 0, max: 100, default: 0 },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

projectProgressSchema.index({ project: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('ProjectProgress', projectProgressSchema);
