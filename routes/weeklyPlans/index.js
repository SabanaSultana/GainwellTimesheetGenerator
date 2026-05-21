const express                  = require('express');
const router                   = express.Router();
const getWeeklyPlans           = require('../../controllers/weeklyPlan/getWeeklyPlans');
const upsertWeeklyPlan         = require('../../controllers/weeklyPlan/upsertWeeklyPlan');
const getAllWeeklyPlans         = require('../../controllers/weeklyPlan/getAllWeeklyPlans');
const bulkUpsertWeeklyPlan     = require('../../controllers/weeklyPlan/bulkUpsertWeeklyPlan');
const getEmployeeWeekCapacity  = require('../../controllers/weeklyPlan/getEmployeeWeekCapacity');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

// Static routes must come before /:projectId to avoid being matched as a project ID
router.get('/all',               authMiddleware, isManagerLevel, getAllWeeklyPlans);
router.get('/employee-capacity', authMiddleware, isManagerLevel, getEmployeeWeekCapacity);
router.get('/:projectId',        authMiddleware,                 getWeeklyPlans);
router.post('/bulk',      authMiddleware, isManagerLevel, bulkUpsertWeeklyPlan);
router.post('/',          authMiddleware, isManagerLevel, upsertWeeklyPlan);

module.exports = router;
