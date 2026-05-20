const express                    = require('express');
const router                     = express.Router();
const getWeeklyProjectConfig     = require('../../controllers/weeklyProjectConfig/getWeeklyProjectConfig');
const upsertWeeklyProjectConfig  = require('../../controllers/weeklyProjectConfig/upsertWeeklyProjectConfig');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/:projectId', authMiddleware,              getWeeklyProjectConfig);
router.post('/',          authMiddleware, isManagerLevel, upsertWeeklyProjectConfig);

module.exports = router;
