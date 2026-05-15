const express = require('express');
const router = express.Router();
const createProject = require('../../controllers/project/createProject');
const getProjects = require('../../controllers/project/getProjects');
const { authMiddleware } = require('../../middlewares/auth');

router.get('/', authMiddleware, getProjects);
router.post('/', authMiddleware, createProject);

module.exports = router;
