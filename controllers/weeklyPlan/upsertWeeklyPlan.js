const WeeklyPlan = require('../../models/weeklyPlanModel');
const Allocation = require('../../models/allocationModel');
const AuditLog   = require('../../models/auditLogModel');
const User       = require('../../models/userModel');

const upsertWeeklyPlan = async (req, res) => {
  try {
    const { projectId, employeeUserId, year, weekNumber, plannedHours, justification } = req.body;

    if (!projectId || !employeeUserId || !year || !weekNumber || plannedHours === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (plannedHours < 0) {
      return res.status(400).json({ success: false, message: 'Hours cannot be negative' });
    }

    // Verify employee is allocated to this project
    const allocation = await Allocation.findOne({
      project:  projectId,
      employee: employeeUserId,
      status:   'active',
    });
    if (!allocation) {
      return res.status(400).json({ success: false, message: 'Employee is not allocated to this project' });
    }

    // Ensure total planned hours (excluding current week) + new hours ≤ allocated hours
    const allPlans = await WeeklyPlan.find({ project: projectId, employee: employeeUserId });
    const currentPlan = allPlans.find(
      (p) => p.year === year && p.weekNumber === weekNumber
    );
    const otherPlannedTotal = allPlans
      .filter((p) => !(p.year === year && p.weekNumber === weekNumber))
      .reduce((sum, p) => sum + p.plannedHours, 0);

    if (otherPlannedTotal + plannedHours > allocation.totalAllocatedHours) {
      return res.status(400).json({
        success: false,
        message: `Total planned hours (${otherPlannedTotal + plannedHours}) would exceed allocated hours (${allocation.totalAllocatedHours})`,
      });
    }

    const editor = await User.findById(req.user.id).select('name employeeId role');
    let record;
    let previousData = null;
    let action;

    if (currentPlan) {
      previousData = { plannedHours: currentPlan.plannedHours };
      currentPlan.plannedHours = plannedHours;
      currentPlan.plannedBy    = req.user.id;
      record = await currentPlan.save();
      action = 'update';
    } else {
      record = await WeeklyPlan.create({
        project:      projectId,
        employee:     employeeUserId,
        employeeId:   allocation.employeeId,
        year,
        weekNumber,
        plannedHours,
        plannedBy:    req.user.id,
      });
      action = 'create';
    }

    await AuditLog.create({
      entityType: 'WeeklyPlan',
      entityId:   record._id,
      projectId:  projectId,
      action,
      editedBy: {
        userId:     req.user.id,
        employeeId: editor.employeeId,
        name:       editor.name,
        role:       editor.role,
      },
      justification: (justification || `Set ${plannedHours}h for week ${weekNumber}/${year}`).trim(),
      previousData,
      newData: { year, weekNumber, plannedHours },
    });

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in upsertWeeklyPlan:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = upsertWeeklyPlan;
