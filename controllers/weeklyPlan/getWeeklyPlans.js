const WeeklyPlan = require('../../models/weeklyPlanModel');
const WorkLog    = require('../../models/workLogModel');
const User       = require('../../models/userModel');

const getWeeklyPlans = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year, weekNumber } = req.query;

    let query = { project: projectId };
    if (year)       query.year       = Number(year);
    if (weekNumber) query.weekNumber = Number(weekNumber);

    // Employee only sees their own plans
    if (req.user.role === 'Employee') {
      query.employee = req.user.id;
    }

    const plans = await WeeklyPlan.find(query)
      .populate('employee',  'name employeeId department')
      .populate('plannedBy', 'name employeeId')
      .sort({ year: -1, weekNumber: -1 });

    // Pair with work logs
    let logQuery = { project: projectId };
    if (year)       logQuery.year       = Number(year);
    if (weekNumber) logQuery.weekNumber = Number(weekNumber);
    if (req.user.role === 'Employee') logQuery.employee = req.user.id;

    const logs = await WorkLog.find(logQuery);
    const logMap = {};
    logs.forEach((l) => {
      logMap[`${l.employeeId}-${l.year}-${l.weekNumber}`] = l;
    });

    const enriched = plans.map((plan) => {
      const log = logMap[`${plan.employeeId}-${plan.year}-${plan.weekNumber}`] || {};
      return {
        ...plan.toObject(),
        workedHours:   log.workedHours   || 0,
        trainingHours: log.trainingHours || 0,
        leaveHours:    log.leaveHours    || 0,
        logStatus:     log.status        || 'not submitted',
        remainingHours: Math.max(0, plan.plannedHours - (log.workedHours || 0)),
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getWeeklyPlans:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getWeeklyPlans;
