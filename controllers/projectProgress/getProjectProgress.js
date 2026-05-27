const ProjectProgress = require('../../models/projectProgressModel');

const getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;

    // All Manager(COE) and Admin can see all departments' progress
    const progress = await ProjectProgress.find({ project: projectId })
      .populate('updatedBy', 'name employeeId department');

    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error('Error in getProjectProgress:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getProjectProgress;
