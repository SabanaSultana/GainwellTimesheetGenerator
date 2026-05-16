const express          = require('express');
const router           = express.Router();
const getWeeklyPlans   = require('../../controllers/weeklyPlan/getWeeklyPlans');
const upsertWeeklyPlan = require('../../controllers/weeklyPlan/upsertWeeklyPlan');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/:projectId', authMiddleware, getWeeklyPlans);
router.post('/',          authMiddleware, isManagerLevel, upsertWeeklyPlan);

module.exports = router;
