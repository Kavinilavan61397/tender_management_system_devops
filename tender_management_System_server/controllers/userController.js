const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { logAction } = require('./auditLogController');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
const getUsers = async (req, res) => {
    try {
        const { role, isVerified } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin only
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user role or details (Admin)
// @route   PUT /api/users/:id
// @access  Admin only
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, role, isVerified, profile } = req.body;

        if (name) user.name = name;
        if (role) user.role = role;
        if (isVerified !== undefined) user.isVerified = isVerified;
        if (profile) user.profile = { ...user.profile, ...profile };

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
            profile: updatedUser.profile,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify a vendor (approve registration)
// @route   PUT /api/users/:id/verify
// @access  Admin only
const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        // Notify vendor
        createNotification({
            recipient: user._id,
            type: 'VENDOR_VERIFIED',
            title: 'Account Verified! ✅',
            message: 'Your account has been verified. You can now submit bids on tenders.',
            link: '/tenders'
        });

        res.json({ message: `${user.name} has been verified successfully`, user });

        logAction({ action: 'USER_VERIFIED', performedBy: req.user._id, targetType: 'USER', targetId: user._id, description: `Verified vendor "${user.name}"`, ipAddress: req.ip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject/Unverify a vendor
// @route   PUT /api/users/:id/reject
// @access  Admin only
const rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = false;
        await user.save();

        // Notify vendor
        createNotification({
            recipient: user._id,
            type: 'VENDOR_REJECTED',
            title: 'Account Rejected',
            message: 'Your vendor account has been rejected. Contact support for more info.',
            link: '/dashboard'
        });

        res.json({ message: `${user.name} has been rejected`, user });

        logAction({ action: 'USER_REJECTED', performedBy: req.user._id, targetType: 'USER', targetId: user._id, description: `Rejected vendor "${user.name}"`, ipAddress: req.ip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin only
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create employee (Admin creates internal users)
// @route   POST /api/users/create-employee
// @access  Admin only
const createEmployee = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Only allow creating internal roles
        const allowedRoles = ['ADMIN', 'EVALUATOR', 'MANAGER', 'DIRECTOR'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Use: ADMIN, EVALUATOR, MANAGER, or DIRECTOR' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            isVerified: true // Employees are pre-verified
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getUsers, getUserById, updateUser, verifyUser, rejectUser, deleteUser, createEmployee };
