const Allocation = require('../../models/allocationModel');
const WorkLog    = require('../../models/workLogModel');
const User       = require('../../models/userModel');

const getAllocations = async (req, res) => {
  try {
    const { projectId } = req.params;

    let query = { project: projectId, status: 'active' };

    // Manager(COE) only sees allocations for their own department
    if (req.user.role === 'Manager(COE)') {
      const manager = await User.findById(req.user.id).select('department');
      query.department = manager.department;
    }

    const allocations = await Allocation.find(query)
      .populate('employee',    'name employeeId department role')
      .populate('allocatedBy', 'name employeeId');

    // Calculate consumed hours per employee from submitted work logs
    const logs = await WorkLog.find({ project: projectId, status: 'submitted' });
    const consumedMap = {};
    logs.forEach((log) => {
      consumedMap[log.employeeId] = (consumedMap[log.employeeId] || 0) + (log.workedHours || 0);
    });

    const enriched = allocations.map((a) => ({
      ...a.toObject(),
      consumedHours:   consumedMap[a.employeeId] || 0,
      remainingHours:  Math.max(0, a.totalAllocatedHours - (consumedMap[a.employeeId] || 0)),
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getAllocations:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getAllocations;
