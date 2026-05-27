const express                  = require('express');
const router                   = express.Router();
const getProjectProgress       = require('../../controllers/projectProgress/getProjectProgress');
const upsertProjectProgress    = require('../../controllers/projectProgress/upsertProjectProgress');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/:projectId', authMiddleware, isManagerLevel, getProjectProgress);
router.post('/',          authMiddleware, isManagerLevel, upsertProjectProgress);

module.exports = router;
