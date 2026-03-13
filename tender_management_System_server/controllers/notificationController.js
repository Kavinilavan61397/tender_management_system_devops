const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: create a notification
const createNotification = async ({ recipient, type, title, message, link = '', metadata = {} }) => {
    try {
        return await Notification.create({ recipient, type, title, message, link, metadata });
    } catch (error) {
        console.error('Failed to create notification:', error.message);
    }
};

// Helper: notify all users with specific roles
const notifyByRole = async (roles, { type, title, message, link = '', metadata = {} }) => {
    try {
        const users = await User.find({ role: { $in: roles } }).select('_id');
        const notifications = users.map(u => ({
            recipient: u._id, type, title, message, link, metadata
        }));
        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Failed to notify by role:', error.message);
    }
};

// @desc    Get my notifications
// @route   GET /api/notifications
const getMyNotifications = async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const filter = { recipient: req.user._id };
        if (unreadOnly === 'true') filter.read = false;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createNotification,
    notifyByRole,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
