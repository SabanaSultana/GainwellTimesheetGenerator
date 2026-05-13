const User = require('../../models/userModel')


// _________________________________Get User by MongoDB ID____________________________

const getUserById = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.status(400).json({ success: false, message: 'User ID is required' })

        const user = await User.findById(id).select('-password')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.status(200).json({ success: true, data: user })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


// ____________________________Get User by Employee ID________________________________

const getUserByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params
        if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID is required' })

        const user = await User.findOne({ employeeId }).select('-password')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.status(200).json({ success: true, data: user })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


// ____________________________Get All Users___________________________________________

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password')
        res.status(200).json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


// ____________________________Get Users by Department___________________________________

const getUsersByDepartment = async (req, res) => {
    try {
        const { department } = req.params
        if (!department) return res.status(400).json({ success: false, message: 'Department is required' })

        const users = await User.find({ department }).select('-password')
        res.status(200).json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


// ____________________________Get Users by Role___________________________________________

const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params
        if (!role) return res.status(400).json({ success: false, message: 'Role is required' })

        const users = await User.find({ role }).select('-password')
        res.status(200).json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


// ____________________________Get Users by Manager Employee ID___________________________________________

const getUsersByManagerId = async (req, res) => {
    try {
        const { managerEmployeeId } = req.params
        if (!managerEmployeeId) return res.status(400).json({ success: false, message: 'Manager Employee ID is required' })

        const users = await User.find({ managerEmployeeId }).select('-password')
        res.status(200).json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
}


module.exports = { getUserById, getUserByEmployeeId, getAllUsers, getUsersByDepartment, getUsersByRole, getUsersByManagerId }
