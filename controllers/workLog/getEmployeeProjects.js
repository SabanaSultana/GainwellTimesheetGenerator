const Allocation = require('../../models/allocationModel');
const WorkLog    = require('../../models/workLogModel');
const WeeklyPlan = require('../../models/weeklyPlanModel');
const Project    = require('../../models/projectModel');
const User       = require('../../models/userModel');

// ISO-compatible current week number
function currentISOWeek() {
  const now = new Date();
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - jan1) / 86400000) + 1;
  return Math.ceil((dayOfYear + jan1.getUTCDay()) / 7);
}

const getEmployeeProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const weekNo = currentISOWeek();

    // Employee's own user record (for department fallback)
    const empUser = await User.findById(userId).select('department');

    // ── 1. Active allocations ──────────────────────────────────────────────
    const allocations = await Allocation.find({ employee: userId, status: 'active' })
      .populate('project', 'projectCode projectName projectDescription startDate endDate')
      .populate('allocatedBy', 'name employeeId');

    const allocatedProjectIds = new Set(allocations.map((a) => String(a.project._id)));

    const enrichAllocation = async (a) => {
      const [allLogs, plans] = await Promise.all([
        WorkLog.find({ project: a.project._id, employee: userId }),
        WeeklyPlan.find({ project: a.project._id, employee: userId }),
      ]);
      const submittedLogs  = allLogs.filter((l) => l.status === 'submitted');
      const consumedHours  = submittedLogs.reduce((sum, l) => sum + (l.workedHours || 0), 0);
      const totalWeeks     = plans.length;
      const submittedWeeks = submittedLogs.length;
      const pendingWeeks   = Math.max(0, totalWeeks - submittedWeeks);
      const currentPlan    = plans.find((p) => p.year === now.getFullYear() && p.weekNumber === weekNo);
      return {
        allocationId:        String(a._id),
        project:             a.project,
        department:          a.department,
        totalAllocatedHours: a.totalAllocatedHours,
        consumedHours,
        remainingHours:      Math.max(0, a.totalAllocatedHours - consumedHours),
        currentWeekPlan:     currentPlan ? currentPlan.plannedHours : 0,
        allocatedBy:         a.allocatedBy,
        totalWeeks,
        submittedWeeks,
        pendingWeeks,
      };
    };

    // ── 2. Projects via WeeklyPlan that have NO active allocation ──────────
    const planProjectIds     = await WeeklyPlan.distinct('project', { employee: userId });
    const unallocatedIds     = planProjectIds.filter((id) => !allocatedProjectIds.has(String(id)));

    const enrichPlanProject = async (projectId) => {
      const project = await Project.findById(projectId)
        .select('projectCode projectName projectDescription startDate endDate');
      if (!project) return null;
      const [allLogs, plans] = await Promise.all([
        WorkLog.find({ project: projectId, employee: userId }),
        WeeklyPlan.find({ project: projectId, employee: userId }),
      ]);
      const submittedLogs  = allLogs.filter((l) => l.status === 'submitted');
      const consumedHours  = submittedLogs.reduce((sum, l) => sum + (l.workedHours || 0), 0);
      const totalWeeks     = plans.length;
      const submittedWeeks = submittedLogs.length;
      const pendingWeeks   = Math.max(0, totalWeeks - submittedWeeks);
      const currentPlan    = plans.find((p) => p.year === now.getFullYear() && p.weekNumber === weekNo);
      return {
        allocationId:        `plan_${String(projectId)}`,
        project,
        department:          empUser?.department || '',
        totalAllocatedHours: 0,
        consumedHours,
        remainingHours:      0,
        currentWeekPlan:     currentPlan ? currentPlan.plannedHours : 0,
        allocatedBy:         null,
        totalWeeks,
        submittedWeeks,
        pendingWeeks,
      };
    };

    const [allocEnriched, planEnriched] = await Promise.all([
      Promise.all(allocations.map(enrichAllocation)),
      Promise.all(unallocatedIds.map(enrichPlanProject)),
    ]);

    const data = [...allocEnriched, ...planEnriched.filter(Boolean)];

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getEmployeeProjects:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getEmployeeProjects;
