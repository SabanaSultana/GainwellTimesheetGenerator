const WorkLog = require('../../models/workLogModel');
const User    = require('../../models/userModel');

const managerUpdateWorkLog = async (req, res) => {
  try {
    const {
      projectId, employeeUserId, year, weekNumber,
      workedHours = 0, trainingHours = 0, leaveHours = 0,
      justification,
    } = req.body;

    if (!projectId || !employeeUserId || !year || !weekNumber) {
      return res.status(400).json({ success: false, message: 'projectId, employeeUserId, year, and weekNumber are required' });
    }
    if (workedHours < 0 || trainingHours < 0 || leaveHours < 0) {
      return res.status(400).json({ success: false, message: 'Hours cannot be negative' });
    }

    const employee = await User.findById(employeeUserId).select('name employeeId department');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const existing = await WorkLog.findOne({
      project: projectId, employee: employeeUserId,
      year: Number(year), weekNumber: Number(weekNumber),
    });

    let record;
    if (existing) {
      const previousData = {
        workedHours:   existing.workedHours,
        trainingHours: existing.trainingHours,
        leaveHours:    existing.leaveHours,
      };
      if (!existing.editHistory) existing.editHistory = [];
      existing.editHistory.push({
        editedBy:      req.user.id,
        justification: (justification || 'Manager update').trim(),
        previousData,
        newData: { workedHours, trainingHours, leaveHours },
      });
      existing.workedHours   = Number(workedHours);
      existing.trainingHours = Number(trainingHours);
      existing.leaveHours    = Number(leaveHours);
      existing.status        = 'submitted';
      existing.submittedAt   = new Date();
      record = await existing.save();
    } else {
      record = await WorkLog.create({
        project:       projectId,
        employee:      employeeUserId,
        employeeId:    employee.employeeId,
        department:    employee.department,
        year:          Number(year),
        weekNumber:    Number(weekNumber),
        workedHours:   Number(workedHours),
        trainingHours: Number(trainingHours),
        leaveHours:    Number(leaveHours),
        status:        'submitted',
        submittedAt:   new Date(),
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in managerUpdateWorkLog:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = managerUpdateWorkLog;
