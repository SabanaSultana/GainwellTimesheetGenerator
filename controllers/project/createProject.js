const Project = require('../../models/projectModel');

const createProject = async (req, res) => {
  try {
    const { projectCode, projectName, projectDescription, startDate, endDate } = req.body;

    if (!projectCode || !projectName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled',
      });
    }

    if (!/^ENT\d{4}$/i.test(projectCode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Project code must follow ENT#### format (e.g. ENT0001)',
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    const existing = await Project.findOne({ projectCode: projectCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A project with this code already exists',
      });
    }

    const newProject = new Project({
      projectCode: projectCode.trim().toUpperCase(),
      projectName: projectName.trim(),
      projectDescription: projectDescription ? projectDescription.trim() : '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user.id,
    });

    const savedProject = await newProject.save();

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        id: savedProject._id,
        projectCode: savedProject.projectCode,
        projectName: savedProject.projectName,
        projectDescription: savedProject.projectDescription,
        startDate: savedProject.startDate,
        endDate: savedProject.endDate,
      },
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

module.exports = createProject;
