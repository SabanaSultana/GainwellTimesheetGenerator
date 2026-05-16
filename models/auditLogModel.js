const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Project', 'DepartmentHours', 'Allocation', 'WeeklyPlan', 'WorkLog'],
      required: true,
    },
    entityId:  { type: mongoose.Schema.Types.ObjectId, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    editedBy: {
      userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      employeeId: String,
      name:       String,
      role:       String,
    },
    editedAt:     { type: Date, default: Date.now },
    justification:{ type: String, required: true },
    previousData: { type: mongoose.Schema.Types.Mixed },
    newData:      { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
