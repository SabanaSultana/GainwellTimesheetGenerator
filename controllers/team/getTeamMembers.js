const User       = require('../../models/userModel');
const Allocation = require('../../models/allocationModel');
const WeeklyPlan = require('../../models/weeklyPlanModel');
const Project    = require('../../models/projectModel');

const getTeamMembers = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id).select('employeeId department role');
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const employees = await User.find({
      managerEmployeeId: manager.employeeId,
      role: 'Employee',
    }).select('name employeeId department role email');

    const now         = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNo      = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const currentYear = now.getFullYear();

    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const allocations = await Allocation.find({ employee: emp._id, status: 'active' })
          .populate('project', 'projectCode projectName');

        const allocatedProjectIds = new Set(
          allocations.map((a) => String(a.project?._id)).filter(Boolean)
        );

        // Include plan-only projects (no active allocation)
        const planProjectIds = await WeeklyPlan.distinct('project', { employee: emp._id });
        const planOnlyIds    = planProjectIds.filter((id) => !allocatedProjectIds.has(String(id)));

        let planProjects = [];
        if (planOnlyIds.length > 0) {
          const projs = await Project.find({ _id: { $in: planOnlyIds } })
            .select('projectCode projectName');
          planProjects = projs.map((p) => ({
            projectCode:    p.projectCode,
            projectName:    p.projectName,
            allocatedHours: 0,
            fromPlan:       true,
          }));
        }

        const assignedProjects = [
          ...allocations.map((a) => ({
            projectCode:    a.project?.projectCode,
            projectName:    a.project?.projectName,
            allocatedHours: a.totalAllocatedHours,
            fromPlan:       false,
          })),
          ...planProjects,
        ];

        return {
          ...emp.toObject(),
          assignedProjects,
          activeProjectCount: assignedProjects.length,
          currentWeek:  weekNo,
          currentYear,
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error in getTeamMembers:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getTeamMembers;
