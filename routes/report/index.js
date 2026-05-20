const express         = require('express');
const router          = express.Router();
const generateReport  = require('../../controllers/report/generateReport');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.post('/generate', authMiddleware, isManagerLevel, generateReport);

module.exports = router;
