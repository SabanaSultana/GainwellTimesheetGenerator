const WeeklyPlan = require('../../models/weeklyPlanModel');
const WeeklyCap  = require('../../models/weeklyCapModel');
const User       = require('../../models/userModel');
const mongoose   = require('mongoose');

const getEmployeeWeekCapacity = async (req, res) => {
  try {
    const { year, weekNumber, excludeProjectId } = req.query;
    if (!year || !weekNumber) {
      return res.status(400).json({ success: false, message: 'year and weekNumber are required' });
    }

    const match = { year: Number(year), weekNumber: Number(weekNumber) };
    if (excludeProjectId && mongoose.Types.ObjectId.isValid(excludeProjectId)) {
      match.project = { $ne: new mongoose.Types.ObjectId(excludeProjectId) };
    }

    // Manager(COE) only sees capacity for their own direct reports
    if (req.user.role === 'Manager(COE)') {
      const mgr     = await User.findById(req.user.id).select('employeeId');
      const reports = await User.find({ managerEmployeeId: mgr.employeeId }).select('_id');
      match.employee = { $in: reports.map((e) => new mongoose.Types.ObjectId(e._id)) };
    }

    const [agg, weeklyCap] = await Promise.all([
      WeeklyPlan.aggregate([
        { $match: match },
        { $group: { _id: '$employee', totalPlanned: { $sum: '$plannedHours' } } },
      ]),
      WeeklyCap.findOne({ year: Number(year), weekNumber: Number(weekNumber) }),
    ]);

    const data = {};
    agg.forEach((row) => { data[row._id.toString()] = row.totalPlanned; });

    return res.status(200).json({
      success: true,
      data,
      weekCap: weeklyCap ? weeklyCap.totalWeeklyHours : null,
    });
  } catch (error) {
    console.error('Error in getEmployeeWeekCapacity:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getEmployeeWeekCapacity;
