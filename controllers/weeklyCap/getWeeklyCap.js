const WeeklyCap = require('../../models/weeklyCapModel');

const getWeeklyCap = async (req, res) => {
  try {
    const { year, weekNumber } = req.query;
    if (!year || !weekNumber) {
      return res.status(400).json({ success: false, message: 'year and weekNumber are required' });
    }
    const cap = await WeeklyCap.findOne({ year: Number(year), weekNumber: Number(weekNumber) });
    return res.status(200).json({ success: true, data: cap || null });
  } catch (error) {
    console.error('Error in getWeeklyCap:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = getWeeklyCap;
