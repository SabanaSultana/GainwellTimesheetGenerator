const Allocation = require('../../models/allocationModel');
const WorkLog    = require('../../models/workLogModel');
const WeeklyPlan = require('../../models/weeklyPlanModel');

const getEmployeeProjects = async (req, res) => {
  try {
    const allocations = await Allocation.find({ employee: req.user.id, status: 'active' })
      .populate('project', 'projectCode projectName projectDescription startDate endDate')
      .populate('allocatedBy', 'name employeeId');

    const enriched = await Promise.all(
      allocations.map(async (a) => {
        const logs = await WorkLog.find({ project: a.project._id, employee: req.user.id, status: 'submitted' });
        const consumedHours = logs.reduce((sum, l) => sum + (l.workedHours || 0), 0);

        // Current week plan
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNo = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        const currentPlan = await WeeklyPlan.findOne({
          project:    a.project._id,
          employee:   req.user.id,
          year:       now.getFullYear(),
          weekNumber: weekNo,
        });

        return {
          allocationId:        a._id,
          project:             a.project,
          department:          a.department,
          totalAllocatedHours: a.totalAllocatedHours,
          consumedHours,
          remainingHours:      Math.max(0, a.totalAllocatedHours - consumedHours),
          currentWeekPlan:     currentPlan ? currentPlan.plannedHours : 0,
          allocatedBy:         a.allocatedBy,
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getEmployeeProjects:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getEmployeeProjects;
