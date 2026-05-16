const Project  = require('../../models/projectModel');
const AuditLog = require('../../models/auditLogModel');
const User     = require('../../models/userModel');

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, projectDescription, startDate, endDate, justification } = req.body;

    if (!justification || !justification.trim()) {
      return res.status(400).json({ success: false, message: 'Justification is required' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const previousData = {
      projectName:        project.projectName,
      projectDescription: project.projectDescription,
      startDate:          project.startDate,
      endDate:            project.endDate,
    };

    if (projectName)              project.projectName        = projectName.trim();
    if (projectDescription !== undefined) project.projectDescription = projectDescription.trim();
    if (startDate)                project.startDate          = new Date(startDate);
    if (endDate)                  project.endDate            = new Date(endDate);

    if (project.endDate <= project.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    project.lastModifiedBy = req.user.id;
    await project.save();

    const editor = await User.findById(req.user.id).select('name employeeId role');

    await AuditLog.create({
      entityType:    'Project',
      entityId:      project._id,
      projectId:     project._id,
      action:        'update',
      editedBy: {
        userId:     req.user.id,
        employeeId: editor.employeeId,
        name:       editor.name,
        role:       editor.role,
      },
      justification: justification.trim(),
      previousData,
      newData: {
        projectName:        project.projectName,
        projectDescription: project.projectDescription,
        startDate:          project.startDate,
        endDate:            project.endDate,
      },
    });

    const updated = await Project.findById(id)
      .populate('createdBy',      'name employeeId')
      .populate('lastModifiedBy', 'name employeeId');

    return res.status(200).json({ success: true, message: 'Project updated', data: updated });
  } catch (error) {
    console.error('Error in updateProject:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = updateProject;
