const Project  = require('../../models/projectModel');
const DeptHours = require('../../models/deptHoursModel');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('createdBy',      'name employeeId')
      .populate('lastModifiedBy', 'name employeeId')
      .sort({ projectCode: 1 });

    // Aggregate total dept hours per project
    const hoursAgg = await DeptHours.aggregate([
      { $group: { _id: '$project', total: { $sum: '$totalHours' } } },
    ]);
    const hoursMap = {};
    hoursAgg.forEach((h) => { hoursMap[h._id.toString()] = h.total; });

    const data = projects.map((p) => ({
      ...p.toObject(),
      totalProjectHours: hoursMap[p._id.toString()] || 0,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getProjects;
