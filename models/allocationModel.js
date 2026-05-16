const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    project:             { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    employee:            { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    employeeId:          { type: String, required: true },
    department:          { type: String, required: true },
    totalAllocatedHours: { type: Number, required: true, min: 0 },
    allocatedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:              { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

allocationSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('Allocation', allocationSchema);

