const WeeklyPlan = require('../../models/weeklyPlanModel');
const WorkLog    = require('../../models/workLogModel');
const WeeklyCap  = require('../../models/weeklyCapModel');
const User       = require('../../models/userModel');

const generateReport = async (req, res) => {
  try {
    const { employeeIds, weekSelections, plannedProjectsOverrides = {}, actualProjectsOverrides = {} } = req.body;
    // weekSelections: [{ year: number, weekNumber: number }]

    if (!employeeIds?.length || !weekSelections?.length) {
      return res.status(400).json({ success: false, message: 'employeeIds and weekSelections are required' });
    }

    // Restrict to only employees under this manager
    const managerEmployeeId = req.user.employeeId;
    const teamMembers = await User.find({ managerEmployeeId }).select('_id');
    const teamIds = new Set(teamMembers.map((u) => u._id.toString()));
    const allowedIds = employeeIds.filter((id) => teamIds.has(id.toString()));

    if (!allowedIds.length) {
      return res.status(403).json({ success: false, message: 'No selected employees belong to your team.' });
    }

    const employees = await User.find({ _id: { $in: allowedIds } }).select('name employeeId department');

    const reportData = await Promise.all(
      employees.map(async (emp) => {
        let totalPlannedHours   = 0;
        let totalActualHours    = 0;
        let totalAvailability   = 0;
        let totalLeaveHours     = 0;
        let totalTrainingHours  = 0;

        for (const { year, weekNumber } of weekSelections) {
          const y  = Number(year);
          const wk = Number(weekNumber);

          const plans  = await WeeklyPlan.find({ employee: emp._id, year: y, weekNumber: wk });
          const logs   = await WorkLog.find({ employee: emp._id, year: y, weekNumber: wk, status: 'submitted' });
          const cap    = await WeeklyCap.findOne({ year: y, weekNumber: wk });

          totalPlannedHours  += plans.reduce((s, p) => s + (p.plannedHours || 0), 0);
          totalActualHours   += logs.reduce((s, l) => s + (l.workedHours   || 0), 0);
          totalAvailability  += cap?.totalWeeklyHours || 0;
          totalLeaveHours    += logs.reduce((s, l) => s + (l.leaveHours    || 0), 0);
          totalTrainingHours += logs.reduce((s, l) => s + (l.trainingHours || 0), 0);
        }

        const empIdStr = emp._id.toString();
        const plannedProjects     = Number(plannedProjectsOverrides[empIdStr] ?? totalPlannedHours);
        const actualProjects      = Number(actualProjectsOverrides[empIdStr]  ?? totalActualHours);
        const absoluteAvailability = Math.ceil(totalAvailability * 0.8);

        const individualEfficiency = plannedProjects > 0
          ? Math.ceil((actualProjects / plannedProjects) * 100)
          : 0;
        const engagement = totalActualHours > 0
          ? Math.ceil((totalPlannedHours / totalActualHours) * 100)
          : 0;
        const planningEfficiency = absoluteAvailability > 0
          ? Math.ceil((totalPlannedHours / absoluteAvailability) * 100)
          : 0;
        const leavePercent    = totalAvailability > 0 ? Math.ceil((totalLeaveHours    / totalAvailability) * 100) : 0;
        const trainingPercent = totalAvailability > 0 ? Math.ceil((totalTrainingHours / totalAvailability) * 100) : 0;
        const total = planningEfficiency + leavePercent + trainingPercent;

        return {
          name:               emp.name,
          employeeId:         emp.employeeId,
          department:         emp.department,
          plan:               totalPlannedHours,
          plannedProjects,
          actual:             totalActualHours,
          actualProjects,
          availability:       totalAvailability,
          absoluteAvailability,
          leave:              totalLeaveHours,
          training:           totalTrainingHours,
          individualEfficiency,
          engagement,
          planningEfficiency,
          leavePercent,
          trainingPercent,
          total,
        };
      })
    );

    return res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error in generateReport:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = generateReport;
