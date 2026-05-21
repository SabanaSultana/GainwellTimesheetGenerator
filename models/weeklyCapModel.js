const mongoose = require('mongoose');

const weeklyCapSchema = new mongoose.Schema(
  {
    year:             { type: Number, required: true },
    weekNumber:       { type: Number, required: true, min: 1, max: 53 },
    totalWeeklyHours: { type: Number, required: true, min: 0 },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

weeklyCapSchema.index({ year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyCap', weeklyCapSchema);
