const Allocation = require('../../models/allocationModel');
const AuditLog   = require('../../models/auditLogModel');
const User       = require('../../models/userModel');
const DeptHours  = require('../../models/deptHoursModel');

const allocateEmployee = async (req, res) => {
  try {
    const { projectId, employeeUserId, totalAllocatedHours, justification } = req.body;

    if (!projectId || !employeeUserId || totalAllocatedHours === undefined) {
      return res.status(400).json({
        success: false,
        message: 'projectId, employeeUserId, and totalAllocatedHours are required',
      });
    }
    if (!justification || !justification.trim()) {
      return res.status(400).json({ success: false, message: 'Justification is required' });
    }
    if (totalAllocatedHours <= 0) {
      return res.status(400).json({ success: false, message: 'Hours must be greater than 0' });
    }

    const manager  = await User.findById(req.user.id).select('name employeeId role department');
    const employee = await User.findById(employeeUserId).select('name employeeId department role');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Manager(COE) can only allocate employees from their own department
    if (manager.role === 'Manager(COE)' && employee.department !== manager.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only allocate employees from your own department',
      });
    }

    // Validate against departmental hours cap
    const deptHoursRecord = await DeptHours.findOne({ project: projectId, department: employee.department });
    if (deptHoursRecord) {
      const otherAllocations = await Allocation.find({
        project:    projectId,
        department: employee.department,
        status:     'active',
        employee:   { $ne: employeeUserId },
      });
      const currentTotal = otherAllocations.reduce((sum, a) => sum + a.totalAllocatedHours, 0);
      if (currentTotal + Number(totalAllocatedHours) > deptHoursRecord.totalHours) {
        const remaining = deptHoursRecord.totalHours - currentTotal;
        return res.status(400).json({
          success: false,
          message: `Employee allocation exceeds departmental allocated hours. Remaining capacity for ${employee.department}: ${remaining}h. Please update departmental hours first if you need more.`,
        });
      }
    }

    const existing = await Allocation.findOne({ project: projectId, employee: employeeUserId });
    let record;
    let previousData = null;
    let action;

    if (existing) {
      previousData = { totalAllocatedHours: existing.totalAllocatedHours, status: existing.status };
      existing.totalAllocatedHours = totalAllocatedHours;
      existing.status      = 'active';
      existing.allocatedBy = req.user.id;
      record = await existing.save();
      action = 'update';
    } else {
      record = await Allocation.create({
        project:             projectId,
        employee:            employeeUserId,
        employeeId:          employee.employeeId,
        department:          employee.department,
        totalAllocatedHours,
        allocatedBy:         req.user.id,
      });
      action = 'create';
    }

    await AuditLog.create({
      entityType: 'Allocation',
      entityId:   record._id,
      projectId:  projectId,
      action,
      editedBy: {
        userId:     req.user.id,
        employeeId: manager.employeeId,
        name:       manager.name,
        role:       manager.role,
      },
      justification: justification.trim(),
      previousData,
      newData: { employeeId: employee.employeeId, department: employee.department, totalAllocatedHours },
    });

    const populated = await Allocation.findById(record._id)
      .populate('employee',    'name employeeId department role')
      .populate('allocatedBy', 'name employeeId');

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error in allocateEmployee:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = allocateEmployee;
