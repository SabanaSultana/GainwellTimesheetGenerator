const DeptHours = require('../../models/deptHoursModel');
const AuditLog  = require('../../models/auditLogModel');
const User      = require('../../models/userModel');

const upsertDeptHours = async (req, res) => {
  try {
    const { projectId, department, totalHours, justification } = req.body;

    if (!projectId || !department || totalHours === undefined) {
      return res.status(400).json({
        success: false,
        message: 'projectId, department, and totalHours are required',
      });
    }
    if (!justification || !justification.trim()) {
      return res.status(400).json({ success: false, message: 'Justification is required' });
    }
    if (totalHours < 0) {
      return res.status(400).json({ success: false, message: 'Hours cannot be negative' });
    }

    const editor = await User.findById(req.user.id).select('name employeeId role department');

    // Manager(COE) can only set hours for their own department
    if (editor.role === 'Manager(COE)' && editor.department !== department) {
      return res.status(403).json({
        success: false,
        message: 'You can only set hours for your own department',
      });
    }

    const existing = await DeptHours.findOne({ project: projectId, department });
    let previousData = null;
    let record;
    let action;

    if (existing) {
      previousData = { totalHours: existing.totalHours };
      existing.totalHours = totalHours;
      existing.updatedBy  = req.user.id;
      record = await existing.save();
      action = 'update';
    } else {
      record = await DeptHours.create({
        project:    projectId,
        department,
        totalHours,
        setBy:      req.user.id,
        updatedBy:  req.user.id,
      });
      action = 'create';
    }

    await AuditLog.create({
      entityType: 'DepartmentHours',
      entityId:   record._id,
      projectId:  projectId,
      action,
      editedBy: {
        userId:     req.user.id,
        employeeId: editor.employeeId,
        name:       editor.name,
        role:       editor.role,
      },
      justification: justification.trim(),
      previousData,
      newData: { department, totalHours },
    });

    const populated = await DeptHours.findById(record._id)
      .populate('setBy',     'name employeeId')
      .populate('updatedBy', 'name employeeId');

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error in upsertDeptHours:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = upsertDeptHours;
