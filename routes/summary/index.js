const express           = require('express');
const router            = express.Router();
const getWeeklySummary  = require('../../controllers/summary/getWeeklySummary');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/', authMiddleware, isManagerLevel, getWeeklySummary);

module.exports = router;
