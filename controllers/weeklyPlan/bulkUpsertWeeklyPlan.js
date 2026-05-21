const WeeklyPlan          = require('../../models/weeklyPlanModel');
const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');
const WeeklyCap           = require('../../models/weeklyCapModel');
const AuditLog            = require('../../models/auditLogModel');
const User                = require('../../models/userModel');
const mongoose            = require('mongoose');

const bulkUpsertWeeklyPlan = async (req, res) => {
  try {
    const { projectId, year, weekNumber, totalWeeklyHours, employees, justification } = req.body;

    if (!projectId || !year || !weekNumber || totalWeeklyHours === undefined || !Array.isArray(employees)) {
      return res.status(400).json({ success: false, message: 'projectId, year, weekNumber, totalWeeklyHours, and employees[] are required' });
    }
    if (Number(totalWeeklyHours) < 0) {
      return res.status(400).json({ success: false, message: 'Total weekly hours cannot be negative' });
    }

    // Each employee's planned hours must not exceed totalWeeklyHours
    const overLimit = employees.filter((e) => Number(e.plannedHours || 0) > Number(totalWeeklyHours));
    if (overLimit.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some employees have planned hours exceeding the weekly limit of ${totalWeeklyHours}h. Reduce their hours before saving.`,
      });
    }

    const editor = await User.findById(req.user.id).select('name employeeId role');

    // Manager(COE): all employees in the request must be their own direct reports
    if (req.user.role === 'Manager(COE)') {
      const mgr       = await User.findById(req.user.id).select('employeeId');
      const reports   = await User.find({ managerEmployeeId: mgr.employeeId }).select('_id');
      const reportSet = new Set(reports.map((r) => r._id.toString()));
      const blocked   = employees.filter((e) => e.employeeUserId && !reportSet.has(e.employeeUserId));
      if (blocked.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign plans for your own direct reports.',
        });
      }
    }

    // Upsert global WeeklyCap for this year+week
    let weeklyCap = await WeeklyCap.findOne({ year: Number(year), weekNumber: Number(weekNumber) });
    if (weeklyCap) {
      weeklyCap.totalWeeklyHours = Number(totalWeeklyHours);
      weeklyCap.updatedBy        = req.user.id;
      await weeklyCap.save();
    } else {
      weeklyCap = await WeeklyCap.create({
        year: Number(year), weekNumber: Number(weekNumber),
        totalWeeklyHours: Number(totalWeeklyHours),
        createdBy: req.user.id,
      });
    }

    // Validate: each employee's total planned hours this week (all projects) must not exceed WeeklyCap
    const empIds = employees
      .filter((e) => e.employeeUserId && mongoose.Types.ObjectId.isValid(e.employeeUserId))
      .map((e) => new mongoose.Types.ObjectId(e.employeeUserId));

    if (empIds.length > 0) {
      const otherAgg = await WeeklyPlan.aggregate([
        {
          $match: {
            employee:   { $in: empIds },
            year:       Number(year),
            weekNumber: Number(weekNumber),
            project:    { $ne: new mongoose.Types.ObjectId(projectId) },
          },
        },
        { $group: { _id: '$employee', total: { $sum: '$plannedHours' } } },
      ]);
      const otherMap = {};
      otherAgg.forEach((r) => { otherMap[r._id.toString()] = r.total; });

      const violations = employees.filter((e) => {
        const already = otherMap[e.employeeUserId] || 0;
        return already + Number(e.plannedHours || 0) > Number(totalWeeklyHours);
      });

      if (violations.length > 0) {
        const names = await Promise.all(
          violations.map((e) => User.findById(e.employeeUserId).select('name').then((u) => u?.name || e.employeeUserId))
        );
        return res.status(400).json({
          success: false,
          message: `These employees would exceed the ${totalWeeklyHours}h weekly cap: ${names.join(', ')}. Reduce their planned hours.`,
        });
      }
    }

    // Upsert WeeklyProjectConfig
    let config    = await WeeklyProjectConfig.findOne({ project: projectId, year: Number(year), weekNumber: Number(weekNumber) });
    const configExists = !!config;
    if (config) {
      config.totalWeeklyHours = Number(totalWeeklyHours);
      config.updatedBy        = req.user.id;
      await config.save();
    } else {
      config = await WeeklyProjectConfig.create({
        project: projectId, year: Number(year), weekNumber: Number(weekNumber),
        totalWeeklyHours: Number(totalWeeklyHours), createdBy: req.user.id,
      });
    }

    const results = [];
    for (const emp of employees) {
      const { employeeUserId, plannedHours } = emp;
      if (!employeeUserId) continue;

      // Get employeeId from User (works even without an allocation)
      const empUser = await User.findById(employeeUserId).select('employeeId department');
      if (!empUser) continue;

      const existing = await WeeklyPlan.findOne({ project: projectId, employee: employeeUserId, year: Number(year), weekNumber: Number(weekNumber) });
      let record;
      let action;

      if (existing) {
        const previousData    = { plannedHours: existing.plannedHours };
        existing.plannedHours = Number(plannedHours);
        existing.plannedBy    = req.user.id;
        record = await existing.save();
        action = 'update';

        await AuditLog.create({
          entityType: 'WeeklyPlan', entityId: record._id, projectId,
          action,
          editedBy:  { userId: req.user.id, employeeId: editor.employeeId, name: editor.name, role: editor.role },
          justification: (justification || `Planned ${plannedHours}h for week ${weekNumber}/${year}`).trim(),
          previousData,
          newData: { year: Number(year), weekNumber: Number(weekNumber), plannedHours: Number(plannedHours) },
        });
      } else {
        record = await WeeklyPlan.create({
          project:    projectId,
          employee:   employeeUserId,
          employeeId: empUser.employeeId,
          year:       Number(year),
          weekNumber: Number(weekNumber),
          plannedHours: Number(plannedHours),
          plannedBy:  req.user.id,
        });
        action = 'create';

        await AuditLog.create({
          entityType: 'WeeklyPlan', entityId: record._id, projectId,
          action,
          editedBy:  { userId: req.user.id, employeeId: editor.employeeId, name: editor.name, role: editor.role },
          justification: (justification || `Planned ${plannedHours}h for week ${weekNumber}/${year}`).trim(),
          previousData: null,
          newData: { year: Number(year), weekNumber: Number(weekNumber), plannedHours: Number(plannedHours) },
        });
      }
      results.push(record);
    }

    return res.status(200).json({
      success:     true,
      data:        results,
      configExists,
      message:     configExists
        ? `Weekly plan already existed for this Project + Year ${year} + Week ${weekNumber}. Data has been updated.`
        : 'Weekly plan created successfully.',
    });
  } catch (error) {
    console.error('Error in bulkUpsertWeeklyPlan:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = bulkUpsertWeeklyPlan;
