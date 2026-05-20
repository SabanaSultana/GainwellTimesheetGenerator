const WeeklyPlan          = require('../../models/weeklyPlanModel');
const WorkLog             = require('../../models/workLogModel');
const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');
const User                = require('../../models/userModel');

const getWeeklySummary = async (req, res) => {
  try {
    const { year, weekNumber } = req.query;
    if (!year || !weekNumber) {
      return res.status(400).json({ success: false, message: 'year and weekNumber are required' });
    }

    const y  = Number(year);
    const wk = Number(weekNumber);

    let empFilter = {};
    if (req.user.role === 'Manager(COE)') {
      const manager      = await User.findById(req.user.id).select('department');
      const deptEmployees = await User.find({ department: manager.department, role: 'Employee' }).select('_id');
      empFilter = { employee: { $in: deptEmployees.map((e) => e._id) } };
    }

    const plans   = await WeeklyPlan.find({ year: y, weekNumber: wk, ...empFilter });
    const logs    = await WorkLog.find({ year: y, weekNumber: wk, status: 'submitted', ...empFilter });
    const configs = await WeeklyProjectConfig.find({ year: y, weekNumber: wk });

    const totalAllocatedWeeklyHours = configs.reduce((s, c) => s + c.totalWeeklyHours, 0);
    const totalPlannedHours         = plans.reduce((s, p) => s + p.plannedHours, 0);
    const totalActualHours          = logs.reduce((s, l) => s + (l.workedHours   || 0), 0);
    const totalLeaveHours           = logs.reduce((s, l) => s + (l.leaveHours    || 0), 0);
    const totalTrainingHours        = logs.reduce((s, l) => s + (l.trainingHours || 0), 0);

    const utilization = totalPlannedHours > 0
      ? Math.round((totalActualHours / totalPlannedHours) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        year: y, weekNumber: wk,
        totalAllocatedWeeklyHours,
        totalPlannedHours,
        totalActualHours,
        totalLeaveHours,
        totalTrainingHours,
        utilization,
        employeeCount: [...new Set(plans.map((p) => p.employee?.toString()))].length,
        projectCount:  [...new Set(plans.map((p) => p.project?.toString()))].length,
      },
    });
  } catch (error) {
    console.error('Error in getWeeklySummary:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getWeeklySummary;
