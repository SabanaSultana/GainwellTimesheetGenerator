const mongoose   = require('mongoose');
const Project    = require('../../models/projectModel');
const WeeklyPlan = require('../../models/weeklyPlanModel');
const User       = require('../../models/userModel');

function getFYWeek(date) {
  const month  = date.getMonth();
  const fyYear = month >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const apr1   = new Date(fyYear, 3, 1);
  const apr1Day = apr1.getDay() || 7;
  const fyStartMs = new Date(fyYear, 3, 2 - apr1Day).getTime();
  const daysDiff  = Math.floor((date.getTime() - fyStartMs) / 86400000);
  return { weekNum: Math.floor(daysDiff / 7) + 1, fyYear };
}

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('createdBy',      'name employeeId')
      .populate('lastModifiedBy', 'name employeeId')
      .sort({ projectCode: 1 });

    // Total planned hours — ALL employees, ALL weeks (no date filter)
    const totalPlannedAgg = await WeeklyPlan.aggregate([
      { $group: { _id: '$project', totalPlannedHrs: { $sum: '$plannedHours' } } },
    ]);
    const totalPlannedMap = {};
    totalPlannedAgg.forEach((t) => { totalPlannedMap[t._id.toString()] = t.totalPlannedHrs; });

    // Department till-now: planned hours for manager's team/dept up to today
    const today = new Date();
    const { weekNum: todayFYWeek, fyYear: todayFYYear } = getFYWeek(today);

    const managerUser  = await User.findById(req.user.id).select('department employeeId');
    const deptName     = managerUser?.department   || '';
    const managerEmpId = managerUser?.employeeId   || '';
    let deptTillNowMap = {};

    // Collect team IDs: direct reports (by managerEmployeeId) + same-department employees
    const [directReports, deptEmps] = await Promise.all([
      managerEmpId ? User.find({ managerEmployeeId: managerEmpId }).select('_id') : Promise.resolve([]),
      deptName     ? User.find({ department: deptName             }).select('_id') : Promise.resolve([]),
    ]);

    // Union of both sets, de-duplicated, as ObjectId instances
    const idSet = new Map();
    [...directReports, ...deptEmps].forEach((u) => {
      const s = u._id.toString();
      if (!idSet.has(s)) idSet.set(s, new mongoose.Types.ObjectId(u._id));
    });
    const teamUserIds = [...idSet.values()];

    console.log(`[getProjects] manager dept="${deptName}" empId="${managerEmpId}" teamSize=${teamUserIds.length} todayFY=${todayFYYear}w${todayFYWeek}`);

    if (teamUserIds.length > 0) {
      const deptAgg = await WeeklyPlan.aggregate([
        {
          $match: {
            employee: { $in: teamUserIds },
            $or: [
              { year: { $lt: todayFYYear } },
              { year: todayFYYear, weekNumber: { $lte: todayFYWeek } },
            ],
          },
        },
        { $group: { _id: '$project', deptTillNowHrs: { $sum: '$plannedHours' } } },
      ]);
      console.log(`[getProjects] deptAgg result:`, deptAgg);
      deptAgg.forEach((d) => { deptTillNowMap[d._id.toString()] = d.deptTillNowHrs; });
    }

    const data = projects.map((p) => ({
      ...p.toObject(),
      totalPlannedHrs: totalPlannedMap[p._id.toString()]  || 0,
      deptTillNowHrs:  deptTillNowMap[p._id.toString()]   || 0,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getProjects;
