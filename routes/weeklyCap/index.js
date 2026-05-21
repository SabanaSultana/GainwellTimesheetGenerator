const express    = require('express');
const router     = express.Router();
const getWeeklyCap = require('../../controllers/weeklyCap/getWeeklyCap');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/', authMiddleware, isManagerLevel, getWeeklyCap);

module.exports = router;
