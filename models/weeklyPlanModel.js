const mongoose = require('mongoose');

const weeklyPlanSchema = new mongoose.Schema(
  {
    project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    employeeId:   { type: String, required: true },
    year:         { type: Number, required: true },
    weekNumber:   { type: Number, required: true, min: 1, max: 53 },
    plannedHours: { type: Number, required: true, min: 0 },
    plannedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

weeklyPlanSchema.index(
  { project: 1, employee: 1, year: 1, weekNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
