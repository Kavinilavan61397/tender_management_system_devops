const AuditLog = require('../models/AuditLog');

// Helper: log an action (non-blocking, fire-and-forget)
const logAction = async ({ action, performedBy, targetType, targetId, description, metadata = {}, ipAddress = '' }) => {
    try {
        await AuditLog.create({ action, performedBy, targetType, targetId, description, metadata, ipAddress });
    } catch (error) {
        console.error('Audit log failed:', error.message);
    }
};

// @desc    Get audit logs (paginated, filterable)
// @route   GET /api/audit-logs
// @access  Admin only
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 25, action, targetType, performedBy, startDate, endDate } = req.query;

        const filter = {};
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;
        if (performedBy) filter.performedBy = performedBy;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('performedBy', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter)
        ]);

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get audit log stats (summary)
// @route   GET /api/audit-logs/stats
// @access  Admin only
const getAuditStats = async (req, res) => {
    try {
        const [byAction, byTargetType, recentCount] = await Promise.all([
            AuditLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            AuditLog.aggregate([
                { $group: { _id: '$targetType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            AuditLog.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
        ]);

        res.json({ byAction, byTargetType, recentCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { logAction, getAuditLogs, getAuditStats };
