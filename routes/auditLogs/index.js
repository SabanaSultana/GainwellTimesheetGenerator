const express          = require('express');
const router           = express.Router();
const getAuditLogs     = require('../../controllers/auditLog/getAuditLogs');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/', authMiddleware, isManagerLevel, getAuditLogs);

module.exports = router;
