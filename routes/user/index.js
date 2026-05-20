const express = require('express')
const router = express.Router()
const {
    getUserById,
    getUserByEmployeeId,
    getAllUsers,
    getUsersByDepartment,
    getUsersByRole,
    getUsersByManagerId
} = require('../../controllers/user/getUser')
const userSignUp      = require('../../controllers/user/userSignUp')
const userLogin       = require('../../controllers/user/userLogin')
const userLogout      = require('../../controllers/user/userLogout')
const getTeamMembers  = require('../../controllers/team/getTeamMembers')
const { authMiddleware, isManagerLevel } = require('../../middlewares/auth')

router.post('/signup', userSignUp)
router.post('/login', userLogin)
router.post('/logout', userLogout)

router.get('/team', authMiddleware, isManagerLevel, getTeamMembers)
router.get('/', getAllUsers)
router.get('/id/:id', getUserById)
router.get('/employee/:employeeId', getUserByEmployeeId)
router.get('/department/:department', getUsersByDepartment)
router.get('/role/:role', getUsersByRole)
router.get('/manager/:managerEmployeeId', getUsersByManagerId)

module.exports = router
