const Allocation = require('../../models/allocationModel');
const AuditLog   = require('../../models/auditLogModel');
const User       = require('../../models/userModel');

const removeAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { justification } = req.body;

    if (!justification || !justification.trim()) {
      return res.status(400).json({ success: false, message: 'Justification is required' });
    }

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const manager = await User.findById(req.user.id).select('name employeeId role department');

    // Manager(COE) can only remove allocations from their own department
    if (manager.role === 'Manager(COE)' && allocation.department !== manager.department) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const previousData = allocation.toObject();
    allocation.status = 'inactive';
    await allocation.save();

    await AuditLog.create({
      entityType: 'Allocation',
      entityId:   allocation._id,
      projectId:  allocation.project,
      action:     'delete',
      editedBy: {
        userId:     req.user.id,
        employeeId: manager.employeeId,
        name:       manager.name,
        role:       manager.role,
      },
      justification: justification.trim(),
      previousData,
      newData: { status: 'inactive' },
    });

    return res.status(200).json({ success: true, message: 'Allocation removed' });
  } catch (error) {
    console.error('Error in removeAllocation:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = removeAllocation;
