const Project             = require('../../models/projectModel');
const Allocation          = require('../../models/allocationModel');
const DeptHours           = require('../../models/deptHoursModel');
const WeeklyPlan          = require('../../models/weeklyPlanModel');
const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');
const WorkLog             = require('../../models/workLogModel');
const AuditLog            = require('../../models/auditLogModel');
const User                = require('../../models/userModel');

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { justification } = req.body;

    if (!justification || !justification.trim()) {
      return res.status(400).json({ success: false, message: 'Justification is required' });
    }

    const project = await Project.findById(id).populate('createdBy', 'name employeeId');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const manager = await User.findById(req.user.id).select('name employeeId role');

    // Snapshot project data for the audit record
    const deletedProjectData = {
      projectCode:        project.projectCode,
      projectName:        project.projectName,
      projectDescription: project.projectDescription,
      startDate:          project.startDate,
      endDate:            project.endDate,
      createdBy:          project.createdBy,
      createdAt:          project.createdAt,
    };

    // Write audit record BEFORE deletion so the history is preserved
    await AuditLog.create({
      entityType:    'Project',
      entityId:      project._id,
      projectId:     project._id,
      action:        'delete',
      editedBy: {
        userId:     req.user.id,
        employeeId: manager.employeeId,
        name:       manager.name,
        role:       manager.role,
      },
      justification: justification.trim(),
      previousData:  deletedProjectData,
      newData:       null,
    });

    // Cascade-delete all operational records tied to this project
    await Promise.all([
      Allocation.deleteMany({ project: id }),
      DeptHours.deleteMany({ project: id }),
      WeeklyPlan.deleteMany({ project: id }),
      WeeklyProjectConfig.deleteMany({ project: id }),
      WorkLog.deleteMany({ project: id }),
    ]);

    await Project.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = deleteProject;
