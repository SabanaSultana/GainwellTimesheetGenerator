const WorkLog             = require('../../models/workLogModel');
const WeeklyPlan          = require('../../models/weeklyPlanModel');
const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');
const User                = require('../../models/userModel');

const getWorkLogs = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year, weekNumber, employeeId } = req.query;

    let query = { project: projectId };
    if (year)       query.year       = Number(year);
    if (weekNumber) query.weekNumber = Number(weekNumber);
    if (employeeId) query.employeeId = employeeId;

    // Employee only sees their own logs
    if (req.user.role === 'Employee') {
      const emp = await User.findById(req.user.id).select('employeeId');
      query.employeeId = emp.employeeId;
    }

    const logs = await WorkLog.find(query)
      .populate('employee', 'name employeeId department')
      .sort({ year: -1, weekNumber: -1 });

    // Attach planned hours
    const plans = await WeeklyPlan.find({ project: projectId });
    const planMap = {};
    plans.forEach((p) => { planMap[`${p.employeeId}-${p.year}-${p.weekNumber}`] = p.plannedHours; });

    // Attach totalWeeklyHours from project config
    const configs    = await WeeklyProjectConfig.find({ project: projectId });
    const configMap  = {};
    configs.forEach((c) => { configMap[`${c.year}-${c.weekNumber}`] = c.totalWeeklyHours; });

    const enriched = logs.map((log) => ({
      ...log.toObject(),
      plannedHours:     planMap[`${log.employeeId}-${log.year}-${log.weekNumber}`] || 0,
      totalWeeklyHours: configMap[`${log.year}-${log.weekNumber}`] || 0,
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getWorkLogs:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getWorkLogs;
