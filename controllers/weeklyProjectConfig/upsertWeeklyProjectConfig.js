const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');

const upsertWeeklyProjectConfig = async (req, res) => {
  try {
    const { projectId, year, weekNumber, totalWeeklyHours, progressPercent } = req.body;

    if (!projectId || !year || !weekNumber || totalWeeklyHours === undefined) {
      return res.status(400).json({ success: false, message: 'projectId, year, weekNumber, and totalWeeklyHours are required' });
    }
    if (Number(totalWeeklyHours) < 0) {
      return res.status(400).json({ success: false, message: 'Total weekly hours cannot be negative' });
    }

    const existing = await WeeklyProjectConfig.findOne({ project: projectId, year: Number(year), weekNumber: Number(weekNumber) });

    let record;
    let isUpdate = false;
    const pct = progressPercent !== undefined ? Math.min(100, Math.max(0, Number(progressPercent))) : undefined;

    if (existing) {
      existing.totalWeeklyHours = Number(totalWeeklyHours);
      if (pct !== undefined) existing.progressPercent = pct;
      existing.updatedBy        = req.user.id;
      record    = await existing.save();
      isUpdate  = true;
    } else {
      record = await WeeklyProjectConfig.create({
        project:          projectId,
        year:             Number(year),
        weekNumber:       Number(weekNumber),
        totalWeeklyHours: Number(totalWeeklyHours),
        progressPercent:  pct ?? 0,
        createdBy:        req.user.id,
      });
    }

    return res.status(200).json({
      success: true,
      data:    record,
      isUpdate,
      message: isUpdate ? 'Weekly configuration updated' : 'Weekly configuration created',
    });
  } catch (error) {
    console.error('Error in upsertWeeklyProjectConfig:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = upsertWeeklyProjectConfig;
