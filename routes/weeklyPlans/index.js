const express              = require('express');
const router               = express.Router();
const getWeeklyPlans       = require('../../controllers/weeklyPlan/getWeeklyPlans');
const upsertWeeklyPlan     = require('../../controllers/weeklyPlan/upsertWeeklyPlan');
const getAllWeeklyPlans     = require('../../controllers/weeklyPlan/getAllWeeklyPlans');
const bulkUpsertWeeklyPlan = require('../../controllers/weeklyPlan/bulkUpsertWeeklyPlan');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

// /all must come before /:projectId to avoid being matched as a projectId
router.get('/all',       authMiddleware, isManagerLevel, getAllWeeklyPlans);
router.get('/:projectId', authMiddleware,               getWeeklyPlans);
router.post('/bulk',      authMiddleware, isManagerLevel, bulkUpsertWeeklyPlan);
router.post('/',          authMiddleware, isManagerLevel, upsertWeeklyPlan);

module.exports = router;
