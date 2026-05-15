const Project = require('../../models/projectModel');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find(
      {},
      'projectCode projectName startDate endDate'
    ).sort({ projectCode: 1 });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

module.exports = getProjects;
