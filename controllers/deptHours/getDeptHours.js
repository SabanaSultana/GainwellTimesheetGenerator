const DeptHours = require('../../models/deptHoursModel');
const WorkLog   = require('../../models/workLogModel');
const User      = require('../../models/userModel');

const getDeptHours = async (req, res) => {
  try {
    const { projectId } = req.params;

    let query = { project: projectId };

    // Manager(COE) only sees their own department
    if (req.user.role === 'Manager(COE)') {
      const editor = await User.findById(req.user.id).select('department');
      query.department = editor.department;
    }

    const deptHours = await DeptHours.find(query)
      .populate('setBy',     'name employeeId')
      .populate('updatedBy', 'name employeeId');

    // Calculate completed hours per department from submitted work logs
    const logs = await WorkLog.find({ project: projectId, status: 'submitted' });
    const completedMap = {};
    logs.forEach((log) => {
      completedMap[log.department] = (completedMap[log.department] || 0) + (log.workedHours || 0);
    });

    const enriched = deptHours.map((d) => ({
      ...d.toObject(),
      completedHours: completedMap[d.department] || 0,
      remainingHours: Math.max(0, d.totalHours - (completedMap[d.department] || 0)),
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getDeptHours:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getDeptHours;
