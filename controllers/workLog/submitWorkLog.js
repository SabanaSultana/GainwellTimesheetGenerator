const WorkLog    = require('../../models/workLogModel');
const WeeklyPlan = require('../../models/weeklyPlanModel');
const Allocation = require('../../models/allocationModel');
const User       = require('../../models/userModel');

const submitWorkLog = async (req, res) => {
  try {
    const { projectId, year, weekNumber, workedHours = 0, trainingHours = 0, leaveHours = 0, justification } = req.body;

    if (!projectId || !year || !weekNumber) {
      return res.status(400).json({ success: false, message: 'projectId, year, and weekNumber are required' });
    }
    if (workedHours < 0 || trainingHours < 0 || leaveHours < 0) {
      return res.status(400).json({ success: false, message: 'Hours cannot be negative' });
    }

    const employee = await User.findById(req.user.id).select('name employeeId department');

    // Verify allocation
    const allocation = await Allocation.findOne({ project: projectId, employee: req.user.id, status: 'active' });
    if (!allocation) {
      return res.status(403).json({ success: false, message: 'You are not allocated to this project' });
    }

    // Check weekly plan
    const plan = await WeeklyPlan.findOne({ project: projectId, employee: req.user.id, year, weekNumber });
    const plannedHours = plan?.plannedHours || 0;

    if (workedHours > plannedHours) {
      return res.status(400).json({
        success: false,
        message: `Worked hours (${workedHours}) cannot exceed planned hours (${plannedHours}) for this week`,
      });
    }

    // Check total won't exceed allocated
    const allLogs = await WorkLog.find({ project: projectId, employee: req.user.id, status: 'submitted' });
    const alreadyConsumed = allLogs
      .filter((l) => !(l.year === year && l.weekNumber === weekNumber))
      .reduce((sum, l) => sum + (l.workedHours || 0), 0);

    if (alreadyConsumed + workedHours > allocation.totalAllocatedHours) {
      return res.status(400).json({
        success: false,
        message: `Total worked hours would exceed your allocated hours (${allocation.totalAllocatedHours})`,
      });
    }

    const existing = await WorkLog.findOne({ project: projectId, employee: req.user.id, year, weekNumber });
    let record;

    if (existing) {
      if (existing.status === 'submitted' && (!justification || !justification.trim())) {
        return res.status(400).json({ success: false, message: 'Justification is required to edit a submitted log' });
      }
      const previousData = {
        workedHours:   existing.workedHours,
        trainingHours: existing.trainingHours,
        leaveHours:    existing.leaveHours,
      };
      if (justification) {
        existing.editHistory.push({
          editedBy:      req.user.id,
          justification: justification.trim(),
          previousData,
          newData: { workedHours, trainingHours, leaveHours },
        });
      }
      existing.workedHours   = workedHours;
      existing.trainingHours = trainingHours;
      existing.leaveHours    = leaveHours;
      existing.status        = 'submitted';
      existing.submittedAt   = new Date();
      record = await existing.save();
    } else {
      record = await WorkLog.create({
        project:       projectId,
        employee:      req.user.id,
        employeeId:    employee.employeeId,
        department:    employee.department,
        year,
        weekNumber,
        workedHours,
        trainingHours,
        leaveHours,
        status:        'submitted',
        submittedAt:   new Date(),
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in submitWorkLog:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = submitWorkLog;
