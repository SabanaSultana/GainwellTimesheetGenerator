const WeeklyProjectConfig = require('../../models/weeklyProjectConfigModel');

const getWeeklyProjectConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year, weekNumber } = req.query;

    const query = { project: projectId };
    if (year)       query.year       = Number(year);
    if (weekNumber) query.weekNumber = Number(weekNumber);

    const configs = await WeeklyProjectConfig.find(query)
      .populate('createdBy', 'name employeeId')
      .populate('updatedBy', 'name employeeId')
      .sort({ year: -1, weekNumber: -1 });

    return res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error('Error in getWeeklyProjectConfig:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getWeeklyProjectConfig;
