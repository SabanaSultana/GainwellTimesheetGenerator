const mongoose = require('mongoose');

const weeklyProjectConfigSchema = new mongoose.Schema(
  {
    project:          { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    year:             { type: Number, required: true },
    weekNumber:       { type: Number, required: true, min: 1, max: 53 },
    totalWeeklyHours:  { type: Number, required: true, min: 0 },
    progressPercent:   { type: Number, default: 0, min: 0, max: 100 },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

weeklyProjectConfigSchema.index({ project: 1, year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyProjectConfig', weeklyProjectConfigSchema);
