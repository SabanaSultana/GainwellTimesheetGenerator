const Project    = require('../../models/projectModel');
const DeptHours  = require('../../models/deptHoursModel');
const Allocation = require('../../models/allocationModel');
const AuditLog   = require('../../models/auditLogModel');

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('createdBy',      'name employeeId role department')
      .populate('lastModifiedBy', 'name employeeId role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const deptHours = await DeptHours.find({ project: id })
      .populate('setBy',     'name employeeId')
      .populate('updatedBy', 'name employeeId');

    const allocations = await Allocation.find({ project: id, status: 'active' })
      .populate('employee',    'name employeeId department role')
      .populate('allocatedBy', 'name employeeId');

    const auditLogs = await AuditLog.find({ entityId: id })
      .sort({ editedAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: { project, deptHours, allocations, auditLogs },
    });
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getProjectById;
