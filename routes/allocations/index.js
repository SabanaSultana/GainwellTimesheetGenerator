const express          = require('express');
const router           = express.Router();
const getAllocations    = require('../../controllers/allocation/getAllocations');
const allocateEmployee = require('../../controllers/allocation/allocateEmployee');
const removeAllocation = require('../../controllers/allocation/removeAllocation');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/:projectId', authMiddleware, isManagerLevel, getAllocations);
router.post('/',          authMiddleware, isManagerLevel, allocateEmployee);
router.delete('/:id',     authMiddleware, isManagerLevel, removeAllocation);

module.exports = router;
