const express         = require('express');
const router          = express.Router();
const getDeptHours    = require('../../controllers/deptHours/getDeptHours');
const upsertDeptHours = require('../../controllers/deptHours/upsertDeptHours');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/:projectId', authMiddleware, isManagerLevel, getDeptHours);
router.post('/',          authMiddleware, isManagerLevel, upsertDeptHours);

module.exports = router;
