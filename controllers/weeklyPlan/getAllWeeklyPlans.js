const WeeklyPlan          = require('../../models/weeklyPlanModel');
const WorkLog             = require('../../models/workLogModel');
const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');
const User                = require('../../models/userModel');

const getAllWeeklyPlans = async (req, res) => {
  try {
    const { year, weekNumber, employeeName, projectName } = req.query;

    const planQuery = {};
    if (year)       planQuery.year       = Number(year);
    if (weekNumber) planQuery.weekNumber = Number(weekNumber);

    // Manager(COE) sees only their own direct reports' plans (scoped by managerEmployeeId)
    if (req.user.role === 'Manager(COE)') {
      const mgr     = await User.findById(req.user.id).select('employeeId');
      const reports = await User.find({ managerEmployeeId: mgr.employeeId }).select('_id');
      if (reports.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      planQuery.employee = { $in: reports.map((e) => e._id) };
    }
    // Head of Engineering / Admin see all plans — no additional filter

    let plans = await WeeklyPlan.find(planQuery)
      .populate('employee',  'name employeeId department')
      .populate('project',   'projectCode projectName')
      .populate('plannedBy', 'name employeeId')
      .sort({ year: -1, weekNumber: -1 });

    // Text filters applied after populate
    if (employeeName) {
      const q = employeeName.toLowerCase();
      plans = plans.filter((p) => p.employee?.name?.toLowerCase().includes(q));
    }
    if (projectName) {
      const q = projectName.toLowerCase();
      plans = plans.filter((p) =>
        p.project?.projectName?.toLowerCase().includes(q) ||
        p.project?.projectCode?.toLowerCase().includes(q)
      );
    }

    // Sort alphabetically by employee name
    plans.sort((a, b) => (a.employee?.name || '').localeCompare(b.employee?.name || ''));

    // Gather projectIds and build log map
    const projectIds = [...new Set(plans.map((p) => p.project?._id?.toString()).filter(Boolean))];
    const logFilter  = { project: { $in: projectIds } };
    if (year)       logFilter.year       = Number(year);
    if (weekNumber) logFilter.weekNumber = Number(weekNumber);
    const logs   = await WorkLog.find(logFilter);
    const logMap = {};
    logs.forEach((l) => {
      logMap[`${l.employeeId}-${l.project}-${l.year}-${l.weekNumber}`] = l;
    });

    // WeeklyProjectConfig map
    const configFilter = { project: { $in: projectIds } };
    if (year)       configFilter.year       = Number(year);
    if (weekNumber) configFilter.weekNumber = Number(weekNumber);
    const configs    = await WeeklyProjectConfig.find(configFilter);
    const configMap  = {};
    configs.forEach((c) => {
      configMap[`${c.project}-${c.year}-${c.weekNumber}`] = c.totalWeeklyHours;
    });

    const enriched = plans.map((plan) => {
      const log = logMap[`${plan.employeeId}-${plan.project?._id}-${plan.year}-${plan.weekNumber}`] || {};
      return {
        ...plan.toObject(),
        workedHours:      log.workedHours      || 0,
        trainingHours:    log.trainingHours    || 0,
        leaveHours:       log.leaveHours       || 0,
        progressPercent:  log.progressPercent  || 0,
        logStatus:        log.status           || 'not submitted',
        totalWeeklyHours: configMap[`${plan.project?._id}-${plan.year}-${plan.weekNumber}`] || 0,
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getAllWeeklyPlans:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getAllWeeklyPlans;
