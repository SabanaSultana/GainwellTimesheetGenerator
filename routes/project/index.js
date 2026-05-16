const express        = require('express');
const router         = express.Router();
const createProject  = require('../../controllers/project/createProject');
const getProjects    = require('../../controllers/project/getProjects');
const getProjectById = require('../../controllers/project/getProjectById');
const updateProject  = require('../../controllers/project/updateProject');
const deleteProject  = require('../../controllers/project/deleteProject');
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth');

router.get('/',       authMiddleware, getProjects);
router.post('/',      authMiddleware, isManagerLevel, createProject);
router.get('/:id',    authMiddleware, getProjectById);
router.put('/:id',    authMiddleware, isManagerLevel, updateProject);
router.delete('/:id', authMiddleware, isManagerLevel, deleteProject);

module.exports = router;
