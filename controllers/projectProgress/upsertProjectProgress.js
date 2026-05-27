const ProjectProgress = require('../../models/projectProgressModel');

const upsertProjectProgress = async (req, res) => {
  try {
    const { projectId, department, progress } = req.body;

    if (!projectId || !department || progress === undefined || progress === null) {
      return res.status(400).json({
        success: false,
        message: 'projectId, department, and progress are required',
      });
    }

    const n = Number(progress);
    if (isNaN(n) || n < 0 || n > 100) {
      return res.status(400).json({ success: false, message: 'Progress must be between 0 and 100' });
    }

    const record = await ProjectProgress.findOneAndUpdate(
      { project: projectId, department },
      { progress: n, updatedBy: req.user.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('updatedBy', 'name employeeId department');

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in upsertProjectProgress:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = upsertProjectProgress;
