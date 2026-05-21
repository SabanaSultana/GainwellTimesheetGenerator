const express                = require('express');
const router                 = express.Router();
const getWorkLogs            = require('../../controllers/workLog/getWorkLogs');
const submitWorkLog          = require('../../controllers/workLog/submitWorkLog');
const getEmployeeProjects    = require('../../controllers/workLog/getEmployeeProjects');
const managerUpdateWorkLog   = require('../../controllers/workLog/managerUpdateWorkLog');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

// Must be before /:projectId to avoid conflict
router.get('/employee-projects',  authMiddleware,                      getEmployeeProjects);
router.post('/manager-update',    authMiddleware, isManagerLevel,      managerUpdateWorkLog);

router.get('/:projectId', authMiddleware, getWorkLogs);
router.post('/',          authMiddleware, submitWorkLog);

module.exports = router;
