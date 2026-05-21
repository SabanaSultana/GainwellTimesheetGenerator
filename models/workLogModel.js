const mongoose = require('mongoose');

const editEntrySchema = new mongoose.Schema(
  {
    editedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt:     { type: Date, default: Date.now },
    justification:String,
    previousData: mongoose.Schema.Types.Mixed,
    newData:      mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const workLogSchema = new mongoose.Schema(
  {
    project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    employeeId:    { type: String, required: true },
    department:    { type: String, required: true },
    year:          { type: Number, required: true },
    weekNumber:    { type: Number, required: true, min: 1, max: 53 },
    workedHours:     { type: Number, default: 0, min: 0 },
    trainingHours:   { type: Number, default: 0, min: 0 },
    leaveHours:      { type: Number, default: 0, min: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    submittedAt:     { type: Date },
    remarks:         { type: String, default: '' },
    status:          { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    editHistory:   [editEntrySchema],
  },
  { timestamps: true }
);

workLogSchema.index(
  { project: 1, employee: 1, year: 1, weekNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('WorkLog', workLogSchema);
